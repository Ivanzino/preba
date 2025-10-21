from flask import Blueprint
from flask import Flask, jsonify, make_response, render_template, request, redirect, url_for, flash, session
import pandas as pd
import hashlib
import os
from collections import defaultdict
from flask_mysqldb import MySQL
import mysql.connector
from routes.gestor import login_required


# Crear el Blueprint
crear_agenda_bp = Blueprint('crear_agenda', __name__)

# Inicializar MySQL (esto se puede mover a app.py si es necesario)
mysql = MySQL()



@crear_agenda_bp.route("/crear_agenda", methods=["POST"])
@login_required
def crear_agenda():
    """
    Recibe la cédula en 'valor' (form-data).
    Devuelve la lista de registros (id_agenda, dia, hora_inicio, hora_fin)
    de la tabla 'agenda_instructores' para el instructor con esa cédula.
    """
    data_cedula = request.form.get("valor")
    if not data_cedula:
        return jsonify({"error": "No se envió cédula"}), 400

    cursor = mysql.connection.cursor()
    # Buscar id_instructor por cédula
    cursor.execute("SELECT id_instructor FROM instructores WHERE cedula = %s", (data_cedula,))
    result = cursor.fetchone()
    if not result:
        cursor.close()
        return jsonify({"error": "Instructor no encontrado"}), 404

    id_instructor = result[0]

    # Consultar agenda
    cursor.execute("""
        SELECT id_agenda, dia, hora_inicio, hora_fin
        FROM agenda_instructores
        WHERE id_instructor = %s
    """, (id_instructor,))
    agenda_rows = cursor.fetchall()
    cursor.close()

    # Convertir a lista de diccionarios
    agenda_list = []
    for row in agenda_rows:
        agenda_list.append({
            "id_agenda": row[0],
            "dia": row[1],
            "hora_inicio": str(row[2]),
            "hora_fin": str(row[3])
        })

    return jsonify({"agenda": agenda_list}), 200


@crear_agenda_bp.route('/agregar_agenda_instructor', methods=['POST'])
@login_required
def agregar_agenda_instructor():
    """
    Recibe JSON con: { cedula, dia, hora_inicio, hora_fin }
    Inserta en agenda_instructores un nuevo registro.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se recibió datos JSON"}), 400

    cedula = data.get('cedula')
    dia = data.get('dia')
    hora_inicio = data.get('hora_inicio')
    hora_fin = data.get('hora_fin')

    if not all([cedula, dia, hora_inicio, hora_fin]):
        return jsonify({"error": "Faltan campos"}), 400

    cursor = mysql.connection.cursor()
    # Buscar id_instructor
    cursor.execute("SELECT id_instructor FROM instructores WHERE cedula = %s", (cedula,))
    result = cursor.fetchone()
    if not result:
        cursor.close()
        return jsonify({"error": "No existe instructor con esa cédula"}), 404

    id_instructor = result[0]

    # Insertar
    try:
        cursor.execute("""
            INSERT INTO agenda_instructores (id_instructor, dia, hora_inicio, hora_fin)
            VALUES (%s, %s, %s, %s)
        """, (id_instructor, dia, hora_inicio, hora_fin))
        mysql.connection.commit()
        cursor.close()
        return jsonify({"success": True, "message": "Agenda insertada correctamente"}), 200
    except Exception as e:
        mysql.connection.rollback()
        cursor.close()
        return jsonify({"error": str(e)}), 500


@crear_agenda_bp.route("/actualizar_agenda_instructor", methods=["POST"])
@login_required
def actualizar_agenda_instructor():
    """
    Recibe JSON con: { id_agenda, dia, hora_inicio, hora_fin }
    Actualiza el registro en la tabla agenda_instructores.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se recibió JSON"}), 400

    id_agenda = data.get("id_agenda")
    dia = data.get("dia")
    hora_inicio = data.get("hora_inicio")
    hora_fin = data.get("hora_fin")

    if not all([id_agenda, dia, hora_inicio, hora_fin]):
        return jsonify({"error": "Faltan campos"}), 400

    cursor = mysql.connection.cursor()
    try:
        cursor.execute("""
            UPDATE agenda_instructores
            SET dia = %s, hora_inicio = %s, hora_fin = %s
            WHERE id_agenda = %s
        """, (dia, hora_inicio, hora_fin, id_agenda))
        mysql.connection.commit()
        cursor.close()
        return jsonify({"success": True}), 200
    except Exception as e:
        mysql.connection.rollback()
        cursor.close()
        return jsonify({"error": str(e)}), 500


