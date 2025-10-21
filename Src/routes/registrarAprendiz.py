from flask import Blueprint, render_template, request, jsonify
import pandas as pd
import unicodedata
from flask_mysqldb import MySQL

# Crear blueprint
registrarAprendiz_bp = Blueprint('registrarAprendiz', __name__)
mysql = MySQL()  # Este debe inicializarse en tu archivo app principal

# Vista principal
@registrarAprendiz_bp.route("/registrarAprendiz", methods=['GET'])
def registrarAprendiz():
    return render_template('registrarAprendiz.html')

# join(...) if unicodedata.category(c) != 'Mn' (elimina marca no espaciadora), que son las tildes y acentos.
# unicodedata.normalize('NFD', col) separa letras por letra 
# Función para limpiar tildes, mayúsculas y espacios
def limpiar_columna(col):
    col = col.strip().lower()
    col = ''.join((c for c in unicodedata.normalize('NFD', col) if unicodedata.category(c) != 'Mn'))
    return col

# Procesar archivo Excel
@registrarAprendiz_bp.route("/subir_excel_ajax", methods=['POST'])
def subir_excel_ajax():
    file = request.files.get('excel_file')
    if not file:
        return jsonify({"status": "error", "message": "No se recibió ningún archivo."})

    try:
        # Leer número de ficha desde celda C3
        df_ficha = pd.read_excel(file, header=None)
        id_ficha_raw = df_ficha.iloc[2, 2]  # C3
        id_ficha = int(float(id_ficha_raw))  # Por si viene como 255846.0

        # Verificar si la ficha existe antes de continuar
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM fichas WHERE numero_ficha = %s", (id_ficha,))
        ficha_existe = cursor.fetchone()[0]

        if ficha_existe == 0:
            cursor.close()
            return jsonify({
                "status": "error",
                "message": f"La ficha {id_ficha} no existe. Verifica el archivo Excel o registra la ficha primero."
            })

        # Leer aprendices desde la fila 13
        df = pd.read_excel(file, header=12)

        # Limpiar nombres de columnas
        print("Columnas originales:", list(df.columns))
        df.columns = [limpiar_columna(col) for col in df.columns]
        print("Columnas limpias:", list(df.columns))

        # Mapeo de columnas necesarias
        col_map = {
            'numero de documento': 'numero_documento',
            'nombre': 'nombre',
            'apellidos': 'apellidos',
            'estado': 'estado'
        }

        # Verificar columnas requeridas
        for col in col_map.keys():
            if col not in df.columns:
                return jsonify({"status": "error", "message": f"Columna faltante: '{col}'"})

        # Renombrar columnas
        df = df.rename(columns=col_map)

        # Filtrar aprendices en formación
        df_filtrado = df[df['estado'].str.strip().str.upper() == 'EN FORMACION']

        registros_insertados = 0
        matriculas_insertadas = 0

        for _, row in df_filtrado.iterrows():
            numero_documento = row['numero_documento']
            nombre_aprendiz = row['nombre']
            apellidos_aprendiz = row['apellidos']

            # Insertar aprendiz si no existe
            cursor.execute("SELECT COUNT(*) FROM aprendices WHERE id_aprendiz = %s", (numero_documento,))
            existe = cursor.fetchone()[0]

            if existe == 0:
                cursor.execute("""
                    INSERT INTO aprendices (id_aprendiz, nombres, apellidos)
                    VALUES (%s, %s, %s)
                """, (numero_documento, nombre_aprendiz, apellidos_aprendiz))
                registros_insertados += 1

            # Insertar en tabla matriculas si no existe
            cursor.execute("""
                SELECT COUNT(*) FROM matriculas WHERE id_aprendiz = %s AND id_ficha = %s
            """, (numero_documento, id_ficha))
            existe_matricula = cursor.fetchone()[0]

            if existe_matricula == 0:
                cursor.execute("""
                    INSERT INTO matriculas (id_aprendiz, id_ficha)
                    VALUES (%s, %s)
                """, (numero_documento, id_ficha))
                matriculas_insertadas += 1

        mysql.connection.commit()
        cursor.close()

        return jsonify({
            "status": "success",
            "message": f"{registros_insertados} aprendices registrados para la ficha {id_ficha}."
        })

    except Exception as e:
        return jsonify({"status": "error", "message": f"Error: {str(e)}"})

