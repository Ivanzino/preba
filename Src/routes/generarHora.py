from flask import Blueprint, request, jsonify, render_template
from datetime import datetime, date

generarHora_bp = Blueprint('generarHora_bp', __name__, template_folder='../templates')

@generarHora_bp.route('/generarHora', methods=['GET', 'POST'])
def generarHora():
    if request.method == 'GET':
        return render_template('generarHora.html')

    try:
        from app import mysql
        cur = mysql.connection.cursor()
        
        # Query principal: obtener fichas con su información
        sql = """
        SELECT f.numero_ficha, f.fecha_fin_lectiva, f.programa, f.intensidad,
               ta.id_trimestre, ta.fecha_inicio as fecha_inicio_ta,
               p.cant_trimestres,
               m.id_malla
        FROM fichas f
        LEFT JOIN (
            SELECT t1.* 
            FROM trimetres_ano t1
            WHERE t1.fecha_inicio = (
                SELECT MAX(t2.fecha_inicio)
                FROM trimetres_ano t2
                WHERE t2.numero_ficha = t1.numero_ficha
            )
        ) ta ON ta.numero_ficha = f.numero_ficha
        LEFT JOIN programas p ON p.id_prog = f.programa
        LEFT JOIN mallas m ON m.numero_ficha = f.numero_ficha;
        """
        
        cur.execute(sql)
        rows = cur.fetchall()

        # Obtener el último registro de trimestres (por id_trimestre más alto)
        cur.execute("SELECT fecha_inicio FROM trimestres ORDER BY id_trimestre DESC LIMIT 1")
        ultima_trim = cur.fetchone()
        
        if ultima_trim and ultima_trim[0]:
            ultima_fecha_trimestres = ultima_trim[0]
            if isinstance(ultima_fecha_trimestres, datetime):
                ultima_fecha_trimestres = ultima_fecha_trimestres.date()
            print(f"[OK] Ultima fecha en trimestres: {ultima_fecha_trimestres}")
        else:
            ultima_fecha_trimestres = None
            print("[ERROR] No se encontro fecha en trimestres")

        activos = []
        inactivos = []

        def parse_date_any(v):
            """Convierte diferentes formatos de fecha a date"""
            if v is None:
                return None
            
            if hasattr(v, 'date'):
                try:
                    return v.date() if callable(getattr(v, 'date', None)) else v
                except:
                    pass
            
            if isinstance(v, str):
                s = v.strip()
                for fmt in ('%Y-%m-%d', '%Y/%m/%d', '%d-%m-%Y', '%d/%m/%Y'):
                    try:
                        return datetime.strptime(s, fmt).date()
                    except:
                        continue
            
            return None

        def extraer_numero_trimestre(id_trimestre):
            """Extrae el número del trimestre del id_trimestre"""
            if id_trimestre is None:
                return None
            
            try:
                s = str(id_trimestre)
                if '_' in s:
                    return int(s.split('_')[-1])
                else:
                    return int(''.join(filter(str.isdigit, s))[-1])
            except:
                return None

        def calcular_porcentaje_trimestre(id_malla, numero_trimestre, intensidad, cursor):
            """Calcula el porcentaje de completitud del trimestre actual"""
            try:
                if id_malla is None or numero_trimestre is None or intensidad is None:
                    return 0
                
                horas_totales = {
                    0: 330,
                    1: 286,
                    2: 308
                }.get(int(intensidad), 330)
                
                sql_raps = """
                SELECT COALESCE(SUM(horas_ejecucion), 0) as total_horas
                FROM distribucion_raps
                WHERE id_malla = %s AND trimestre = %s
                """
                cursor.execute(sql_raps, (id_malla, int(numero_trimestre)))
                horas_result = cursor.fetchone()
                
                horas_ejecutadas = float(horas_result[0]) if horas_result and horas_result[0] else 0
                porcentaje = min(100.0, round((horas_ejecutadas / horas_totales) * 100, 2))
                
                return porcentaje
                
            except Exception as e:
                print(f"Error calculando porcentaje: {e}")
                import traceback
                traceback.print_exc()
                return 0

        for row in rows:
            numero_ficha = row[0]
            fecha_fin_lectiva = row[1]
            programa = row[2]
            intensidad = row[3]
            id_trimestre = row[4]
            fecha_inicio_trimestre = row[5]
            cant_trimestres = row[6]
            id_malla = row[7]

            if numero_ficha is None:
                continue

            # Convertir fechas si son datetime
            if isinstance(fecha_fin_lectiva, datetime):
                fecha_fin_lectiva = fecha_fin_lectiva.date()
            if isinstance(fecha_inicio_trimestre, datetime):
                fecha_inicio_trimestre = fecha_inicio_trimestre.date()

            info_ficha = {
                "numero_ficha": str(numero_ficha),
                "condiciones": [],
                "cumple": [],
                "porcentaje": 0
            }

            condiciones_cumplidas = 0

            print(f"\n--- Ficha {numero_ficha} ---")
            print(f"  fecha_fin_lectiva: {fecha_fin_lectiva}")
            print(f"  ultima_fecha_trimestres: {ultima_fecha_trimestres}")

            # CONDICION 1: fecha_fin_lectiva > ultima fecha_inicio de tabla TRIMESTRES
            if fecha_fin_lectiva is not None and ultima_fecha_trimestres is not None:
                if fecha_fin_lectiva > ultima_fecha_trimestres:
                    condiciones_cumplidas += 1
                    info_ficha["cumple"].append(
                        f"Fecha fin lectiva ({fecha_fin_lectiva}) > ultima fecha inicio trimestre ({ultima_fecha_trimestres})"
                    )
                    print(f"  [OK] Condicion 1 cumplida")
                else:
                    info_ficha["condiciones"].append(
                        f"Fecha fin lectiva ({fecha_fin_lectiva}) debe ser mayor que ultima fecha inicio trimestre ({ultima_fecha_trimestres})"
                    )
                    print(f"  [NO] Condicion 1 NO cumplida")
            else:
                detalles = []
                if fecha_fin_lectiva is None:
                    detalles.append("fecha_fin_lectiva es NULL")
                if ultima_fecha_trimestres is None:
                    detalles.append("fecha_inicio del trimestre es NULL")
                info_ficha["condiciones"].append(f"Faltan datos de fechas: {', '.join(detalles)}")
                print(f"  [NO] Condicion 1: faltan datos")
            
            # CONDICION 2: numero_trimestre <= cant_trimestres del programa
            trim_num = extraer_numero_trimestre(id_trimestre)
            print(f"  trim_num: {trim_num}, cant_trimestres: {cant_trimestres}")
            
            if trim_num is not None and cant_trimestres is not None:
                try:
                    if int(trim_num) <= int(cant_trimestres):
                        condiciones_cumplidas += 1
                        info_ficha["cumple"].append(f"Trimestre {trim_num} valido (maximo: {cant_trimestres})")
                        print(f"  [OK] Condicion 2 cumplida")
                    else:
                        info_ficha["condiciones"].append(
                            f"Trimestre actual ({trim_num}) excede el maximo del programa ({cant_trimestres})"
                        )
                        print(f"  [NO] Condicion 2 NO cumplida")
                except:
                    info_ficha["condiciones"].append("Error al validar trimestre")
                    print(f"  [ERROR] Condicion 2: error al validar")
            else:
                detalles_trim = []
                if trim_num is None:
                    detalles_trim.append("numero de trimestre no extraido")
                if cant_trimestres is None:
                    detalles_trim.append("cant_trimestres es NULL")
                info_ficha["condiciones"].append(f"Faltan datos: {', '.join(detalles_trim)}")
                print(f"  [NO] Condicion 2: faltan datos")

            # Calcular porcentaje de completitud del trimestre
            if id_malla is not None and trim_num is not None and intensidad is not None:
                info_ficha["porcentaje"] = calcular_porcentaje_trimestre(
                    id_malla, trim_num, intensidad, cur
                )
            else:
                detalles_porc = []
                if id_malla is None:
                    detalles_porc.append("id_malla no encontrado")
                if trim_num is None:
                    detalles_porc.append("numero de trimestre no extraido")
                if intensidad is None:
                    detalles_porc.append("intensidad no definida")
                print(f"No se pudo calcular porcentaje para ficha {numero_ficha}: {', '.join(detalles_porc)}")

            print(f"  Total condiciones cumplidas: {condiciones_cumplidas}/2")

            # Clasificar segun condiciones cumplidas
            if condiciones_cumplidas == 2:
                activos.append(info_ficha)
            else:
                inactivos.append(info_ficha)

        # --- SINCRONIZAR estado EN BD (parche mínimo) ---
        try:
            # recolectar numeros de ficha a activar/desactivar (asegura que sean únicos)
            activar_numeros = list({a['numero_ficha'] for a in activos if a.get('numero_ficha') is not None})
            desactivar_numeros = list({i['numero_ficha'] for i in inactivos if i.get('numero_ficha') is not None})

            # Evitar solapamiento (por si acaso alguna ficha aparece en ambos arrays)
            activar_set = set(activar_numeros)
            desactivar_numeros = [n for n in desactivar_numeros if n not in activar_set]

            # actualizar solo si hay elementos
            if activar_numeros:
                placeholders = ','.join(['%s'] * len(activar_numeros))
                sql_up = f"""
                UPDATE fichas
                SET estado = 1
                WHERE numero_ficha IN ({placeholders})
                  AND COALESCE(estado, -1) <> 1
                """
                cur.execute(sql_up, tuple(activar_numeros))

            if desactivar_numeros:
                placeholders = ','.join(['%s'] * len(desactivar_numeros))
                sql_down = f"""
                UPDATE fichas
                SET estado = 0
                WHERE numero_ficha IN ({placeholders})
                  AND COALESCE(estado, -1) <> 0
                """
                cur.execute(sql_down, tuple(desactivar_numeros))

            # confirmar cambios
            mysql.connection.commit()
            print(f"[SYNC] Activadas: {len(activar_numeros)}, Desactivadas: {len(desactivar_numeros)}")
        except Exception as e_sync:
            print("Error sincronizando estado:", e_sync)
            import traceback
            traceback.print_exc()
            try:
                mysql.connection.rollback()
            except:
                pass
        # --- fin sincronización ---

        cur.close()

        return jsonify({
            "activos": activos,
            "inactivos": inactivos,
            "count_activos": len(activos),
            "count_inactivos": len(inactivos)
        })

    except Exception as e:
        print("Error en generarHora:", e)
        import traceback
        traceback.print_exc()
        return jsonify(error=str(e)), 500
