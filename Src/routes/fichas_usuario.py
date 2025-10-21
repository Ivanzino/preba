from flask import Blueprint, render_template, request, redirect, url_for, session, flash, current_app,jsonify
from flask_mysqldb import MySQL
from routes.gestor import gestor_bp,login_required

fichas_usuario_bp = Blueprint('fichas_usuario', __name__)
mysql = MySQL()

@login_required
@fichas_usuario_bp("/consultar_fichas")
def consultar_fichas():
    centro_usuario=session.get('centro_usuario')
    if not centro_usuario:
        return jsonify({"error": "No se encontró la cédula del usuario"}), 400
    
    cursor= mysql.connection.cursor()
    cursor.execute("SELECT * FROM vista_fichas_por_centro WHERE codigo = %s", (centro_usuario,))
    datos_fichas=cursor.fetchall()

    
    



