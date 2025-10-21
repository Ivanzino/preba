import hashlib
from flask import Flask, Blueprint, request, render_template, jsonify, url_for, redirect, session,flash
import openpyxl
from io import BytesIO
from flask_mysqldb import MySQL
from werkzeug.security import generate_password_hash
from routes.registrar_instructor import registrar_instructor_bp  # Importar el Blueprint
from routes.gestor import login_required  # Se asume que existe este decorador
import re


# --- Configuración y definición del blueprint ---
upload_excel_bp = Blueprint('upload_excel', __name__)
mysql = MySQL()

upload_excel_bp.register_blueprint(registrar_instructor_bp)

# Diccionario para mapear el nombre del perfil a su id
perfil_map = {
    "abogado": 1,
    "arquitecto": 2,
    "ingeniero civil": 3,
    "ingeniero industrial": 4,
    "médico cirujano": 5,
    "medico": 5,
    "psicólogo": 6,
    "economista": 7,
    "contador público": 8,
    "ingeniero en sistemas": 9,
    "licenciado en administración de empresas": 10,
    "licenciado en educación": 11,
    "enfermero": 12,
    "farmacéutico": 13,
    "ingeniero eléctrico": 14,
    "licenciado en marketing": 15,
    "diseñador gráfico": 16,
    "periodista": 17,
    "antropólogo": 18,
    "ingeniero mecánico": 19,
    "biólogo": 20,
    "físico": 21,
    "matemático": 22,
    "científico de datos": 23,
    "ingeniero químico": 24,
    "profesor de lenguas extranjeras": 25,
    "sociologo": 26,
    "terapeuta ocupacional": 27,
    "ingeniero de software": 28,
    "abogado penalista": 29,
    "odontólogo": 30,
    "veterinario": 31,
    "administrador de redes y sistemas": 32,
    "diseñador de modas": 33,
    "chef": 34,
    "fisioterapeuta": 35,
    "licenciado en comunicación social": 36,
    "licenciado en filosofía": 37,
    "historiador": 38,
    "licenciado en sociología": 39,
    "ingeniero ambiental": 40,
    "ingeniero en energías renovables": 41,
    "técnico en electrónica": 42,
    "ingeniero agrónomo": 43
}


@upload_excel_bp.route('/upload-excel', methods=['POST'])
def upload_excel():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No se ha subido ningún archivo."}), 400

    try:
        excel_file = BytesIO(file.read())
        workbook = openpyxl.load_workbook(excel_file)
        sheet = workbook.active

        instructors = []
        # Se asume que la fila 8 es de encabezados y los datos comienzan en la fila 9 (columnas A a F)
        for row in sheet.iter_rows(min_row=9, values_only=True):
            # row puede contener valores None
            if len(row) >= 6 and any(cell is not None for cell in row[0:6]):
                perfil_raw = row[2]  # en el excel viene el nombre del perfil (o varios separados por , ;)
                perfil_text = str(perfil_raw).strip() if perfil_raw is not None else ""
                instructor = {
                    "cedula": str(row[0]).strip() if row[0] is not None else "",
                    "nombre": str(row[1]).strip() if row[1] is not None else "",
                    "perfil": perfil_text,   # <-- clave 'perfil' (nombre o lista separada)
                    "vinculo": str(row[3]).strip() if row[3] is not None else "",
                    "telefono": str(row[4]).strip() if row[4] is not None else "",
                    "correo": str(row[5]).strip() if row[5] is not None else ""
                }
                instructors.append(instructor)

        rendered_html = render_template("preview_instructors.html", instructors=instructors)
        return jsonify({"html": rendered_html})
    except Exception as e:
        return jsonify({"error": f"Error al procesar el archivo: {str(e)}"}), 500
    
    

