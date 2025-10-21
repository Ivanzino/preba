from flask import Blueprint, jsonify, session, render_template, request
from flask_mysqldb import MySQL
from routes.gestor import login_required

# colorama para consola
from colorama import Fore, Style, init
init(autoreset=True)

generar_bp = Blueprint('generar', __name__)
mysql = MySQL()

# ======================================================
# UTILIDADES DE HORARIOS (SIN HUECOS + RANKING/TRIMMING)
# ======================================================
MAX_OPCIONES = 250  # cuántas opciones como máximo por (comp,perfil)

def _h(hhmm):
    h, m = map(int, hhmm.split(":"))
    return h * 60 + m

def _fmt(mins):
    h, m = divmod(mins, 60)
    return f"{h:02d}:{m:02d}"

def _ventanas_y_bloques(jornada, intensidad):
    """
    Define ventanas y tamaños válidos por día.
    Reglas:
      - Mañana:   L-V 06:00–12:00, bloques 2/3/4/6
      - Tarde:    L-V 12:00–18:00, bloques 2/3/4/6
      - Mixta:    L-V 18:00–22:00 (2/4) y Sábado:
                    * Int 1: 16:00–22:00  -> 2/3/4/6
                    * Int 2: 14:00–22:00  -> 2/3/4/6/8
    """
    dias = ["LUN", "MAR", "MIÉ", "JUE", "VIE"]
    ventanas, bloques = {}, {}

    if jornada == "mañana":
        for d in dias:
            ventanas[d] = (_h("06:00"), _h("12:00"))
            bloques[d] = [2, 3, 4, 6]
    elif jornada == "tarde":
        for d in dias:
            ventanas[d] = (_h("12:00"), _h("18:00"))
            bloques[d] = [2, 3, 4, 6]
    else:  # mixta
        for d in dias:
            ventanas[d] = (_h("18:00"), _h("22:00"))
            bloques[d] = [2, 4]
        if int(intensidad) == 1:
            ventanas["SAB"] = (_h("16:00"), _h("22:00"))
            bloques["SAB"] = [2, 3, 4, 6]
        else:
            ventanas["SAB"] = (_h("14:00"), _h("22:00"))
            bloques["SAB"] = [2, 3, 4, 6, 8]
        dias.append("SAB")

    return dias, ventanas, bloques

def _starts_para_tamano(ini, fin, tam_horas):
    """
    Inicios válidos para un bloque COMPLETO dentro de la ventana,
    siempre alineados al inicio real de la jornada (SIN dejar huecos).
    """
    res = []
    dur = tam_horas * 60
    rango = fin - ini
    if dur == rango:
        return [(_fmt(ini), _fmt(fin))]
    t = ini
    while t + dur <= fin:
        res.append((_fmt(t), _fmt(t + dur)))
        t += dur
    return res

def _comb_suma_horas(horas_objetivo, allowed_global):
    """
    Combinaciones únicas de tamaños que suman 'horas_objetivo' (enteras).
    Uso backtracking en orden no-decreciente para evitar duplicados.
    """
    res = []
    allowed = sorted(set(allowed_global))
    def dfs(idx, rest, cur):
        if rest == 0:
            res.append(list(cur)); return
        if rest < 0:
            return
        for i in range(idx, len(allowed)):
            t = allowed[i]
            if t > rest: break
            cur.append(t)
            dfs(i, rest - t, cur)
            cur.pop()
            if len(res) >= 5000:
                return
    dfs(0, int(horas_objetivo), [])
    return res

def _asignar_a_dias(comb, dias, ventanas, bloques_por_dia):
    """
    Dada una combinación [2,4,4], genera asignaciones válidas a días,
    y para cada día, TODAS las posiciones válidas (sin huecos).
    """
    from itertools import permutations, combinations, product
    opciones = []
    n = len(comb)

    def permutaciones_unicas(seq):
        seen = set()
        for p in permutations(seq, len(seq)):
            if p in seen: continue
            seen.add(p)
            yield p

    dias_validos = [d for d in dias if d in bloques_por_dia]
    for dias_sel in combinations(dias_validos, n):
        for asign in permutaciones_unicas(comb):
            ok = True
            lista_pos = []
            for tam, d in zip(asign, dias_sel):
                if tam not in bloques_por_dia[d]: ok = False; break
                ini, fin = ventanas[d]
                if (fin - ini)//60 < tam: ok = False; break
                pos = _starts_para_tamano(ini, fin, tam)
                if not pos: ok = False; break
                lista_pos.append([(d, a, b) for (a, b) in pos])
            if not ok: continue

            for seleccion in product(*lista_pos):
                slots = [{"dia": d, "desde": a, "hasta": b} for (d, a, b) in seleccion]
                orden = {dd:i for i,dd in enumerate(["LUN","MAR","MIÉ","JUE","VIE","SAB"])}
                slots.sort(key=lambda s: (orden.get(s["dia"],99), s["desde"]))
                opciones.append({"slots": slots})
                if len(opciones) >= MAX_OPCIONES:
                    return opciones
    return opciones

