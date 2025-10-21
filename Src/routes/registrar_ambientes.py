from flask import Blueprint, render_template, request, redirect, url_for, flash,session
from flask_mysqldb import MySQL
import hashlib
from functools import wraps

registrar_ambientes_bp = Blueprint('registrar_ambientes', __name__)
mysql = MySQL()

@registrar_ambientes_bp.route('/registrar_ambientes', methods=['GET', 'POST'])
def registrar_ambientes():
    if request.method == 'POST':
        id_ambiente = request.form.get('Ambiente')
        bloque = request.form.get('Bloque')
        codigo_sede = request.form.get('Sede')
        tipo = request.form.get('Tipo')  # Este valor ya será el número (como string)

        # Convertir a entero si es necesario
        tipo = int(tipo)

        # Inserta el nuevo ambiente en la base de datos
        cursor = mysql.connection.cursor()
        query = """INSERT INTO ambientes (nombre, bloque, codigo_sede, tipo)
                   VALUES (%s, %s, %s, %s)"""
        cursor.execute(query, (id_ambiente, bloque, codigo_sede, tipo))
        mysql.connection.commit()
        cursor.close()

        # Redirige a la misma vista para cargar los datos más recientes
        return redirect(url_for('registrar_ambientes.registrar_ambientes'))
    else:
        # Verifica la sesión
        user = session.get('user')
        if not user or len(user) < 1:
            return render_template("login.html", mensaje="Inicia sesión para registrar sedes.")

        cedula = user[0]
        cursor = mysql.connection.cursor()
        
        # Obtener datos del usuario vinculado
        cursor.execute('SELECT * FROM vinculados WHERE cedula = %s', (cedula,))
        datos = cursor.fetchone()
        if not datos:
            cursor.close()
            return render_template("login.html", mensaje="No se encontró sesión válida.")

        codigo_centro = datos[2]
        
        # Obtener las sedes según el código del centro
        cursor.execute('SELECT codigo_sede, nombre FROM sedes WHERE codigo_centro = %s', (codigo_centro,))
        sedes = cursor.fetchall()
        cursor.close()

        if not sedes:
            return render_template("ambientes.html", mensaje="No se encontraron sedes para registrar ambientes.")

        # Retorna la plantilla con los datos actualizados
        return render_template("ambientes.html", sedes=sedes)