@upload_excel_bp.route('/insert_instructors', methods=['POST'])
def insert_instructors():
    try:
        # Tomamos arrays enviados desde el form preview (name="cedula[]", etc.)
        cedulas = request.form.getlist('cedula[]')
        nombres = request.form.getlist('nombre[]')
        perfiles = request.form.getlist('perfil[]')   # nombre(s) del perfil tal cual en la preview
        vinculos = request.form.getlist('vinculo[]')
        telefonos = request.form.getlist('telefono[]')
        correos = request.form.getlist('correo[]')

        cursor = mysql.connection.cursor()
        # Centro por defecto (si no viene en Excel, tomamos el centro de la sesión)
        codigo_centro_default = session.get('codigo_centro') or session.get('codigo_centro_usuario')

        for idx, ced in enumerate(cedulas):
            cedula = str(ced).strip()
            if not cedula:
                continue

            nombre = (nombres[idx] if idx < len(nombres) else "").strip()
            perfil_text = (perfiles[idx] if idx < len(perfiles) else "").strip()
            vinculo_raw = (vinculos[idx] if idx < len(vinculos) else "").strip().lower()
            telefono = (telefonos[idx] if idx < len(telefonos) else "").strip()
            correo = (correos[idx] if idx < len(correos) else "").strip()

            # Normalizar vínculo (opcional: adaptalo a tu lógica)
            try:
                nuevo_vinculo = 0 if vinculo_raw in ["funcionario", "0", "funcionario/a", "f"] else 1
            except:
                nuevo_vinculo = 1

            # 1) DATOS BASICOS: insertar si no existe, o actualizar datos de contacto si ya existe
            cursor.execute("SELECT 1 FROM datos_basicos WHERE cedula = %s", (cedula,))
            if not cursor.fetchone():
                hashed_password = hashlib.sha256(cedula.encode()).hexdigest()
                cursor.execute("""INSERT INTO datos_basicos (cedula, nombre, correo, telefono, contrasena, rol)
                                  VALUES (%s, %s, %s, %s, %s, %s)""",
                               (cedula, nombre, correo, telefono, hashed_password, "instructor"))
            else:
                # Actualizamos correo/telefono/nombre por si vienen nuevos
                cursor.execute("""UPDATE datos_basicos SET nombre=%s, correo=%s, telefono=%s
                                  WHERE cedula=%s""", (nombre, correo, telefono, cedula))

            # 2) VINCULADOS: insertar si no existe (usamos codigo_centro_default si no viene)
            cursor.execute("SELECT 1 FROM vinculados WHERE cedula = %s", (cedula,))
            if not cursor.fetchone():
                cursor.execute("INSERT INTO vinculados (cedula, codigo_centro, estado) VALUES (%s, %s, %s)",
                               (cedula, codigo_centro_default, 1))

            # 3) INSTRUCTORES: insertar si no existe, o actualizar vinculo si existe
            cursor.execute("SELECT id_instructor FROM instructores WHERE cedula = %s", (cedula,))
            row = cursor.fetchone()
            if row:
                id_instructor = row[0]
                # Actualizar vinculo si cambió
                cursor.execute("UPDATE instructores SET vinculo = %s WHERE id_instructor = %s", (nuevo_vinculo, id_instructor))
            else:
                cursor.execute("INSERT INTO instructores (cedula, vinculo) VALUES (%s, %s)", (cedula, nuevo_vinculo))
                id_instructor = cursor.lastrowid
                if not id_instructor:
                    cursor.execute("SELECT id_instructor FROM instructores WHERE cedula = %s", (cedula,))
                    row2 = cursor.fetchone()
                    id_instructor = row2[0] if row2 else None

            # 4) PERFILES: perfil_text puede contener múltiples perfiles separados por , o ;
            if perfil_text and id_instructor:
                # separar por comas o punto y coma
                nombres_perfiles = [p.strip() for p in re.split(r'[;,]', perfil_text) if p.strip()]
                for perfil_nombre in nombres_perfiles:
                    # buscar perfil por nombre (case-insensitive)
                    cursor.execute("SELECT id_perfil FROM perfiles WHERE LOWER(nombre) = LOWER(%s)", (perfil_nombre,))
                    r = cursor.fetchone()
                    if r:
                        id_perfil = r[0]
                    else:
                        # si no existe, crear el perfil nuevo y obtener su id
                        cursor.execute("INSERT INTO perfiles (nombre) VALUES (%s)", (perfil_nombre,))
                        id_perfil = cursor.lastrowid
                        if not id_perfil:
                            cursor.execute("SELECT id_perfil FROM perfiles WHERE nombre = %s", (perfil_nombre,))
                            rr = cursor.fetchone()
                            id_perfil = rr[0] if rr else None

                    # Asociar en perfil_instructor si no existe
                    if id_perfil:
                        cursor.execute("SELECT 1 FROM perfil_instructor WHERE id_instructor = %s AND id_perfil = %s",
                                       (id_instructor, id_perfil))
                        if not cursor.fetchone():
                            cursor.execute("INSERT INTO perfil_instructor (id_instructor, id_perfil) VALUES (%s, %s)",
                                           (id_instructor, id_perfil))

        mysql.connection.commit()
        cursor.close()
        flash("Instructores procesados e insertados/actualizados correctamente.", "success")
        return redirect(url_for('upload_excel.registrar_instructor'))  # o a la vista que prefieras

    except Exception as e:
        # rollback por seguridad
        try:
            mysql.connection.rollback()
        except:
            pass
        print("Error en insert_instructors:", e)
        return jsonify({"error": str(e)}), 500