def _rank_and_trim(opciones, preferencia="balanceado", top_n=40):
    """
    Ranking + recorte para devolver "las mejores" y no saturar el front.
    """
    import statistics

    def horas_por_dia(slots):
        d = {}
        for s in slots:
            h1,m1 = map(int, s["desde"].split(":"))
            h2,m2 = map(int, s["hasta"].split(":"))
            d[s["dia"]] = d.get(s["dia"],0) + ((h2*60+m2)-(h1*60+m1))/60.0
        return d

    def usa_sab(slots): return any(s["dia"]=="SAB" for s in slots)
    def earliest(slots):
        return min(map(lambda s: int(s["desde"][:2])*60 + int(s["desde"][3:5]), slots))

    def score(op):
        h = horas_por_dia(op["slots"])
        vals = list(h.values())
        var = statistics.pvariance(vals) if len(vals)>1 else 0.0
        n_dias = len(vals)
        sab = 1 if usa_sab(op["slots"]) else 0
        e = earliest(op["slots"])
        if preferencia == "compacto":
            return (n_dias, var, sab, e)
        if preferencia == "temprano":
            return (sab, e, var, n_dias)
        return (var, sab, n_dias, e)

    ords = sorted(opciones, key=score)

    buckets = {}
    for op in ords:
        k = (usa_sab(op["slots"]), len(set(s["dia"] for s in op["slots"])))
        buckets.setdefault(k, []).append(op)

    out = []
    agot = False
    while len(out) < top_n and not agot:
        agot = True
        for k in list(buckets.keys()):
            if buckets[k]:
                out.append(buckets[k].pop(0))
                agot = False
            if len(out) >= top_n: break
    return out

def _opciones_exhaustivas(horas_semana, jornada, intensidad, preferencia="balanceado"):
    """
    Genera opciones válidas: combinaciones de tamaños, asignación a días y
    posiciones alineadas al inicio real (sin huecos). Luego ranking+recorte.
    """
    import math
    H = int(math.ceil(float(horas_semana)))
    dias, ventanas, bloques = _ventanas_y_bloques(jornada, intensidad)

    if jornada in ("mañana","tarde"):
        allowed_global = [2,3,4,6]
    else:
        allowed_global = sorted(set([2,4] + bloques["SAB"]))

    combs = _comb_suma_horas(H, allowed_global)

    todas = []
    for comb in combs:
        ops = _asignar_a_dias(comb, dias, ventanas, bloques)
        todas.extend(ops)
        if len(todas) >= MAX_OPCIONES*3:
            break

    vistos, unicas = set(), []
    for op in todas:
        firma = tuple((s["dia"], s["desde"], s["hasta"]) for s in op["slots"])
        if firma in vistos: 
            continue
        vistos.add(firma)
        titulo = " · ".join(f'{s["dia"]} {s["desde"]}–{s["hasta"]}' for s in op["slots"])
        unicas.append({"titulo": titulo, "slots": op["slots"]})

    return _rank_and_trim(unicas, preferencia=preferencia, top_n=MAX_OPCIONES)

# ======================================================
# HELPERS PARA TABLAS DE CONSOLA
# ======================================================
def _wrap(text, width=70):
    """
    Envuelve texto preservando saltos de línea.
    """
    import textwrap
    if text is None:
        return ""
    s = str(text).strip()
    lines = s.split('\n')
    wrapped_lines = []
    for line in lines:
        line_norm = " ".join(line.split())
        parts = textwrap.wrap(line_norm, width=width, replace_whitespace=False)
        if not parts:
            wrapped_lines.append('')
        else:
            wrapped_lines.extend(parts)
    return "\n".join(wrapped_lines)

