from flask import Blueprint
from flask import Flask, jsonify, make_response, render_template, request, redirect, url_for, flash, session
import pandas as pd
import hashlib
import os
from collections import defaultdict
from flask_mysqldb import MySQL
import mysql.connector

# Crear el Blueprint
sedes_bp = Blueprint('sedes', __name__)

# Inicializar MySQL (esto se puede mover a app.py si es necesario)
mysql = MySQL()



@sedes_bp.route("/sedes")
def sedes():
    try:
        # Validar usuario en la sesión
        user = session.get('user')
        if not user or len(user) < 1:
            return render_template("login.html", mensaje="Inicia sesión para acceder a las sedes.")
        
        cedula = user[0]

        # Consultar datos del usuario y del centro
        with mysql.connection.cursor() as cursor:
            cursor.execute('SELECT * FROM vinculados WHERE cedula = %s', (cedula,))
            datos = cursor.fetchone()
            if not datos:
                return render_template("error.html", mensaje="No se encontraron datos vinculados para este usuario.")

            centro = datos[2]
            cursor.execute('SELECT * FROM centros WHERE codigo = %s', (centro,))
            nombre_centro = cursor.fetchone()
            if not nombre_centro:
                return render_template("error.html", mensaje="No se encontró el centro asociado.")
        
        # Preparar datos para la plantilla
        nombre = nombre_centro[1]  # Asumiendo que el nombre del centro está en la columna 1
        return render_template("registroSede.html", nombre_centro=nombre)
    
    except Exception as e:
        # Manejo de errores genéricos
        return render_template("error.html", mensaje=f"Error al procesar la solicitud: {str(e)}")
