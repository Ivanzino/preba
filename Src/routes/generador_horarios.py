from ortools.sat.python import cp_model
from datetime import datetime
from collections import defaultdict
from routes.competencias_transversales import competencias_transversales
from MySQLdb.cursors import DictCursor
from flask_mysqldb import MySQL
from flask import Blueprint, request, jsonify, session, render_template
mysql = MySQL()
generador_horarios_bp = Blueprint('generador_horarios', __name__)

calendario_sena = [
    ("2023-10-02", "2023-12-16"),
    ("2024-01-22", "2024-04-06"),
    ("2024-04-15", "2024-06-29"),
    ("2024-07-08", "2024-09-20"),
    ("2024-09-30", "2024-12-13"),
    ("2025-02-10", "2025-04-25"),
    ("2025-04-29", "2025-07-12"),
    ("2025-07-25", "2025-10-06")
]


def calcular_trimestre(fecha_inicio_lectiva, fecha_actual):
    # Asegurarnos de trabajar con tipos date
    if isinstance(fecha_inicio_lectiva, datetime):
        fecha_inicio_lectiva = fecha_inicio_lectiva.date()
    if isinstance(fecha_actual, datetime):
        fecha_actual_date = fecha_actual.date()
    else:
        fecha_actual_date = fecha_actual

    trimestre_formativo = 0
    for i, (inicio_str, fin_str) in enumerate(calendario_sena, start=1):
        inicio = datetime.strptime(inicio_str, "%Y-%m-%d").date()
        fin    = datetime.strptime(fin_str,    "%Y-%m-%d").date()
        if inicio >= fecha_inicio_lectiva:
            trimestre_formativo += 1
            if inicio <= fecha_actual_date <= fin:
                # devolvemos el número de trimestre y la fecha de inicio (como date)
                return trimestre_formativo, inicio
    return None, None


def generar_horario_ficha(conn, numero_ficha: int, usuario_centro: int, fecha_actual: datetime):
    cursor = conn.cursor(DictCursor)

    # Obtener datos de la ficha
    cursor.execute("""
        SELECT f.numero_ficha, f.codigo_sede, f.id_instructor AS lider_id,
               f.fecha_inicio_lectiva, f.fecha_fin_lectiva,
               s.sede_principal
        FROM fichas f
        JOIN sedes s ON f.codigo_sede = s.codigo_sede
        WHERE f.numero_ficha = %s
    """, (numero_ficha,))
    ficha = cursor.fetchone()
    if not ficha:
        return {"error": "Ficha no encontrada"}

    trimestre, fecha_inicio_trimestre = calcular_trimestre(
        ficha['fecha_inicio_lectiva'], fecha_actual
    )
    if not trimestre:
        return {"error": "No se pudo determinar el trimestre actual"}
    if ficha['fecha_fin_lectiva'] < fecha_inicio_trimestre:
        return {"error": "La ficha ya finalizó su etapa lectiva"}

    # Obtener información de raps desde distribucion_raps y mallas
    cursor.execute("""
        SELECT dr.id_rap, dr.duracion, r.descripcion AS nombre_rap
        FROM distribucion_raps dr
        JOIN raps r ON r.id_rap = dr.id_rap
        WHERE dr.numero_ficha = %s AND dr.trimestre = %s
    """, (numero_ficha, trimestre))
    raps = cursor.fetchall()

    # Obtener instructores asociados a cada rap
    rap_instructores = defaultdict(list)
    for rap in raps:
        rap_id = rap['id_raps']
        cursor.execute("""
            SELECT a.id_instructor, i.vinculo
            FROM asociaciones a
            JOIN instructores i ON i.id_instructor = a.id_instructor
            JOIN vinculados v ON v.id_instructor = i.id_instructor
            WHERE a.id_rap = %s AND v.codigo_centro = %s AND v.estado = 1
        """, (rap['id_rap'], usuario_centro))
        rap_instructores[rap['id_rap']].extend(cursor.fetchall())

    # Cargar disponibilidad de instructores
    cursor.execute("SELECT * FROM agenda_instructores")
    agenda = cursor.fetchall()
    disponibilidad = defaultdict(lambda: defaultdict(set))
    for entry in agenda:
        disponibilidad[entry['id_instructor']][entry['dia']].add(entry['hora_inicio'])

    # Construir modelo CP-SAT
    model = cp_model.CpModel()
    bloques_validos = [2, 3, 4, 6]
    dias_semana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
    bloques = [8, 10, 13, 15, 18]

    variables = {}
    horas_por_instructor_dia = defaultdict(lambda: defaultdict(list))

    for rap in raps:
        rap_id = rap['id_raps']
        nombre_rap = rap['nombre_rap'].strip().upper()
        duracion_total = rap['duracion']
        es_transversal = any(
            nombre_rap == v.upper() for v in competencias_transversales.values()
        )

        for instr in rap_instructores[rap_id]:
            instr_id = instr['id_instructor']
            es_planta = instr['vinculo'] == 'planta'

            for dia in dias_semana:
                if es_planta and dia == 'sabado':
                    continue
                for hora in bloques:
                    for dur in bloques_validos:
                        horas_bloque = set(range(hora, hora + dur))
                        if horas_bloque.issubset(
                            disponibilidad[instr_id][dia]
                        ):
                            var = model.NewBoolVar(
                                f"rap{rap_id}_instr{instr_id}_{dia}_{hora}_{dur}"
                            )
                            variables[(rap_id, instr_id, dia, hora, dur,
                                        es_transversal)] = var
                            horas_por_instructor_dia[instr_id][dia].append((var, dur))

    # Restricciones de horas por instructor
    for instr_id, dias in horas_por_instructor_dia.items():
        total_semana = []
        es_planta = any(
            instr['vinculo'] == 'planta'
            for rap in rap_instructores.values()
            for instr in rap if instr['id_instructor'] == instr_id
        )
        max_semana = 32 if es_planta else 40
        for dia, bloques in dias.items():
            model.Add(sum(var * dur for var, dur in bloques) <= 8)
            total_semana.extend(var * dur for var, dur in bloques)
        model.Add(sum(total_semana) <= max_semana)

    # Asignar exactamente la duracion requerida por rap
    for rap in raps:
        usos = [var * dur for (r, i, d, h, dur, t), var in variables.items() if r == rap['id_rap']]
        model.Add(sum(usos) == rap['duracion'])

    # Función objetivo
    objetivo = []
    for (rap_id, instr_id, dia, hora, dur, es_transversal), var in variables.items():
        score = 0
        if instr_id == ficha['lider_id']:
            score += 20
        if ficha['sede_principal'] == 1:
            score += 5
        score += 10 if not es_transversal else 2
        objetivo.append(var * score)

    model.Maximize(sum(objetivo))

    # Resolver
    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    resultado = []
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for (rap_id, instr_id, dia, hora, dur, _), var in variables.items():
            if solver.Value(var):
                resultado.append({
                    "rap_id": rap_id,
                    "instructor_id": instr_id,
                    "dia": dia,
                    "hora": f"{hora}:00",
                    "duracion": dur
                })
        return resultado
    else:
        return {"error": "No se pudo generar un horario factible con las restricciones dadas."}