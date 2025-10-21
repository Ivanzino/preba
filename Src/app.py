import hashlib
from flask import Flask
from flask import Flask, jsonify, make_response, render_template, request, redirect, url_for, flash, session
from flask_mysqldb import MySQL
import pandas as pd 
import os
from collections import defaultdict
from routes.mostrar_datos import mostrar_datos_bp  # Importar el Blueprint
from routes.registrar_sedes import registrar_sedes_bp  # Importar el Blueprint
from routes.gestor import gestor_bp  # Importar el Blueprint
from routes.sedes import sedes_bp  # Importar el Blueprint
from routes.registrar_instructor import registrar_instructor_bp  # Importar el Blueprint
from routes.registrar import registrar_bp  # Importar el Blueprint
from routes.actualizar_instructor import actualizar_instructor_bp  # Importar el Blueprint
from routes.datos_actualizados import datos_actualizados_bp  # Importar el Blueprint
from routes.upload import upload_bp  # Importar el Blueprint
from routes.upload_excel import upload_excel_bp  # Importar el Blueprint
from routes.registrar_ambientes import registrar_ambientes_bp   # Importar el Blueprint
from routes.registrar_perfil import registrar_perfil_bp   # Importar el Blueprint
from routes.malla_espejo import malla_espejo_bp   # Importar el Blueprint
from routes.asociarCompetencias import asociarCompetencias_bp   # Importar el Blueprint
from routes.trimestresAño import trimestresAño_bp   # Importar el Blueprint
from routes.enviar_fichas import enviar_fichas_bp   # Importar el Blueprint
from routes.crear_agenda import crear_agenda_bp   # Importar el Blueprint
from routes.registrarAprendiz import registrarAprendiz_bp   # Importar el Blueprint
from routes.generar_horarios import generar_horarios_bp   # Importar el Blueprint
from routes.admin import admin_bp
from routes.preview_programas_fichas import preview_programas_fichas_bp  # Importar el Blueprint
from routes.horarios import horarios_bp
from routes.generador_horarios import generador_horarios_bp
from routes.perfilesAsociarComp import perfilesAsociarComp_bp
from routes.generarHora import generarHora_bp   
from routes.generar_bp import generar_bp




# settings
class Config:
    SECRET_KEY = b'_5#y2L"F4Q8z\nec]/'
    MYSQL_HOST = 'localhost'
    MYSQL_USER = 'root'
    MYSQL_PASSWORD = 'Ivanzino0214'
    MYSQL_DB = 'prueba horarios3'



app = Flask(__name__)
app.config.from_object(Config)    
mysql = MySQL(app)
app.mysql = mysql


# blueprints
app.register_blueprint(mostrar_datos_bp)
app.register_blueprint(registrar_sedes_bp)
app.register_blueprint(gestor_bp)
app.register_blueprint(sedes_bp)
app.register_blueprint(registrar_instructor_bp)
app.register_blueprint(registrar_bp)
app.register_blueprint(actualizar_instructor_bp)
app.register_blueprint(datos_actualizados_bp)
app.register_blueprint(upload_bp)
app.register_blueprint(upload_excel_bp) 
app.register_blueprint(registrar_ambientes_bp)
app.register_blueprint(registrar_perfil_bp)
app.register_blueprint(malla_espejo_bp)
app.register_blueprint(asociarCompetencias_bp)
app.register_blueprint(trimestresAño_bp)
app.register_blueprint(enviar_fichas_bp)
app.register_blueprint(crear_agenda_bp)
app.register_blueprint(registrarAprendiz_bp)
app.register_blueprint(generar_horarios_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(horarios_bp)
app.register_blueprint(generador_horarios_bp)
app.register_blueprint(perfilesAsociarComp_bp)
app.register_blueprint(generarHora_bp)
app.register_blueprint(generar_bp)







@app.route("/")
def index():
    return render_template("indexfinal.html")


@app.route("/cerrar_sesion")
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
