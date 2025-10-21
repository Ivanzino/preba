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
registrar_instructor_bp = Blueprint('registrar_instructor', __name__)

# Inicializar MySQL (esto se puede mover a app.py si es necesario)
mysql = MySQL()



@registrar_instructor_bp.route('/registrar_instructor')
@login_required
def registrar_instructor():
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
    #obtener nombre y codigo del centro del usuario
    codigo_usuario=session["codigo_centro"]
    cursor.execute('SELECT codigo, nombre FROM centros WHERE codigo=%s',(codigo_usuario,))
    nombre_centro_usuario=cursor.fetchone()
    print(nombre_centro_usuario)
    # Obtener perfiles
    cursor.execute('SELECT * FROM perfiles')
    perfiles = cursor.fetchall()

    # Obtener centros (convertir en diccionario para fácil acceso)
    cursor.execute('SELECT codigo, nombre FROM centros')
    centros = {centro[0]: centro[1] for centro in cursor.fetchall()}  # Diccionario {codigo: nombre}

    # Obtener todos los instructores
    cursor.execute('SELECT * FROM instructores')
    instructores = cursor.fetchall()

    datos_instructores = []
    
    for instructor in instructores:
        cedula = instructor[1]  # Cedula del instructor
        
        # Obtener el código de centro y el estado de vinculación del instructor desde la tabla 'vinculados'
        cursor.execute('SELECT estado, codigo_centro FROM vinculados WHERE cedula = %s', (cedula,))
        vinculacion = cursor.fetchone()
        
        if vinculacion:
            estado_vinculacion = vinculacion[0]  # Estado de vinculación (0 o 1)
            codigo_centro = vinculacion[1]  # Código del centro del instructor
        else:
            estado_vinculacion = None  # No encontrado
            codigo_centro = None  # No tiene centro vinculado

        # Obtener el nombre del instructor
        cursor.execute('SELECT nombre FROM datos_basicos WHERE cedula = %s', (cedula,))
        nombre_instru = cursor.fetchone()
        nombre = nombre_instru[0] if nombre_instru else "Nombre no disponible"

        # Determinar el nombre del centro según el estado de vinculación
        if estado_vinculacion == 0:
            nombre_centro = "Sin centro Vinculado"
        else:
            # Buscar el nombre del centro en el diccionario de centros
            nombre_centro = centros.get(codigo_centro, "Sin centro Asociado")
        
        datos_instructores.append([cedula, nombre, codigo_centro, nombre_centro, estado_vinculacion])  # Añadimos estado de vinculación
    
    cursor.close()
    
    return render_template(
        "INSTRUCTORESFULL.html", 
        centros=centros, 
        perfiles=perfiles, 
        datos_instructores=datos_instructores, 
        codigo_centro_usuario=session['codigo_centro'],
        nombre_centro_usuario=nombre_centro_usuario
        # Pasamos el código del centro del usuario a la plantilla
    )



