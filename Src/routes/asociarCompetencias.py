from flask import Blueprint, Flask, jsonify, make_response, render_template, request, redirect, url_for, flash, session
import pandas as pd
import hashlib
import os
from collections import defaultdict
from flask_mysqldb import MySQL
import mysql.connector

# Crear el Blueprint para asociar competencias
asociarCompetencias_bp = Blueprint('asociarCompetencias', __name__)

# Inicializar MySQL (esto se puede mover a app.py si es necesario)
mysql = MySQL()



# hay dos endpoints con este mismo nombre este trae los datos del instructor
@asociarCompetencias_bp.route('/asociarCompetencias')
def asociarCompetencias():
    token = request.args.get('token')
    cedula = request.args.get('cedula')
    
    # Si no se pasa la cédula, redirige a /registrar_instructor
    if not cedula:
        return redirect(url_for('registrar_instructor.registrar_instructor'))
    
    cursor = mysql.connection.cursor()
    
    # Buscar nombre del instructor en datos_basicos
    cursor.execute("SELECT nombre FROM datos_basicos WHERE cedula = %s", (cedula,))
    dato = cursor.fetchone()
    if not dato:
        cursor.close()
        return jsonify({"error": "Instructor no encontrado"}), 404
    nombre_instructor = dato[0]

    # Traer todos los perfiles asociados al instructor
    cursor.execute("""
        SELECT p.id_perfil, p.nombre
        FROM perfil_instructor pi
        INNER JOIN instructores i ON pi.id_instructor = i.id_instructor
        INNER JOIN perfiles p ON pi.id_perfil = p.id_perfil
        WHERE i.cedula = %s
    """, (cedula,))
    perfiles = cursor.fetchall()
    cursor.close()

    if not perfiles:
        return jsonify({"error": "El instructor no tiene perfiles asociados"}), 404
    
    # Armar lista de perfiles
    lista_perfiles = [{"id": p[0], "nombre": p[1]} for p in perfiles]

    return render_template(
        "asociarCompetencias.html",
        nombre_instructor=nombre_instructor,
        perfiles=lista_perfiles,  # Lista de perfiles del instructor
        token=token,
        cedula=cedula
    )


@asociarCompetencias_bp.route('/get_competencias')
def get_competencias():
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT nombre, GROUP_CONCAT(id_comp SEPARATOR ',') as id_comps FROM competencias GROUP BY nombre")
    results = cursor.fetchall()
    cursor.close()
    
    competencias = [{"nombre": row[0], "id_comps": row[1].split(",")} for row in results]
    return jsonify(competencias)

