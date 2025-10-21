from flask import Blueprint
from flask import Flask, jsonify, make_response, render_template, request, redirect, url_for, flash, session
import pandas as pd
import hashlib
import os
from collections import defaultdict
from datetime import datetime, timedelta
from flask_mysqldb import MySQL
import mysql.connector


enviar_fichas_bp = Blueprint('enviar_fichas_bp', __name__)

# Inicializar MySQL (esto se puede mover a app.py si es necesario)
mysql = MySQL()

@enviar_fichas_bp.route("/crear_fichas",methods=['GET','POST'] )
def crear_fichas():
    user_cedula = session.get('cedula')
    if not user_cedula:
        return jsonify({"error": "No se encontró la cédula del usuario"}), 400
    
    print(f"Recibiendo cédula de sesión: {user_cedula}")
    
    cursor = mysql.connection.cursor()
    
    # Obtener el código del centro de formación del usuario autenticado
    cursor.execute("SELECT codigo_centro FROM vinculados WHERE cedula = %s", (user_cedula,))
    usuario_centro = cursor.fetchone()
    
    if usuario_centro and usuario_centro[0]:  
        session['codigo_centro'] = usuario_centro[0]  # Guardamos el código del centro en la sesión
    else:
        session['codigo_centro'] = None  # Usuario sin centro vinculado
    
    print(f"Código del centro de usuario en sesión: {session['codigo_centro']}")
    
    # Obtener el código del centro vinculado al usuario de la sesión
    codigo_usuario = session["codigo_centro"]
    
    if not codigo_usuario:
        return jsonify({"error": "El usuario no tiene centro vinculado."}), 400
    
    # Obtener solo los instructores cuyo centro vinculado sea el mismo que el del usuario
    cursor.execute("""
        SELECT i.cedula, db.nombre 
        FROM instructores i
        JOIN vinculados v ON i.cedula = v.cedula
        JOIN datos_basicos db ON i.cedula = db.cedula
        WHERE v.codigo_centro = %s AND v.estado = 1
    """, (codigo_usuario,))
    
    datos_instructores = cursor.fetchall()
    
    # Verificación de que se han encontrado instructores
    if not datos_instructores:
        return jsonify({"error": "No se encontraron instructores para este centro."}), 400
    
    # Obtenemos todas las sedes
    cursor.execute("SELECT * FROM sedes")
    datos_sedes = cursor.fetchall()
    print(datos_sedes)
    
    return render_template("creacion_de_horario_marlovy.html", datos_instructores=datos_instructores, datos_sedes=datos_sedes)

@enviar_fichas_bp.route('/enviar_fichas', methods=['POST'])
def enviar_fichas():
    data = request.json
    print(data)

    try:
        numero_ficha = data.get('numero_ficha')
        codigo_programa = data.get('codigo_programa')
        jornada = data.get('jornada')
        codigo_sede = data.get('codigo_sede')

        fecha_inicio_lectiva = datetime.strptime(data.get('fecha_inicio_lectiva'), "%Y-%m-%d").date()
        fecha_fin_lectiva = datetime.strptime(data.get('fecha_fin_lectiva'), "%Y-%m-%d").date()
        fecha_inicio_induccion = datetime.strptime(data.get('fecha_inicio_induccion'), "%Y-%m-%d").date()
        fecha_fin_induccion = datetime.strptime(data.get('fecha_fin_induccion'), "%Y-%m-%d").date()

        id_instructor = data.get('id_instructor')
        cant_trimestres = data.get('intensidad')
        sigla = data.get('sigla')
        modalidad = 1  # Se fuerza
        oferta = int(data.get('oferta'))  

        cursor = mysql.connection.cursor()

        # Actualizar tabla programas
        cursor.execute("""
            UPDATE programas 
            SET sigla = %s, cant_trimestres = %s 
            WHERE id_prog = %s
        """, (sigla, cant_trimestres, codigo_programa))

        # Insertar en fichas con intensidad NULL y oferta incluida
        cursor.execute("""
            INSERT INTO fichas (
                numero_ficha, programa, jornada, codigo_sede,
                fecha_inicio_lectiva, fecha_fin_lectiva,
                fecha_inicio_induccion, fecha_fin_induccion,
                id_instructor, intensidad, modalidad, oferta
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            numero_ficha,
            codigo_programa,
            jornada,
            codigo_sede,
            fecha_inicio_lectiva,
            fecha_fin_lectiva,
            fecha_inicio_induccion,
            fecha_fin_induccion,
            id_instructor,
            None,
            modalidad,
            oferta  
        ))

        mysql.connection.commit()
        return jsonify({"message": "Ficha registrada correctamente."}), 200

    except ValueError as e:
        return jsonify({"error": f"Error en formato de fecha: {str(e)}"}), 400

    except Exception as e:
        mysql.connection.rollback()
        print(f"Error al insertar los datos de la ficha: {str(e)}")
        return jsonify({"error": f"Error al insertar los datos: {str(e)}"}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()

