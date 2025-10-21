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
actualizar_instructor_bp = Blueprint('actualizar_instructor', __name__)

# Inicializar MySQL (esto se puede mover a app.py si es necesario)
mysql = MySQL()




@actualizar_instructor_bp.route('/actualizar_instructor', methods=['POST'])
def actualizar_instructor():
    user_cedula = session.get('cedula')
    if not user_cedula:
        return jsonify({"error": "No se encontró la cédula del usuario"}), 400

    print(f"Recibiendo cédula de sesión: {user_cedula}")
    cedula = request.form.get('valor')
    print(f"Recibiendo cédula del instructor: {cedula}")

    cursor = mysql.connection.cursor()
    try:
        # centro del usuario en sesión
        cursor.execute("SELECT codigo_centro FROM vinculados WHERE cedula = %s", (user_cedula,))
        usuario_centro = cursor.fetchone()
        if not usuario_centro:
            cursor.close()
            return jsonify({"error": "No se encontró el centro del usuario"}), 400
        codigo_centro_usuario = usuario_centro[0]

        # nombre del centro
        cursor.execute("SELECT codigo, nombre FROM centros WHERE codigo = %s", (codigo_centro_usuario,))
        centro_usuario = cursor.fetchone()
        if not centro_usuario:
            cursor.close()
            return jsonify({"error": "Centro de usuario no encontrado"}), 400

        # obtener lista de perfiles (si la tabla perfiles existe, la traemos pero no la vamos a mostrar)
        cursor.execute("SELECT id_perfil, nombre FROM perfiles ORDER BY nombre")
        perfiles_rows = cursor.fetchall()
        perfiles = [{"id_perfil": int(p[0]), "nombre": p[1]} for p in perfiles_rows]

        # Consulta principal: ya NO traemos i.id_perfil (porque no existe)
        consulta = """
            SELECT
                db.nombre,
                db.correo,
                db.telefono,
                i.vinculo,
                v.codigo_centro
            FROM datos_basicos AS db
            LEFT JOIN instructores AS i ON db.cedula = i.cedula
            LEFT JOIN vinculados AS v ON db.cedula = v.cedula
            WHERE db.cedula = %s
        """
        cursor.execute(consulta, (cedula,))
        resultado = cursor.fetchone()

    except Exception as e:
        print("Error en actualizar_instructor:", e)
        cursor.close()
        return jsonify({"error": "Error en la consulta"}), 500

    cursor.close()

    if resultado:
        nombre = resultado[0] or ""
        correo = resultado[1] or ""
        telefono = resultado[2] or ""
        vinculo = resultado[3] if resultado[3] is not None else ""
        codigo_centro_instructor = resultado[4] if resultado[4] is not None else None

        datos = {
            "nombre": nombre,
            "correo": correo,
            "telefono": telefono,
            "vinculo": vinculo,
            # No devolvemos id_perfil porque ya no existe en instructores
            "perfiles": perfiles,   # si en algún momento la necesitas, la dejamos, pero el front la ocultará
            "centros": [{"codigo_centro": centro_usuario[0], "nombre": centro_usuario[1]}],
            "codigo_centro_instructor": codigo_centro_instructor
        }
        print(datos)
        return jsonify(datos)
    else:
        return jsonify({"error": "Instructor no encontrado"}), 404