@upload_excel_bp.route('/registrar_instructor', methods=['GET', 'POST'])
@login_required
def registrar_instructor():
    try:
        cursor = mysql.connection.cursor()
        user_cedula = session.get('cedula')
        if not user_cedula:
            return jsonify({"error": "No se encontró la cédula del usuario"}), 400

        cursor.execute("SELECT codigo_centro FROM vinculados WHERE cedula = %s", (user_cedula,))
        usuario_centro = cursor.fetchone()
        session['codigo_centro'] = usuario_centro[0] if usuario_centro and usuario_centro[0] else None

        codigo_usuario = session.get("codigo_centro")
        cursor.execute("SELECT codigo, nombre FROM centros WHERE codigo=%s", (codigo_usuario,))
        nombre_centro_usuario = cursor.fetchone()
        
        cursor.execute("SELECT * FROM perfiles")
        perfiles = cursor.fetchall()
        
        cursor.execute("SELECT codigo, nombre FROM centros")
        centros = {centro[0]: centro[1] for centro in cursor.fetchall()}
        
        # Seleccionar instructores únicos agrupados por cédula
        cursor.execute("SELECT cedula, MIN(vinculo) as vinculo, MIN(id_perfil) as id_perfil FROM instructores GROUP BY cedula")
        instructores = cursor.fetchall()
        
        datos_instructores = []
        for instructor in instructores:
            cedula = instructor[0]
            cursor.execute("SELECT estado, codigo_centro FROM vinculados WHERE cedula = %s", (cedula,))
            vinculacion = cursor.fetchone()
            estado_vinculacion = vinculacion[0] if vinculacion else None
            codigo_centro = vinculacion[1] if vinculacion else None
            
            cursor.execute("SELECT nombre FROM datos_basicos WHERE cedula = %s", (cedula,))
            nombre_instru = cursor.fetchone()
            nombre_instr = nombre_instru[0] if nombre_instru else "Nombre no disponible"
            
            if estado_vinculacion == 0:
                nombre_centro = "Sin centro Vinculado"
            else:
                nombre_centro = centros.get(codigo_centro, "Centro no encontrado")
            
            datos_instructores.append([cedula, nombre_instr, codigo_centro, nombre_centro, estado_vinculacion])
        
        cursor.close()
        
        return render_template("INSTRUCTORESFULL.html",
                               centros=centros,
                               perfiles=perfiles,
                               datos_instructores=datos_instructores,
                               codigo_centro_usuario=session.get('codigo_centro'),
                               nombre_centro_usuario=nombre_centro_usuario)
    except Exception as e:
        return jsonify({"error": f"Error al obtener datos: {str(e)}"}),500