@registrar_instructor_bp.route("/eliminar_instructor", methods=["POST"])
@login_required
def eliminar_instructor():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se recibió JSON"}), 400

    cedula = data.get("cedula")
    if not cedula:
        return jsonify({"error": "Falta la cédula"}), 400

    cursor = mysql.connection.cursor()
    try:
        # 🔹 Verificar si el instructor tiene fichas activas
        query_fichas = """
            SELECT 
                f.numero_ficha,
                p.nombre AS programa,
                f.fecha_fin_lectiva,
                p.cant_trimestres,
                (
                  SELECT MAX(
                    CAST(SUBSTRING_INDEX(ta.id_trimestre, '_', -1) AS UNSIGNED)
                  )
                  FROM trimetres_ano ta
                  WHERE ta.numero_ficha = f.numero_ficha
                ) AS trimestre_actual,
                f.id_instructor
            FROM fichas f
            INNER JOIN programas p ON f.programa = p.id_prog
            WHERE f.id_instructor = %s AND f.estado = 1
        """
        cursor.execute(query_fichas, (cedula,))
        fichas_activas = cursor.fetchall()

        if fichas_activas:
            # 🔹 Obtener nombre del instructor
            cursor.execute("SELECT nombre FROM datos_basicos WHERE cedula = %s", (cedula,))
            nombre_instructor = cursor.fetchone()
            nombre_instructor = nombre_instructor[0] if nombre_instructor else "Desconocido"

            # 🔹 Obtener código del centro del instructor
            cursor.execute("SELECT codigo_centro FROM vinculados WHERE cedula = %s", (cedula,))
            codigo_centro_row = cursor.fetchone()
            codigo_centro = codigo_centro_row[0] if codigo_centro_row else None

            instructores_disponibles = []
            if codigo_centro:
                # 🔹 Obtener instructores disponibles del mismo centro
                #    solo aquellos cuyo rol en datos_basicos sea 'instructor'
                query_instructores = """
                    SELECT DISTINCT
                        v.cedula,
                        db.nombre
                    FROM vinculados v
                    INNER JOIN datos_basicos db ON v.cedula = db.cedula
                    WHERE v.estado = 1
                      AND v.codigo_centro = %s
                      AND v.cedula != %s
                      AND db.rol = 'instructor'
                    ORDER BY db.nombre
                """
                cursor.execute(query_instructores, (codigo_centro, cedula))
                instructores_disponibles = cursor.fetchall()
            else:
                # Si no hay codigo_centro, devolvemos lista vacía de instructores
                instructores_disponibles = []

            # 🔹 Formatear fichas para enviar al frontend
            fichas_data = []
            for ficha in fichas_activas:
                fichas_data.append({
                    "numero_ficha": ficha[0],
                    "programa": ficha[1],
                    "fecha_fin_lectiva": str(ficha[2]) if ficha[2] else "N/A",
                    "cant_trimestres": ficha[3],
                    # trimestre_actual ya es el número máximo (1..4). Si es None -> 0
                    "trimestre_actual": int(ficha[4]) if ficha[4] is not None else 0
                })

            # 🔹 Formatear instructores disponibles
            instructores_data = []
            for inst in instructores_disponibles:
                instructores_data.append({
                    "cedula": inst[0],
                    "nombre": inst[1]
                })

            cursor.close()
            return jsonify({
                "tiene_fichas_activas": True,
                "nombre_instructor": nombre_instructor,
                "fichas": fichas_data,
                "instructores_disponibles": instructores_data
            }), 200

        # 🔹 Si no tiene fichas activas, eliminar directamente
        cursor.execute("DELETE FROM vinculados WHERE cedula = %s", (cedula,))
        mysql.connection.commit()
        cursor.close()

        return jsonify({"success": True, "message": "Instructor desvinculado correctamente"}), 200

    except Exception as e:
        mysql.connection.rollback()
        cursor.close()
        return jsonify({"error": str(e)}), 500



@registrar_instructor_bp.route("/reasignar_fichas", methods=["POST"])
@login_required
def reasignar_fichas():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se recibió JSON"}), 400
    
    cedula_instructor = data.get("cedula_instructor")
    asignaciones = data.get("asignaciones")  # Lista de {numero_ficha, nuevo_instructor}
    
    if not cedula_instructor or not asignaciones:
        return jsonify({"error": "Faltan datos necesarios"}), 400
    
    cursor = mysql.connection.cursor()
    try:
        # 🔹 Actualizar cada ficha con su nuevo instructor
        for asignacion in asignaciones:
            numero_ficha = asignacion.get("numero_ficha")
            nuevo_instructor = asignacion.get("nuevo_instructor")
            
            if numero_ficha and nuevo_instructor:
                cursor.execute(
                    "UPDATE fichas SET id_instructor = %s WHERE numero_ficha = %s",
                    (nuevo_instructor, numero_ficha)
                )
        
        # 🔹 Desvincular al instructor original
        cursor.execute("DELETE FROM vinculados WHERE cedula = %s", (cedula_instructor,))
        
        mysql.connection.commit()
        cursor.close()
        
        return jsonify({"success": True, "message": "Fichas reasignadas e instructor desvinculado correctamente"}), 200
        
    except Exception as e:
        mysql.connection.rollback()
        cursor.close()
        return jsonify({"error": str(e)}), 500


