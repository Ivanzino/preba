from flask import Blueprint
from flask import Flask, jsonify, make_response, render_template, request, redirect, url_for, flash, session
import pandas as pd
import hashlib
import os
from collections import defaultdict
from flask_mysqldb import MySQL
import mysql.connector
from routes.actualizar_instructor import actualizar_instructor

# Crear el Blueprint
datos_actualizados_bp = Blueprint('datos_actualizados', __name__)

# Inicializar MySQL (esto se puede mover a app.py si es necesario)
mysql = MySQL()




# routes_actualizar.py (fragmento)
import traceback
from flask import request, jsonify

@datos_actualizados_bp.route('/datos_actualizados', methods=['POST'])
def datos_actualizados():
    try:
        data = request.get_json(force=True)
        print("Payload recibido en /datos_actualizados:", data)

        # Validación mínima
        required = ['cedula', 'nombre', 'correo', 'telefono', 'vinculo', 'centro']
        missing = [k for k in required if not data.get(k) and data.get(k) != 0]
        if missing:
            return jsonify({'error': f'Faltan campos: {", ".join(missing)}'}), 400

        cedula = str(data['cedula']).strip()
        nombre = data['nombre'].strip()
        correo = data['correo'].strip()
        telefono = str(data['telefono']).strip()
        vinculo = data['vinculo']
        centro = data['centro']

        cursor = mysql.connection.cursor()
        try:
            # Actualiza datos_basicos (crea la consulta que necesites)
            cursor.execute("""
                UPDATE datos_basicos
                SET nombre = %s, correo = %s, telefono = %s
                WHERE cedula = %s
            """, (nombre, correo, telefono, cedula))

            # Actualiza instructores (solo vinculo si la columna existe)
            cursor.execute("""
                UPDATE instructores
                SET vinculo = %s
                WHERE cedula = %s
            """, (vinculo, cedula))

            # Actualiza vinculados (centro)
            cursor.execute("""
                UPDATE vinculados
                SET codigo_centro = %s
                WHERE cedula = %s
            """, (centro, cedula))

            mysql.connection.commit()
        except Exception as e_inner:
            mysql.connection.rollback()
            print("Error en queries de /datos_actualizados:", e_inner)
            traceback.print_exc()
            return jsonify({'error': 'Error en la base de datos', 'detail': str(e_inner)}), 500
        finally:
            cursor.close()

        return jsonify({'status': 'ok'}), 200

    except Exception as e:
        print("Excepción en /datos_actualizados:", e)
        traceback.print_exc()
        return jsonify({'error': 'Excepción en el servidor', 'detail': str(e)}), 500