def _obtener_raps_y_perfiles_por_malla_trimestre(cursor, id_malla, trimestre_numero):
    """
    Obtiene raps del trimestre actual + perfiles asociados a cada RAP
    """
    lista = []
    cursor.execute("""
        SELECT DISTINCT id_raps
        FROM distribucion_raps
        WHERE id_malla = %s AND trimestre = %s
    """, (id_malla, trimestre_numero))
    raps_rows = cursor.fetchall()

    for row in raps_rows:
        id_rap = row[0]
        cursor.execute("SELECT descripcion FROM raps WHERE id_raps = %s", (id_rap,))
        r = cursor.fetchone()
        descripcion = r[0] if r and r[0] is not None else f"rap_{id_rap}"

        cursor.execute("""
            SELECT p.nombre
            FROM perfiles_raps pr
            JOIN perfiles p ON pr.id_perfil = p.id_perfil
            WHERE pr.id_raps = %s
        """, (id_rap,))
        perfiles_rows = cursor.fetchall()
        perfiles = [p[0] for p in perfiles_rows] if perfiles_rows else []

        lista.append({
            'id_rap': id_rap,
            'descripcion': descripcion,
            'perfiles': perfiles
        })
    return lista

def _obtener_perfiles_instr_y_raps(cursor, ficha_id_instructor_cedula):
    """
    Obtiene perfiles del instructor y RAPS asociados a cada perfil
    """
    resultado = []

    cursor.execute("SELECT id_instructor FROM instructores WHERE cedula = %s", (ficha_id_instructor_cedula,))
    row = cursor.fetchone()
    if not row:
        return resultado
    id_instructor_num = row[0]

    cursor.execute("SELECT id_perfil FROM perfil_instructor WHERE id_instructor = %s", (id_instructor_num,))
    perfiles_rows = cursor.fetchall()

    for pr in perfiles_rows:
        id_perfil = pr[0]
        cursor.execute("SELECT nombre FROM perfiles WHERE id_perfil = %s", (id_perfil,))
        r = cursor.fetchone()
        perfil_nombre = r[0] if r and r[0] is not None else f"perfil_{id_perfil}"

        cursor.execute("""
            SELECT DISTINCT rp.id_raps, r.descripcion
            FROM perfiles_raps rp
            JOIN raps r ON rp.id_raps = r.id_raps
            WHERE rp.id_perfil = %s
        """, (id_perfil,))
        raps_rows = cursor.fetchall()
        raps_list = [row_rap[1] for row_rap in raps_rows] if raps_rows else []

        resultado.append({
            'id_perfil': id_perfil,
            'perfil_nombre': perfil_nombre,
            'raps': raps_list
        })

    return resultado

def _calcular_horas_slot(slot):
    """Calcula la duración en horas de un slot"""
    try:
        inicio = slot.get('desde', '00:00')
        fin = slot.get('hasta', '00:00')
        h1, m1 = map(int, inicio.split(':'))
        h2, m2 = map(int, fin.split(':'))
        minutos = (h2 * 60 + m2) - (h1 * 60 + m1)
        return minutos / 60.0
    except:
        return 0.0

