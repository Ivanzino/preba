from flask import Blueprint, Flask, jsonify, make_response, render_template, request, redirect, url_for, flash, session
import pandas as pd
import hashlib
import os
from collections import defaultdict
from flask_mysqldb import MySQL
import mysql.connector

# Crear el Blueprint para asociar competencias
admin_bp = Blueprint('admin', __name__)

# Inicializar MySQL (esto se puede mover a app.py si es necesario)
mysql = MySQL()


@admin_bp.route('/verificar_admin', methods=['GET'])
def verificar_admin():
    user = session.get('user')
    if not user or len(user) < 1:
        return jsonify({'es_admin': False})
    
    cedula = user[0]
    try:
        with mysql.connection.cursor() as cursor:
            cursor.execute('SELECT rol FROM datos_basicos WHERE cedula = %s', (cedula,))
            resultado = cursor.fetchone()
            if resultado and resultado[0] == 'admin':
                return jsonify({'es_admin': True})
    except Exception as e:
        print(f"Error al verificar admin: {e}")
    
    return jsonify({'es_admin': False})


@admin_bp.route('/gestionar_roles', methods=['GET', 'POST'])
def gestionar_roles():
    try:
        user = session.get('user')
        if not user or len(user) < 1:
            return render_template("login.html", mensaje="Inicia sesión para acceder.")

        cedula = user[0]
        with mysql.connection.cursor() as cursor:
            # Verificar si es admin
            cursor.execute('SELECT rol FROM datos_basicos WHERE cedula = %s', (cedula,))
            rol_usuario = cursor.fetchone()
            if not rol_usuario or rol_usuario[0] != 'admin':
                return render_template("interfazmarlovy.html", mensaje="No tienes permisos para acceder a esta página.")
            
            # Obtener el centro del usuario
            cursor.execute('SELECT * FROM vinculados WHERE cedula = %s', (cedula,))
            datos_vinculado = cursor.fetchone()
            if not datos_vinculado:
                return render_template("error.html", mensaje="No se encontró información del usuario.")
            
            codigo_centro = datos_vinculado[2]
            mensaje = None
            
            # Si es POST, actualizar el rol del usuario seleccionado
            if request.method == 'POST':
                usuario_id = request.form.get('usuario')
                nuevo_rol = request.form.get('nuevo_rol')
                
                # Verificar que no intente cambiar su propio rol
                if usuario_id == cedula:
                    return jsonify({
                        "status": "error", 
                        "mensaje": "No puedes modificar tu propio rol."
                    }), 400
                
                if usuario_id and nuevo_rol and nuevo_rol in ['instructor', 'gestor', 'gestor normal', 'admin']:
                    cursor.execute('UPDATE datos_basicos SET rol = %s WHERE cedula = %s', 
                                (nuevo_rol, usuario_id))
                    mysql.connection.commit()
                    mensaje = f"Rol actualizado correctamente para el usuario con cédula {usuario_id}"
                    
                    # Si es una solicitud AJAX, devolver JSON
                    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                        return jsonify({
                            "status": "success", 
                            "mensaje": mensaje
                        }), 200
            
            # Obtener todos los usuarios del mismo centro
            cursor.execute('''
                SELECT db.cedula, db.nombre, db.rol 
                FROM datos_basicos db
                JOIN vinculados v ON db.cedula = v.cedula
                WHERE v.codigo_centro = %s
            ''', (codigo_centro,))
            
            usuarios = cursor.fetchall()
            
            # Si es una solicitud AJAX para obtener la lista de usuarios
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest' and request.method == 'GET':
                usuarios_list = []
                for usuario in usuarios:
                    # Filtrar solo los no admins para la lista de cambio de rol
                    if usuario[0] != cedula and usuario[2] != 'admin':
                        usuarios_list.append({
                            'cedula': usuario[0],
                            'nombre': usuario[1],
                            'rol': usuario[2]
                        })
                return jsonify(usuarios_list)
            
            return render_template("admin.html", 
                                usuarios=usuarios,
                                codigo_centro=codigo_centro,
                                mensaje=mensaje,
                                cedula_admin=cedula)  # Pasamos la cédula del admin para compararla en el frontend
                                
    except Exception as e:
        return render_template("error.html", mensaje=f"Error: {str(e)}")
                            
@admin_bp.route('/eliminar_usuario', methods=['POST'])
def eliminar_usuario():
    try:
        user = session.get('user')
        if not user or len(user) < 1:
            return jsonify({"status": "error", "mensaje": "Inicia sesión para acceder."}), 401

        cedula_admin = user[0]
        with mysql.connection.cursor() as cursor:
            # Verificar si es admin
            cursor.execute('SELECT rol FROM datos_basicos WHERE cedula = %s', (cedula_admin,))
            rol_usuario = cursor.fetchone()
            if not rol_usuario or rol_usuario[0] != 'admin':
                return jsonify({"status": "error", "mensaje": "No tienes permisos para realizar esta acción."}), 403
            
            # Obtener los datos del formulario
            cedula_eliminar = request.form.get('cedula')
            rol_eliminar = request.form.get('rol')
            
            if not cedula_eliminar:
                return jsonify({"status": "error", "mensaje": "No se proporcionó una cédula válida."}), 400
            
            # Verificar que no intente eliminarse a sí mismo
            if cedula_eliminar == cedula_admin:
                return jsonify({
                    "status": "error", 
                    "mensaje": "No puedes eliminarte a ti mismo."
                }), 400
            
            # Iniciar transacción
            cursor.execute("START TRANSACTION")
            
            try:
                # Si es instructor, eliminar de instructores, vinculados y datos_basicos
                if rol_eliminar == 'instructor':
                    # Primero verificamos si existe en la tabla instructores
                    cursor.execute('SELECT * FROM instructores WHERE cedula = %s', (cedula_eliminar,))
                    if cursor.fetchone():
                        cursor.execute('DELETE FROM instructores WHERE cedula = %s', (cedula_eliminar,))
                
                # Para cualquier rol, eliminar de vinculados y datos_basicos
                cursor.execute('DELETE FROM vinculados WHERE cedula = %s', (cedula_eliminar,))
                cursor.execute('DELETE FROM datos_basicos WHERE cedula = %s', (cedula_eliminar,))
                
                # Confirmar los cambios
                cursor.execute("COMMIT")
                
                return jsonify({
                    "status": "success",
                    "mensaje": f"Usuario con cédula {cedula_eliminar} eliminado correctamente."
                }), 200
                
            except Exception as e:
                # Si hay error, revertir los cambios
                cursor.execute("ROLLBACK")
                return jsonify({
                    "status": "error",
                    "mensaje": f"Error al eliminar usuario: {str(e)}"
                }), 500
                
    except Exception as e:
        return jsonify({"status": "error", "mensaje": f"Error: {str(e)}"}), 500