@crear_agenda_bp.route("/eliminar_agenda_instructor", methods=["POST"])
@login_required
def eliminar_agenda_instructor():
    """
    Recibe JSON con: { id_agenda }
    Elimina ese registro de la tabla agenda_instructores.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se recibió JSON"}), 400

    id_agenda = data.get("id_agenda")
    if not id_agenda:
        return jsonify({"error": "Falta id_agenda"}), 400

    cursor = mysql.connection.cursor()
    try:
        cursor.execute("DELETE FROM agenda_instructores WHERE id_agenda = %s", (id_agenda,))
        mysql.connection.commit()
        cursor.close()
        return jsonify({"success": True}), 200
    except Exception as e:
        mysql.connection.rollback()
        cursor.close()
        return jsonify({"error": str(e)}), 500
    
    
    
    
    


@crear_agenda_bp.route("/info_extras_instructor", methods=["POST"])
@login_required
def info_extras_instructor():
    data = request.get_json()
    cedula = data.get("cedula")
    if not cedula:
        return jsonify({"error": "Falta cédula"}), 400

    cursor = mysql.connection.cursor()
    # nombre
    cursor.execute("SELECT nombre FROM datos_basicos WHERE cedula = %s", (cedula,))
    row = cursor.fetchone()
    if not row:
        cursor.close()
        return jsonify({"error": "Instructor no encontrado"}), 404
    nombre = row[0]

    # id_instructor + vínculo
    cursor.execute("SELECT id_instructor, vinculo FROM instructores WHERE cedula = %s", (cedula,))
    inst = cursor.fetchone()
    if not inst:
        cursor.close()
        return jsonify({"error": "No existe instructor en tabla instructores"}), 404
    id_instructor, vinculo = inst
    limite = 32 if vinculo == 0 else 40

    # lista de extras + suma
    cursor.execute("""
        SELECT id_extra, tipo, cantidad_horas
        FROM extras
        WHERE id_instructor = %s
        ORDER BY id_extra DESC
    """, (id_instructor,))
    extras_rows = cursor.fetchall()

    cursor.execute("SELECT COALESCE(SUM(cantidad_horas),0) FROM extras WHERE id_instructor = %s", (id_instructor,))
    total_usado = cursor.fetchone()[0] or 0
    cursor.close()

    horas_disponibles = max(limite - total_usado, 0)
    vinculo_txt = "Funcionario" if vinculo == 0 else "Contratista"

    extras = [
        {"id_extra": r[0], "tipo": r[1], "cantidad_horas": int(r[2])}
        for r in extras_rows
    ]

    return jsonify({
        "nombre": nombre,
        "vinculo": vinculo_txt,
        "horas_disponibles": int(horas_disponibles),
        "id_instructor": int(id_instructor),
        "extras": extras
    })



@crear_agenda_bp.route("/agregar_extras_instructor", methods=["POST"])
@login_required
def agregar_extras_instructor():
    data = request.get_json()
    cedula = data.get("cedula")
    actividades = data.get("actividades", [])
    if not cedula or not actividades:
        return jsonify({"error": "Datos incompletos"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute("SELECT id_instructor FROM instructores WHERE cedula = %s", (cedula,))
    res = cursor.fetchone()
    if not res:
        cursor.close()
        return jsonify({"error": "Instructor no encontrado"}), 404
    id_instructor = res[0]

    try:
        for act in actividades:
            cursor.execute("""
                INSERT INTO extras (id_instructor, tipo, cantidad_horas)
                VALUES (%s, %s, %s)
            """, (id_instructor, act["tipo"], act["cantidad_horas"]))
        mysql.connection.commit()
        cursor.close()
        return jsonify({"success": True}), 200
    except Exception as e:
        mysql.connection.rollback()
        cursor.close()
        return jsonify({"error": str(e)}), 500


@crear_agenda_bp.route("/eliminar_extra_instructor", methods=["POST"])
@login_required
def eliminar_extra_instructor():
    data = request.get_json()
    id_extra = data.get("id_extra")
    if not id_extra:
        return jsonify({"error": "Falta id_extra"}), 400

    cursor = mysql.connection.cursor()
    try:
        cursor.execute("DELETE FROM extras WHERE id_extra = %s", (id_extra,))
        mysql.connection.commit()
        cursor.close()
        return jsonify({"success": True}), 200
    except Exception as e:
        mysql.connection.rollback()
        cursor.close()
        return jsonify({"error": str(e)}), 500
