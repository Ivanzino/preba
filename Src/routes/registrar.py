from flask import Blueprint, Flask, jsonify, make_response, render_template, request, redirect, url_for, flash, session
import pandas as pd
import hashlib
import os
from collections import defaultdict
from flask_mysqldb import MySQL
import mysql.connector
from routes.registrar_instructor import registrar_instructor

# Crear el Blueprint
registrar_bp = Blueprint('registrar', __name__)

# Inicializar MySQL
mysql = MySQL()

@registrar_bp.route('/registrar', methods=['GET', 'POST'])
def registrar():
    if request.method == 'POST':
        try:
            # PROCESO DE REGISTRO DEL INSTRUCTOR
            cedula = request.form['cedula']
            centro = request.form['centros']
            nombre = request.form['nombre']
            vinculo = request.form['vinculo'].lower()
            # ahora sí leemos el perfil del formulario (puede venir o no)
            perfil = request.form.get('perfiles')  # puede ser None o '' si no se envía
            correo = request.form['correo']
            telefono = request.form['telefono']

            hashed_password = hashlib.sha256(cedula.encode()).hexdigest()
            nuevo_vinculo = 0 if vinculo == "funcionario" else 1

            cur = mysql.connection.cursor()
            # Insert en datos_basicos
            cur.execute("""INSERT INTO datos_basicos (cedula, nombre, correo, telefono, contrasena, rol) 
                        VALUES (%s, %s, %s, %s, %s, %s)""",
                        (cedula, nombre, correo, telefono, hashed_password, "instructor"))
            # Insert en vinculados
            cur.execute("""INSERT INTO vinculados (cedula, codigo_centro, estado) 
                        VALUES (%s, %s, %s)""", (cedula, centro, 1))
            # Insert en instructores (sin id_perfil)
            cur.execute("""INSERT INTO instructores (cedula, vinculo) 
                        VALUES (%s, %s)""", (cedula, nuevo_vinculo))

            # Obtener id_instructor insertado de forma robusta
            id_instructor = cur.lastrowid
            if not id_instructor:
                # Si lastrowid no devolviera nada, buscar por cédula
                cur.execute("SELECT id_instructor FROM instructores WHERE cedula = %s", (cedula,))
                row = cur.fetchone()
                id_instructor = row[0] if row else None

            # Si viene un perfil (y conseguimos id_instructor), insertar en la tabla puente perfil_instructor
            if perfil and id_instructor:
                try:
                    # evitar duplicados: comprobar antes
                    cur.execute("SELECT 1 FROM perfil_instructor WHERE id_instructor = %s AND id_perfil = %s",
                                (id_instructor, perfil))
                    if not cur.fetchone():
                        cur.execute("INSERT INTO perfil_instructor (id_instructor, id_perfil) VALUES (%s, %s)",
                                    (id_instructor, perfil))
                except Exception as e_inner:
                    # Si falla solo la inserción en la tabla puente, lo logueamos pero no abortamos todo.
                    print("Advertencia: no se pudo insertar en perfil_instructor:", e_inner)

            mysql.connection.commit()
            cur.close()
            return redirect(url_for('registrar.registrar'))
        
        except Exception as e:
            print("Error en el registro:", str(e))
            return jsonify({'error': str(e)}), 500

    # SI EL MÉTODO ES GET (Redirigir a registrar_instructor)
    try:
        cur = mysql.connection.cursor()

        # Obtenemos el centro del usuario desde la sesión
        cur.execute("SELECT codigo_centro, nombre FROM centros WHERE codigo_centro = %s", (session.get('codigo_centro_usuario'),))
        nombre_centro_usuario = cur.fetchone()

        # Obtenemos todos los centros disponibles
        cur.execute("SELECT codigo_centro, nombre FROM centros")
        centros_disponibles = cur.fetchall()
        cur.close()
        
        # Redirección con parámetros
        return redirect(url_for('registrar_instructor', 
            centros_disponibles=centros_disponibles,
            nombre_centro_usuario=nombre_centro_usuario
        ))

    except Exception as e:
        print("Error al obtener centros:", str(e))
        return redirect(url_for('registrar_instructor.registrar_instructor'))