def _imprimir_propuestas_consola(propuestas, max_por_grupo=10):
    """
    Imprime las propuestas de horarios en consola de forma organizada
    usando tabulate y colorama
    """
    from tabulate import tabulate
    
    if not propuestas:
        print(Fore.YELLOW + "  (No hay propuestas de horarios generadas)")
        return
    
    print(Fore.MAGENTA + "\nTabla C) Propuestas de distribución horaria por competencia/perfil:")
    print(Fore.GREEN + "="*120)
    
    for idx, prop in enumerate(propuestas, 1):
        # Encabezado del grupo
        print(Fore.CYAN + Style.BRIGHT + f"\n[{idx}] {prop['clave']}")
        print(Fore.WHITE + f"    Total horas trimestre: {prop['total_horas']}h → {prop['horas_semana']} h/semana")
        
        # Mostrar RAPs del grupo
        if prop.get('rap_nombres'):
            print(Fore.WHITE + "    RAPs incluidos:")
            for rap in prop['rap_nombres'][:5]:  # máximo 5 para no saturar
                rap_wrapped = _wrap(rap, 100)
                for line in rap_wrapped.split('\n'):
                    print(Fore.WHITE + f"      • {line}")
            if len(prop['rap_nombres']) > 5:
                print(Fore.YELLOW + f"      ... y {len(prop['rap_nombres'])-5} RAPs más")
        
        # Mostrar opciones de horarios
        opciones = prop.get('opciones', [])
        total_opciones = len(opciones)
        
        if total_opciones == 0:
            print(Fore.YELLOW + "    ⚠ No se generaron opciones válidas")
            continue
        
        print(Fore.GREEN + f"\n    📋 Mostrando {min(max_por_grupo, total_opciones)} de {total_opciones} opciones generadas:")
        print(Fore.GREEN + "    " + "-"*116)
        
        # Mostrar hasta max_por_grupo opciones
        for op_idx, opcion in enumerate(opciones[:max_por_grupo], 1):
            slots = opcion.get('slots', [])
            
            # Preparar tabla para esta opción
            tabla_opcion = []
            for slot in slots:
                tabla_opcion.append([
                    slot.get('dia', '---'),
                    slot.get('desde', '---'),
                    slot.get('hasta', '---'),
                    f"{_calcular_horas_slot(slot):.1f}h"
                ])
            
            # Imprimir tabla de la opción
            print(Fore.YELLOW + f"\n    Opción {op_idx}:")
            try:
                tabla_str = tabulate(
                    tabla_opcion,
                    headers=["Día", "Inicio", "Fin", "Duración"],
                    tablefmt="fancy_grid",
                    stralign="center"
                )
                # Indentar cada línea de la tabla
                for linea in tabla_str.split('\n'):
                    print(Fore.WHITE + "    " + linea)
            except Exception:
                # Fallback a grid simple si fancy_grid falla
                tabla_str = tabulate(
                    tabla_opcion,
                    headers=["Día", "Inicio", "Fin", "Duración"],
                    tablefmt="grid"
                )
                for linea in tabla_str.split('\n'):
                    print(Fore.WHITE + "    " + linea)
        
        if total_opciones > max_por_grupo:
            print(Fore.CYAN + f"\n    💡 Hay {total_opciones - max_por_grupo} opciones más disponibles para este grupo")
        
        print(Fore.GREEN + "    " + "-"*116)

# ======================================================
# AGRUPAR RAPS -> (comp, perfil) y calcular opciones
# ======================================================
def _calcular_bloques_por_ficha(cursor, id_malla, trimestre_numero, jornada, intensidad, preferencia="balanceado"):
    cursor.execute("""
        SELECT
            dr.id_raps,
            dr.horas_ejecucion,
            r.id_comp,
            r.descripcion            AS rap_nombre,
            c.nombre                 AS comp_nombre
        FROM distribucion_raps dr
        JOIN raps r           ON r.id_raps = dr.id_raps
        JOIN competencias c   ON c.id_comp = r.id_comp
        WHERE dr.id_malla = %s AND dr.trimestre = %s
    """, (id_malla, trimestre_numero))
    rows = cursor.fetchall()
    if not rows:
        return {"requerimientos": []}

    # perfiles por RAP
    rap_perfiles = {}
    for id_rap, *_ in rows:
        cursor.execute("""
            SELECT pr.id_perfil, p.nombre
            FROM perfiles_raps pr
            JOIN perfiles p ON p.id_perfil = pr.id_perfil
            WHERE pr.id_raps = %s
        """, (id_rap,))
        rap_perfiles[id_rap] = cursor.fetchall() or []

    # agrupar por (id_comp, id_perfil | SIN_PERFIL)
    grupos = {}
    for (id_rap, horas, id_comp, rap_nombre, comp_nombre) in rows:
        perfiles = rap_perfiles.get(id_rap, [])
        if perfiles:
            for (id_perfil, perfil_nombre) in perfiles:
                key = (id_comp, id_perfil)
                grupos.setdefault(key, {
                    "rap_ids": set(), "rap_nombres": [], "horas": 0,
                    "comp_nombre": comp_nombre, "perfil_nombre": perfil_nombre
                })
                grupos[key]["rap_ids"].add(id_rap)
                grupos[key]["rap_nombres"].append(rap_nombre)
                grupos[key]["horas"] += int(horas or 0)
        else:
            key = (id_comp, "SIN_PERFIL")
            grupos.setdefault(key, {
                "rap_ids": set(), "rap_nombres": [], "horas": 0,
                "comp_nombre": comp_nombre, "perfil_nombre": "SIN PERFIL"
            })
            grupos[key]["rap_ids"].add(id_rap)
            grupos[key]["rap_nombres"].append(rap_nombre)
            grupos[key]["horas"] += int(horas or 0)

    requerimientos = []
    for (id_comp, id_perfil), data in grupos.items():
        total_horas = data["horas"]
        horas_semana = round(total_horas / 11.0, 2)

        opciones = _opciones_exhaustivas(horas_semana, jornada, intensidad, preferencia=preferencia)

        comp_nombre = data["comp_nombre"] or f"comp {id_comp}"
        perfil_nombre = data["perfil_nombre"] or f"perfil {id_perfil}"
        requerimientos.append({
            "clave": f"Competencia: {comp_nombre} | Perfil: {perfil_nombre}",
            "comp_nombre": comp_nombre,
            "perfil_nombre": perfil_nombre,
            "rap_ids": sorted(list(data["rap_ids"])),
            "rap_nombres": sorted(set(data["rap_nombres"])),
            "total_horas": total_horas,
            "horas_semana": horas_semana,
            "opciones": opciones
        })

    requerimientos.sort(key=lambda x: (x["comp_nombre"], x["perfil_nombre"]))
    return {"requerimientos": requerimientos}

