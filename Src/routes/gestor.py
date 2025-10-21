# gestor.py
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, current_app
from flask_mysqldb import MySQL
import hashlib
from functools import wraps

gestor_bp = Blueprint('gestor', __name__)
mysql = MySQL()
# Decorador para verificar si hay sesión activa
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            flash("Debes iniciar sesión primero", "error")
            return redirect(url_for('gestor.gestor'))  # Redirige al login
        return f(*args, **kwargs)
    return decorated_function


@gestor_bp.route("/login")
def login():
    return render_template("login.html")


# Ruta de login
@gestor_bp.route("/gestor", methods=['GET', 'POST'])
def gestor():
    if request.method == 'POST':
        usuario = request.form['username']
        password = request.form['password']
        
        # Encriptar la contraseña
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        
        # Acceder a las configuraciones de MySQL desde current_app
        mysql_user = current_app.config['MYSQL_USER']
        mysql_password = current_app.config['MYSQL_PASSWORD']
        mysql_db = current_app.config['MYSQL_DB']
        mysql_host = current_app.config['MYSQL_HOST']
        
        # Crear el cursor con la conexión de la base de datos
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT * FROM datos_basicos WHERE cedula = %s AND contrasena = %s', (usuario, hashed_password))
        user = cursor.fetchone()
        cursor.execute("SELECT codigo_centro FROM vinculados WHERE cedula = %s", (usuario,))
        usuario_centro = cursor.fetchone()
        cursor.close()
        print(usuario_centro)

        if user and usuario_centro:
            # Guarda el usuario en la sesión
            session['user'] = user
            session['cedula']=user[0]
            session['centro_usuario']=usuario_centro[0]
            session['rol']=user[5]
            session.permanent = True  # Marca la sesión como permanente
            if user[5] == "admin":
                return redirect(url_for("gestor.inicio_admin"))
            elif user[5]== "gestor":
                return redirect(url_for("gestor.inicio_gestor"))
            
        else:
            flash("Credenciales incorrectas", "error")
            return render_template("login.html")
    
    return render_template("login.html")

# Ruta protegida que necesita sesión
@gestor_bp.route("/inicio_gestor")
@login_required  # Aplica la validación de sesión
def inicio_gestor():
    return render_template("interfazmarlovy.html")

@gestor_bp.route("/inicio_admin")
@login_required  # Aplica la validación de sesión
def inicio_admin():
    return render_template("administrador.html")



