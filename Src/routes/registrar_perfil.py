from flask import Blueprint
from flask import Flask, jsonify, make_response, render_template, request, redirect, url_for, flash, session
import pandas as pd
import hashlib
import os
from collections import defaultdict
from flask_mysqldb import MySQL
import mysql.connector

# Crear el Blueprint
registrar_perfil_bp = Blueprint('registrar_perfil', __name__)

# Inicializar MySQL (esto se puede mover a app.py si es necesario)
mysql = MySQL()

@registrar_perfil_bp.route("/perfiles")
def perfiles():
    return render_template("perfiles.html")


# Definir el endpoint
@registrar_perfil_bp.route("/registrar_perfil", methods=["POST"])
def registrar_perfil():
    try:
        data = request.get_json()
        nombre = data.get("nombre", "").strip()

        if not nombre:
            return jsonify({"error": "El nombre no puede estar vacío"}), 400

        cur = mysql.connection.cursor()

        # Verificar si el nombre ya existe en la tabla 'perfiles'
        cur.execute("SELECT nombre FROM perfiles WHERE nombre = %s", (nombre,))
        existe = cur.fetchone()

        if existe:
            return jsonify({"error": "El perfil ya existe"}), 400

        # Insertar el nuevo perfil
        cur.execute("INSERT INTO perfiles (nombre) VALUES (%s)", (nombre,))
        mysql.connection.commit()

        return jsonify({"mensaje": "Perfil registrado con éxito"}), 201

    except Exception as e:
        return jsonify({"error": f"Error en el servidor: {str(e)}"}), 500

    finally:
        cur.close()