@registrar_instructor_bp.route('/obtener_centro_usuario')
@login_required
def obtener_centro_usuario():
    user_cedula = session.get('cedula')
    if not user_cedula:
        return jsonify({"error": "No se encontró la cédula del usuario"}), 400
    
    cursor = mysql.connection.cursor()
    
    # Obtener el código del centro de formación del usuario autenticado
    cursor.execute("SELECT codigo_centro FROM vinculados WHERE cedula = %s", (user_cedula,))
    usuario_centro = cursor.fetchone()
    
    if not usuario_centro or not usuario_centro[0]:
        cursor.close()
        return jsonify({"error": "El usuario no está vinculado a ningún centro"}), 400
    
    codigo_centro = usuario_centro[0]
    
    # Obtener nombre del centro
    cursor.execute('SELECT codigo, nombre FROM centros WHERE codigo=%s', (codigo_centro,))
    centro_info = cursor.fetchone()
    cursor.close()
    
    if not centro_info:
        return jsonify({"error": "No se encontró información del centro"}), 404
    
    return jsonify({
        "codigo_centro": centro_info[0],
        "nombre_centro": centro_info[1]
    })


@registrar_instructor_bp.route('/vincular_instructor', methods=['POST'])
@login_required
def vincular_instructor():
    data = request.json
    
    if not data or 'cedula' not in data or 'codigo_centro' not in data:
        return jsonify({"error": "Datos incompletos"}), 400
    
    cedula = data.get('cedula')
    codigo_centro = data.get('codigo_centro')
    estado = data.get('estado', 1)  # Por defecto, estado activo
    
    cursor = mysql.connection.cursor()
    try:
        # Verificar si el instructor ya existe en la tabla vinculados
        cursor.execute("SELECT * FROM vinculados WHERE cedula = %s", (cedula,))
        existing = cursor.fetchone()
        
        if existing:
            # Actualizar registro existente
            cursor.execute(
                "UPDATE vinculados SET codigo_centro = %s, estado = %s WHERE cedula = %s",
                (codigo_centro, estado, cedula)
            )
        else:
            # Insertar nuevo registro
            cursor.execute(
                "INSERT INTO vinculados (cedula, codigo_centro, estado) VALUES (%s, %s, %s)",
                (cedula, codigo_centro, estado)
            )
        
        mysql.connection.commit()
        cursor.close()
        return jsonify({"success": True, "message": "Instructor vinculado correctamente"})
    
    except Exception as e:
        mysql.connection.rollback()
        cursor.close()
        return jsonify({"error": str(e)}), 500
    
       
@registrar_instructor_bp.route('/obtener_perfiles_instructor/<cedula>')
@login_required
def obtener_perfiles_instructor(cedula):
    cursor = mysql.connection.cursor()
    try:
        # Obtener información básica del instructor
        cursor.execute("SELECT nombre FROM datos_basicos WHERE cedula = %s", (cedula,))
        instructor_info = cursor.fetchone()
        
        if not instructor_info:
            return jsonify({"success": False, "message": "Instructor no encontrado"}), 404
        
        # Obtener el id_instructor desde la tabla instructores
        cursor.execute("SELECT id_instructor FROM instructores WHERE cedula = %s", (cedula,))
        instructor_data = cursor.fetchone()
        
        if not instructor_data:
            return jsonify({"success": False, "message": "Datos del instructor no encontrados"}), 404
        
        id_instructor = instructor_data[0]
        
        # Obtener los perfiles asociados al instructor desde perfil_instructor
        cursor.execute("""
            SELECT pi.id_perfil_instructor, p.id_perfil, p.nombre 
            FROM perfil_instructor pi 
            JOIN perfiles p ON pi.id_perfil = p.id_perfil 
            WHERE pi.id_instructor = %s
        """, (id_instructor,))
        perfiles_data = cursor.fetchall()
        
        subperfiles = []
        for perfil in perfiles_data:
            subperfiles.append({
                "id": perfil[0],  # ID del registro en perfil_instructor
                "id_perfil": perfil[1],  # ID del perfil
                "nombre": perfil[2]  # Nombre del perfil
            })
        
        # Obtener todos los perfiles disponibles para seleccionar
        cursor.execute("SELECT id_perfil, nombre FROM perfiles ORDER BY nombre")
        perfiles_disponibles_data = cursor.fetchall()
        
        perfiles_disponibles = []
        for perfil in perfiles_disponibles_data:
            perfiles_disponibles.append({
                "id": perfil[0],
                "nombre": perfil[1]
            })
        
        cursor.close()
        
        return jsonify({
            "success": True,
            "instructor": {
                "cedula": cedula,
                "nombre": instructor_info[0],
                "id_instructor": id_instructor
            },
            "perfil_principal": None,
            "subperfiles": subperfiles,
            "perfiles_disponibles": perfiles_disponibles
        })
        
    except Exception as e:
        cursor.close()
        return jsonify({"success": False, "message": str(e)}), 500


