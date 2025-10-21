from flask import Blueprint, render_template, request, session
from flask_mysqldb import MySQL

registrar_sedes_bp = Blueprint('registrar_sedes', __name__)
mysql = MySQL()

@registrar_sedes_bp.route("/registrar_sedes", methods=['GET', 'POST'])
def registrar_sedes():
    try:
        user = session.get('user')
        if not user or len(user) < 1:
            return render_template("login.html", mensaje="Inicia sesión para registrar sedes.")

        cedula = user[0]
        with mysql.connection.cursor() as cursor:
            # Obtener datos del usuario vinculado
            cursor.execute('SELECT * FROM vinculados WHERE cedula = %s', (cedula,))
            datos = cursor.fetchone()
            if not datos:
                return render_template("login.html", mensaje="No se encontró sesión válida.")

            codigo_centro = datos[2]
            # Obtener el nombre del centro
            cursor.execute('SELECT * FROM centros WHERE codigo = %s', (codigo_centro,))
            nombre_centro = cursor.fetchone()
            if not nombre_centro:
                return render_template("error.html", mensaje="No se encontró el centro asociado.")

            # Verificar si ya hay una sede principal en BD
            cursor.execute(
                'SELECT COUNT(*) FROM sedes WHERE codigo_centro = %s AND sede_principal = 1',
                (codigo_centro,)
            )
            existe_principal = bool(cursor.fetchone()[0])

            if request.method == 'POST':
                nombre = request.form.get('nombre', '').strip()
                municipio = request.form.get('municipio', '').strip()
                horas = request.form.get('horas')
                sede_principal = 1 if request.form.get('sedePrincipal') else 0

                # Validaciones
                if not nombre:
                    return render_template("registroSede.html", mensaje="El nombre de la sede no puede estar vacío.", nombre_centro=nombre_centro[1], existe_principal=existe_principal)
                if not municipio:
                    return render_template("registroSede.html", mensaje="Por favor, selecciona un municipio.", nombre_centro=nombre_centro[1], existe_principal=existe_principal)

                # Verificar nombre duplicado en BD para este centro
                cursor.execute(
                    'SELECT COUNT(*) FROM sedes WHERE codigo_centro = %s AND nombre = %s',
                    (codigo_centro, nombre)
                )
                if cursor.fetchone()[0] > 0:
                    return render_template("registroSede.html", mensaje="Ya existe una sede con ese nombre.", nombre_centro=nombre_centro[1], existe_principal=existe_principal)

                # Si se marca como principal, quitar la anterior
                if sede_principal == 1 and existe_principal:
                    cursor.execute(
                        'UPDATE sedes SET sede_principal = 0 WHERE codigo_centro = %s AND sede_principal = 1',
                        (codigo_centro,)
                    )

                # Insertar la nueva sede
                cursor.execute(
                    'INSERT INTO sedes (nombre, municipio, codigo_centro, sede_principal,horas_distancias) VALUES (%s, %s, %s, %s,%s)',
                    (nombre, municipio, codigo_centro, sede_principal,horas)
                )
                mysql.connection.commit()

                # Si se acaba de crear principal, actualizar flag
                if sede_principal == 1:
                    existe_principal = True

                return render_template("registroSede.html", mensaje="Sede registrada exitosamente.", nombre_centro=nombre_centro[1], existe_principal=existe_principal)

        # GET: mostrar formulario
        return render_template("registroSede.html", nombre_centro=nombre_centro[1], existe_principal=existe_principal)

    except Exception as e:
        mysql.connection.rollback()
        return render_template("registroSede.html", mensaje=f"Error al registrar la sede: {str(e)}", nombre_centro=(nombre_centro[1] if 'nombre_centro' in locals() else ''), existe_principal=(existe_principal if 'existe_principal' in locals() else False))