# ======================================================
# PROCESO PRINCIPAL (con impresión de tablas A, B y C)
# ======================================================
def _procesar_fichas_core(user_cedula, preferencia="balanceado"):
    from tabulate import tabulate

    cursor = mysql.connection.cursor()

    # centro del usuario
    cursor.execute("SELECT codigo_centro FROM vinculados WHERE cedula = %s", (user_cedula,))
    rowc = cursor.fetchone()
    if not rowc or not rowc[0]:
        cursor.close()
        raise ValueError("El usuario no está vinculado a ningún centro")
    codigo_centro_usuario = rowc[0]

    # fichas activas
    cursor.execute("""
        SELECT numero_ficha, codigo_sede, intensidad, jornada, id_instructor
        FROM fichas WHERE estado = 1
    """)
    fichas = cursor.fetchall()

    resultado = []

    for numero_ficha, codigo_sede, intensidad, jornada, ficha_id_instructor in fichas:
        # sede principal + centro del usuario
        cursor.execute("""
            SELECT sede_principal, codigo_centro FROM sedes WHERE codigo_sede = %s
        """, (codigo_sede,))
        s = cursor.fetchone()
        sede_ok = int(bool(s and s[0] == 1 and s[1] == codigo_centro_usuario))

        # último trimestre
        cursor.execute("""
            SELECT id_trimestre
            FROM trimetres_ano
            WHERE numero_ficha = %s
            ORDER BY id_trimestre DESC LIMIT 1
        """, (numero_ficha,))
        rt = cursor.fetchone()
        tri_num = None
        if rt:
            try:
                tri_num = int(str(rt[0]).split("_")[-1])
            except:
                tri_num = None

        horas_req = {0:330, 1:286, 2:308}.get(int(intensidad), None)
        tri_ok = 0
        id_malla = None

        if tri_num is not None and horas_req is not None:
            cursor.execute("SELECT id_malla FROM mallas WHERE numero_ficha = %s", (numero_ficha,))
            rm = cursor.fetchone()
            if rm:
                id_malla = rm[0]
                cursor.execute("""
                    SELECT COALESCE(SUM(horas_ejecucion),0)
                    FROM distribucion_raps
                    WHERE id_malla = %s AND trimestre = %s
                """, (id_malla, tri_num))
                total_h = (cursor.fetchone() or [0])[0]
                if total_h == horas_req:
                    tri_ok = 1

        if sede_ok == 1 and tri_ok == 1:
            data = {
                "numero_ficha": numero_ficha,
                "sede_principal_y_centro": 1,
                "trimestre_100": 1,
                "jornada": jornada,
                "intensidad": int(intensidad),
                "propuestas": []
            }

            if id_malla and tri_num is not None:
                paquetes = _calcular_bloques_por_ficha(cursor, id_malla, tri_num, jornada, int(intensidad), preferencia=preferencia)
                data["propuestas"] = paquetes["requerimientos"]

            resultado.append(data)

            # ======= IMPRESIÓN EN CONSOLA CON TABLAS A, B y C =======
            print(Fore.GREEN + "\n" + "="*120)
            print(Fore.CYAN + Style.BRIGHT + f"Ficha: {numero_ficha}  | jornada: {jornada} | intensidad: {intensidad}")
            print(Fore.GREEN + "-"*120)

            # TABLA A: RAPS del trimestre actual y sus perfiles asociados
            tabla_A = []
            raps_y_perfiles = []
            if id_malla and tri_num is not None:
                raps_y_perfiles = _obtener_raps_y_perfiles_por_malla_trimestre(cursor, id_malla, tri_num)
                for item in raps_y_perfiles:
                    perfiles_join = ", ".join(item['perfiles']) if item['perfiles'] else "(sin perfiles)"
                    tabla_A.append([item['descripcion'], perfiles_join])

            tabla_A_wrapped = []
            for desc, perfiles in tabla_A:
                tabla_A_wrapped.append([_wrap(desc, 70), _wrap(perfiles, 60)])

            print(Fore.MAGENTA + "\nTabla A) RAPS del trimestre actual y sus perfiles asociados:")
            if tabla_A_wrapped:
                try:
                    print(tabulate(tabla_A_wrapped, headers=["RAP (descripcion)", "Perfiles asociados"],
                                   tablefmt="fancy_grid", stralign="left"))
                except Exception:
                    print(tabulate(tabla_A_wrapped, headers=["RAP (descripcion)", "Perfiles asociados"], tablefmt="grid"))
            else:
                print("  (No se encontraron RAPS para el trimestre actual o no hay perfiles asociados)")

            # TABLA B: Perfiles del instructor y RAPS asociados a cada perfil
            tabla_B = []
            perfiles_instr = []
            if ficha_id_instructor:
                perfiles_instr = _obtener_perfiles_instr_y_raps(cursor, ficha_id_instructor)
                for p in perfiles_instr:
                    if p['raps']:
                        raps_join = "\n".join(f"* {r}" for r in p['raps'])
                    else:
                        raps_join = "(sin raps)"
                    tabla_B.append([p['perfil_nombre'], raps_join])

            tabla_B_wrapped = []
            for perfil_nombre, raps in tabla_B:
                tabla_B_wrapped.append([_wrap(perfil_nombre, 35), _wrap(raps, 70)])

            print(Fore.MAGENTA + "\nTabla B) Perfiles del instructor y RAPS asociados a cada perfil:")
            if tabla_B_wrapped:
                try:
                    print(tabulate(tabla_B_wrapped, headers=["Perfil instructor lider (nombre)", "RAPS asociados"],
                                   tablefmt="fancy_grid", stralign="left"))
                except Exception:
                    print(tabulate(tabla_B_wrapped, headers=["Perfil instructor lider (nombre)", "RAPS asociados"], tablefmt="grid"))
            else:
                print("  (No se encontraron perfiles para el instructor o no hay RAPS asociados)")

            # TABLA C: Propuestas de horarios organizadas
            _imprimir_propuestas_consola(data['propuestas'], max_por_grupo=10)

            print(Fore.MAGENTA + f"\n📊 Resumen: {len(data['propuestas'])} grupos de competencia/perfil procesados")
            print(Fore.GREEN + "="*120 + "\n")

    cursor.close()

    print("\n" + "="*50)
    print("FICHAS QUE CUMPLEN (sede/centro = 1 y trimestre actual = 100%):")
    print("="*50)
    if not resultado:
        print("No hay fichas que cumplan las condiciones.")
    else:
        for f in resultado:
            print(f"Ficha {f['numero_ficha']}: {len(f['propuestas'])} propuestas generadas")
    print("="*50 + "\n")

    return resultado

# ======================
# Rutas
# ======================
@generar_bp.route('/generar')
@login_required
def generar_page():
    return render_template("generar.html")

@generar_bp.route('/procesar_fichas')
@login_required
def procesar_fichas():
    user_cedula = session.get('cedula')
    if not user_cedula:
        return jsonify({"error": "No se encontró la cédula del usuario"}), 400

    prefer = request.args.get("prefer", "balanceado")
    top = request.args.get("top")

    global MAX_OPCIONES
    prev = MAX_OPCIONES
    if top:
        try:
            MAX_OPCIONES = max(10, min(200, int(top)))
        except:
            pass

    try:
        fichas = _procesar_fichas_core(user_cedula, preferencia=prefer)
        MAX_OPCIONES = prev
        return jsonify({"success": True, "fichas": fichas, "total": len(fichas)})
    except Exception as e:
        MAX_OPCIONES = prev
        print(f"Error en /procesar_fichas: {str(e)}")
        return jsonify({"error": str(e)}), 500