@registrar_instructor_bp.route('/agregar_subperfil', methods=['POST'])
@login_required
def agregar_subperfil():
    data = request.get_json()
    
    if not data or 'cedula' not in data or 'id_perfil' not in data:
        return jsonify({"success": False, "message": "Datos incompletos"}), 400
    
    cedula = data.get('cedula')
    id_perfil = data.get('id_perfil')
    
    cursor = mysql.connection.cursor()
    try:
        # Obtener el id_instructor
        cursor.execute("SELECT id_instructor FROM instructores WHERE cedula = %s", (cedula,))
        instructor_data = cursor.fetchone()
        
        if not instructor_data:
            cursor.close()
            return jsonify({"success": False, "message": "Instructor no encontrado"}), 404
        
        id_instructor = instructor_data[0]
        
        # Verificar si ya existe este perfil para el instructor
        cursor.execute("""
            SELECT id_perfil_instructor 
            FROM perfil_instructor 
            WHERE id_instructor = %s AND id_perfil = %s
        """, (id_instructor, id_perfil))
        existing = cursor.fetchone()
        
        if existing:
            cursor.close()
            return jsonify({"success": False, "message": "Este perfil ya está asociado al instructor"}), 400
        
        # Insertar la asociación en perfil_instructor
        cursor.execute("""
            INSERT INTO perfil_instructor (id_instructor, id_perfil) 
            VALUES (%s, %s)
        """, (id_instructor, id_perfil))
        
        mysql.connection.commit()
        cursor.close()
        
        return jsonify({"success": True, "message": "Perfil agregado correctamente"})
        
    except Exception as e:
        mysql.connection.rollback()
        cursor.close()
        return jsonify({"success": False, "message": str(e)}), 500



@registrar_instructor_bp.route('/eliminar_subperfil', methods=['POST'])
@login_required
def eliminar_subperfil():
    data = request.get_json()
    
    # Aceptar id_subperfil (viejo) o id_perfil_instructor (nuevo)
    id_relacion = data.get('id_perfil_instructor') or data.get('id_subperfil')
    
    if not id_relacion:
        return jsonify({"success": False, "message": "ID de la relación perfil-instructor requerido"}), 400
    
    cursor = mysql.connection.cursor()
    try:
        # Verificar que la relación existe
        cursor.execute("""
            SELECT id_perfil_instructor 
            FROM perfil_instructor 
            WHERE id_perfil_instructor = %s
        """, (id_relacion,))
        existing = cursor.fetchone()
        
        if not existing:
            cursor.close()
            return jsonify({"success": False, "message": "Relación perfil-instructor no encontrada"}), 404
        
        # Eliminar la relación
        cursor.execute("DELETE FROM perfil_instructor WHERE id_perfil_instructor = %s", (id_relacion,))
        
        mysql.connection.commit()
        cursor.close()
        
        return jsonify({"success": True, "message": "Perfil eliminado correctamente"})
        
    except Exception as e:
        mysql.connection.rollback()
        cursor.close()
        return jsonify({"success": False, "message": str(e)}), 500