@asociarCompetencias_bp.route('/asociar_competencias', methods=['POST'])
def asociar_competencias():
    data = request.get_json()
    cedula = data.get("cedula")
    nombre_competencia = data.get("nombre_competencia")
    raps_ids = data.get("raps_ids", [])  # Nueva lista de IDs de RAPs seleccionados
    
    if not cedula or not nombre_competencia:
        return jsonify({"error": "Faltan datos"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute("SELECT id_instructor FROM instructores WHERE cedula = %s", (cedula,))
    res = cursor.fetchone()
    if not res:
        cursor.close()
        return jsonify({"error": "Instructor no encontrado"}), 404
    id_instructor = res[0]

    cursor.execute("SELECT id_comp FROM competencias WHERE nombre = %s", (nombre_competencia,))
    id_comps = cursor.fetchall()
    if not id_comps:
        cursor.close()
        return jsonify({"error": "Competencia no encontrada"}), 404

    # Consultar las asociaciones ya existentes para este instructor y esa competencia
    cursor.execute("""
         SELECT id_comp FROM asociaciones 
         WHERE id_instructor = %s 
           AND id_comp IN (SELECT id_comp FROM competencias WHERE nombre = %s)
    """, (id_instructor, nombre_competencia))
    existing = cursor.fetchall()
    existing_ids = {row[0] for row in existing}
    
    for (id_comp,) in id_comps:
        for rap_id in raps_ids:
            # chequea si ya existe esa asociación concreta
            cursor.execute("""
                SELECT 1 FROM asociaciones 
                 WHERE id_instructor = %s 
                   AND id_comp = %s 
                   AND id_raps = %s
            """, (id_instructor, id_comp, rap_id))
            if not cursor.fetchone():
                cursor.execute(
                    "INSERT INTO asociaciones (id_comp, id_instructor, id_raps) "
                    "VALUES (%s, %s, %s)",
                    (id_comp, id_instructor, rap_id)
                )
    mysql.connection.commit()
    cursor.close()
    return jsonify({"success": True})

# blueprint.py (reemplaza tu ruta /get_asociaciones)
@asociarCompetencias_bp.route('/get_asociaciones')
def get_asociaciones():
    cedula   = request.args.get('cedula')
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    offset   = (page - 1) * per_page

    if not cedula:
        return jsonify({"error": "Falta la cédula"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute("SELECT id_instructor FROM instructores WHERE cedula = %s", (cedula,))
    res = cursor.fetchone()
    if not res:
        cursor.close()
        return jsonify({"error": "Instructor no encontrado"}), 404
    id_instructor = res[0]

    cursor.execute("""
      SELECT 
        a.id_asociacion,
        a.id_raps,
        c.id_comp,
        c.nombre,
        c.sigla,
        p.nombre AS nombre_programa,
        r.descripcion AS rap_descripcion
      FROM asociaciones a
      JOIN competencias c ON a.id_comp = c.id_comp
      JOIN programas p      ON c.id_prog = p.id_prog
      LEFT JOIN raps r      ON a.id_raps = r.id_raps
      WHERE a.id_instructor = %s
      LIMIT %s OFFSET %s
    """, (id_instructor, per_page, offset))
    rows = cursor.fetchall()

    cursor.execute("SELECT COUNT(*) FROM asociaciones WHERE id_instructor = %s", (id_instructor,))
    total = cursor.fetchone()[0]
    cursor.close()

    asociaciones = [{
        "id_asociacion":   r[0],
        "id_raps":         r[1],
        "id_comp":         r[2],
        "nombre":          r[3],
        "sigla":           r[4],
        "nombre_programa": r[5],
        "rap_descripcion": r[6] or ''
    } for r in rows]

    return jsonify({
        "asociaciones": asociaciones,
        "total":        total,
        "page":         page,
        "per_page":     per_page
    })



@asociarCompetencias_bp.route('/eliminar_asociaciones_individuales', methods=['POST'])
def eliminar_asociaciones_individuales():
    data = request.get_json()
    ids_asociacion = data.get("ids_asociacion", [])
    if not ids_asociacion:
        return jsonify({"error": "No se proporcionaron IDs para eliminar"}), 400
    
    cursor = mysql.connection.cursor()
    try:
        format_strings = ','.join(['%s'] * len(ids_asociacion))
        query = f"DELETE FROM asociaciones WHERE id_asociacion IN ({format_strings})"
        cursor.execute(query, tuple(ids_asociacion))
        mysql.connection.commit()
        cursor.close()
        return jsonify({"success": True})
    except Exception as e:
        mysql.connection.rollback()
        cursor.close()
        return jsonify({"error": str(e)}), 500


@asociarCompetencias_bp.route('/check_tipo_competencias', methods=['POST'])
def check_tipo_competencias():
    data = request.get_json()
    ids = data.get("ids", [])
    if not ids:
        return jsonify({
            "null_tipo_ids": [],
            "null_sigla_ids": []
        })

    cursor = mysql.connection.cursor()
    placeholders = ','.join(['%s'] * len(ids))

    # 1) IDs sin tipo
    sql_tipo = (
      f"SELECT id_comp FROM competencias "
      f"WHERE id_comp IN ({placeholders}) AND tipo IS NULL"
    )
    cursor.execute(sql_tipo, tuple(ids))
    null_tipo = [row[0] for row in cursor.fetchall()]

    # 2) IDs sin sigla
    sql_sigla = (
      f"SELECT id_comp FROM competencias "
      f"WHERE id_comp IN ({placeholders}) AND (sigla IS NULL OR sigla = '')"
    )
    cursor.execute(sql_sigla, tuple(ids))
    null_sigla = [row[0] for row in cursor.fetchall()]

    cursor.close()
    return jsonify({
        "null_tipo_ids":  null_tipo,
        "null_sigla_ids": null_sigla
    })


@asociarCompetencias_bp.route('/set_tipo_competencias', methods=['POST'])
def set_tipo_competencias():
    data = request.get_json()
    ids   = data.get("ids", [])
    tipo  = data.get("tipo", None)
    sigla = data.get("sigla", None)               # <-- recogemos la sigla

    # Validaciones
    if not ids or tipo not in (0, 1) or not sigla:
        return jsonify({"error": "Datos inválidos (ids, tipo o sigla faltante)"}), 400

    cursor = mysql.connection.cursor()
    try:
        # Actualizamos ambas columnas: tipo y sigla
        placeholders = ','.join(['%s'] * len(ids))
        sql = (
            f"UPDATE competencias "
            f"SET tipo = %s, sigla = %s "
            f"WHERE id_comp IN ({placeholders})"
        )
        # Nota el orden: primero valor para tipo, luego para sigla, luego los ids
        params = [tipo, sigla, *ids]
        cursor.execute(sql, tuple(params))
        mysql.connection.commit()
        cursor.close()
        return jsonify({"success": True})
    except Exception as e:
        mysql.connection.rollback()
        cursor.close()
        return jsonify({"error": str(e)}), 500


@asociarCompetencias_bp.route("/competencias_sin_asociar", methods=["GET"])
def competencias_sin_asociar():
    try:
        cursor = mysql.connection.cursor()

        # 1) Contar cuántos nombres únicos de competencias NO tienen asociación
        cursor.execute("""
            SELECT COUNT(DISTINCT c.nombre)
            FROM competencias c
            LEFT JOIN asociaciones a ON c.id_comp = a.id_comp
            WHERE a.id_comp IS NULL
        """)
        total = cursor.fetchone()[0]

        # 2) Traer hasta 10 de esos nombres para mostrar en la lista
        cursor.execute("""
            SELECT DISTINCT c.nombre
            FROM competencias c
            LEFT JOIN asociaciones a ON c.id_comp = a.id_comp
            WHERE a.id_comp IS NULL
        """)
        rows = cursor.fetchall()

        cursor.close()

        return jsonify({
            "total": total,
            "competencias": [{"nombre": row[0]} for row in rows]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@asociarCompetencias_bp.route('/get_raps_by_competencia', methods=['GET'])
def get_raps_by_competencia():
    id_comp = request.args.get('id_comp')
    if not id_comp:
        return jsonify({"error": "Falta el ID de la competencia"}), 400
    
    cursor = mysql.connection.cursor()
    cursor.execute("""
        SELECT id_raps, descripcion 
        FROM raps 
        WHERE id_comp = %s
    """, (id_comp,))
    
    raps = cursor.fetchall()
    cursor.close()
    
    raps_list = [{"id_rap": rap[0], "descripcion": rap[1]} for rap in raps]
    return jsonify({"raps": raps_list})