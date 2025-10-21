from flask import Blueprint
from flask import Flask, jsonify, make_response, render_template, request, redirect, url_for, flash, session
import pandas as pd
import hashlib
import os
from collections import defaultdict
from datetime import datetime, timedelta
from flask_mysqldb import MySQL
import mysql.connector
import re

# Crear el Blueprint
upload_bp = Blueprint('upload', __name__)

# Inicializar MySQL (esto se puede mover a app.py si es necesario)
mysql = MySQL()

@upload_bp.route('/upload', methods=['POST'])
def upload_file():
    # Verifica si se subió un archivo
    if 'archivo' not in request.files:
        print("No se encontró el archivo en la solicitud.")
        return jsonify({"error": "No se encontró el archivo"}), 400

    file = request.files['archivo']
    cursor = None

    try:
        # Leer el archivo Excel
        print("Leyendo el archivo Excel...")
        df = pd.read_excel(file, header=None, engine='xlrd')
        print("Archivo Excel leído con éxito.")
        
        # Obtener datos principales
        numero_ficha = df.iloc[2, 2]  # Fila 3, columna 3
        codigo_programa = df.iloc[3, 2]  # Fila 4, Columna 3
        nombre_programa = df.iloc[5, 2]  # Fila 6, Columna 3
        modalidad = df.iloc[9, 2] # Fila 10, columna 3
        fecha_inicio = df.iloc[7, 2]
        fecha_fin = df.iloc[8, 2] # Fila 9, columna 3
        
        print(f"Numero Ficha: {numero_ficha}, Codigo Programa: {codigo_programa}, Nombre Programa: {nombre_programa}, Modalidad: {modalidad}, fecha_fin: {fecha_fin}")
        
        if pd.isna(numero_ficha):
            print("Falta Numero de Ficha")
            return jsonify({"error": "Falta Numero de Ficha"}), 400
        if pd.isna(codigo_programa) or pd.isna(nombre_programa):
            print("Faltan datos importantes para el programa")
            return jsonify({"error": "Faltan datos importantes para el programa"}), 400
        
        # Validar si la modalidad es 'presencial'
        if modalidad.lower() != 'presencial':
            print(f"La modalidad debe ser 'presencial', pero se encontró '{modalidad}'.")
            return jsonify({"error": "La modalidad debe ser 'presencial'"}), 400
        
        # Validar la fecha de finalización
        if pd.isna(fecha_fin):
            print("Falta la fecha de finalización.")
            return jsonify({"error": "Falta la fecha de finalización"}), 400
        
        fecha_fin = pd.to_datetime(fecha_fin)  # Asegurarse que la fecha es un objeto datetime
        fecha_actual = datetime.now()

        # Restar 180 días a la fecha de finalización
        fecha_limite = fecha_fin - timedelta(days=180)

        # Validar que la fecha de finalización no sea menor a la fecha actual
        if fecha_limite < fecha_actual:
            print(f"La fecha de finalización es menor a 180 días atrás desde la fecha actual.")
            return jsonify({"error": "La fecha de finalización no puede ser menor a 180 días atrás de la fecha actual."}), 400
        

        # Validar si el número de ficha ya existe en la base de datos
        print("Validando si el número de ficha ya existe en la base de datos...")
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM fichas WHERE numero_ficha = %s", (numero_ficha,))
        if cursor.fetchone()[0] > 0:
            print("El número de ficha ya existe en la base de datos.")
            return jsonify({"error": "El número de ficha ya existe"}), 400

        # Validar si el programa ya existe, si existe hacer un UPDATE
        print("Verificando si el programa ya existe...")
        cursor.execute("SELECT id_prog FROM programas WHERE id_prog = %s", (codigo_programa,))
        existing_program = cursor.fetchone()
        if existing_program:
            # Si el programa ya existe, se hace un UPDATE
            print(f"El programa {codigo_programa} ya existe. Realizando UPDATE...")
            cursor.execute("""UPDATE programas SET nombre = %s WHERE id_prog = %s""", (nombre_programa, codigo_programa))
        else:
            # Si el programa no existe, se hace un INSERT
            print(f"El programa {codigo_programa} no existe. Realizando INSERT...")
            cursor.execute("""INSERT INTO programas (id_prog, nombre) VALUES (%s, %s)""", (codigo_programa, nombre_programa))

        mysql.connection.commit()

        # Procesar competencias y resultados
        print("Procesando competencias y resultados...")
        df = df.iloc[13:]
        asociaciones = defaultdict(lambda: {"nombre": "", "codigo": "", "resultados": []})

        for competencia_completa, resultado_completo in zip(df[5], df[6]):
            if isinstance(competencia_completa, str) and " - " in competencia_completa:
                codigo_competencia, nombre_competencia = competencia_completa.split(" - ", 1)
                asociaciones[codigo_competencia]["nombre"] = nombre_competencia.strip()
                asociaciones[codigo_competencia]["codigo"] = codigo_competencia.strip()

            if isinstance(resultado_completo, str) and " - " in resultado_completo:
                codigo_resultado, nombre_resultado = resultado_completo.split(" - ", 1)
                if nombre_resultado not in [res['nombre_resultado'] for res in asociaciones[codigo_competencia]["resultados"]]:
                    asociaciones[codigo_competencia]["resultados"].append({
                        "codigo_resultado": codigo_resultado.strip(),
                        "nombre_resultado": nombre_resultado.strip()
                    })

        print(f"Datos procesados: {len(asociaciones)} competencias encontradas.")

        # Función para limpiar texto de números para comparación
        def limpiar_texto(texto):
            return re.sub(r'\d+', '', texto).strip()

        # Insertar competencias y resultados, y copiar asociaciones de instructores
        for codigo_competencia, datos in asociaciones.items():
            nombre_competencia = datos['nombre']
            codigo_competencia = datos['codigo']

            if pd.isna(codigo_competencia) or pd.isna(nombre_competencia):
                continue

            print(f"Procesando competencia: {codigo_competencia} - {nombre_competencia}")
            cursor.execute("""SELECT id_comp FROM competencias WHERE nombre = %s AND id_prog = %s""", (nombre_competencia, codigo_programa))
            competencia_existente = cursor.fetchone()

            if competencia_existente:
                id_comp = competencia_existente[0]
                print(f"Competencia {nombre_competencia} ya existe, ID: {id_comp}")
            else:
                # Buscamos en toda la tabla una fila con el mismo nombre que ya tenga tipo o sigla
                cursor.execute("""
                    SELECT tipo, sigla 
                      FROM competencias 
                     WHERE nombre = %s 
                       AND (tipo IS NOT NULL OR (sigla IS NOT NULL AND sigla <> ''))
                     LIMIT 1
                """, (nombre_competencia,))
                fila = cursor.fetchone()

                if fila:
                    tipo_existente, sigla_existente = fila
                    print(f"Asignando tipo ({tipo_existente}) y sigla ({sigla_existente}) existente " 
                          f"a la nueva competencia: {nombre_competencia}")
                    cursor.execute("""
                        INSERT INTO competencias (nombre, id_prog, tipo, sigla)
                        VALUES (%s, %s, %s, %s)
                    """, (nombre_competencia, codigo_programa, tipo_existente, sigla_existente))
                else:
                    print(f"Ingresando competencia sin tipo/sigla: {nombre_competencia}")
                    cursor.execute("""
                        INSERT INTO competencias (nombre, id_prog)
                        VALUES (%s, %s)
                    """, (nombre_competencia, codigo_programa))

                id_comp = cursor.lastrowid
                print(f"Competencia {nombre_competencia} insertada, ID: {id_comp}")

            # Insertar resultados terminales (RAPs)
            for resultado in datos["resultados"]:
                descripcion_resultado = resultado['nombre_resultado']
                cursor.execute("""SELECT id_raps FROM raps WHERE descripcion = %s AND id_comp = %s""", (descripcion_resultado, id_comp))
                rap_existente = cursor.fetchone()
                
                if rap_existente:
                    id_rap = rap_existente[0]
                    print(f"RAP '{descripcion_resultado}' ya existe, ID: {id_rap}")
                else:
                    print(f"Insertando resultado: {descripcion_resultado}")
                    cursor.execute("""INSERT INTO raps (descripcion, id_comp) VALUES (%s, %s)""", (descripcion_resultado, id_comp))
                    id_rap = cursor.lastrowid
                    print(f"RAP insertado con ID: {id_rap}")
                
                # Copiar todas las asociaciones de instructores para este RAP específico
                # Primero, buscamos competencias con el mismo nombre
                cursor.execute(
                    "SELECT id_comp FROM competencias WHERE nombre = %s AND id_comp != %s", 
                    (nombre_competencia, id_comp)
                )
                old_comp_ids = [row[0] for row in cursor.fetchall()]
                
                # Limpiar la descripción para comparación
                descripcion_limpia = limpiar_texto(descripcion_resultado)
                
                # Variable para rastrear si se han copiado asociaciones específicas
                asociaciones_copiadas = False
                
                for old_comp_id in old_comp_ids:
                    # Buscamos todos los RAPs en la competencia antigua
                    cursor.execute(
                        "SELECT id_raps, descripcion FROM raps WHERE id_comp = %s",
                        (old_comp_id,)
                    )
                    old_raps = cursor.fetchall()
                    
                    for old_rap_id, old_descripcion in old_raps:
                        # Comparamos las descripciones limpiando números
                        if limpiar_texto(old_descripcion) == descripcion_limpia:
                            # Obtenemos las asociaciones de instructores para este RAP específico
                            cursor.execute(
                                "SELECT id_instructor FROM asociaciones WHERE id_comp = %s AND id_raps = %s",
                                (old_comp_id, old_rap_id)
                            )
                            instructores = cursor.fetchall()
                            
                            for (id_inst,) in instructores:
                                # Copiamos la asociación para el nuevo RAP
                                cursor.execute(
                                    "INSERT IGNORE INTO asociaciones (id_comp, id_instructor, id_raps) VALUES (%s, %s, %s)",
                                    (id_comp, id_inst, id_rap)
                                )
                                print(f"Copiada asociación específica: comp={id_comp}, inst={id_inst}, rap={id_rap}")
                                asociaciones_copiadas = True
                
                # Si no se han copiado asociaciones específicas para este RAP, copiamos las asociaciones generales
                if not asociaciones_copiadas:
                    print(f"No se encontraron asociaciones específicas para el RAP {id_rap}, copiando asociaciones generales")
                    for old_comp_id in old_comp_ids:
                        # Obtenemos todos los instructores asociados a la competencia antigua
                        cursor.execute(
                            "SELECT DISTINCT id_instructor FROM asociaciones WHERE id_comp = %s",
                            (old_comp_id,)
                        )
                        instructores = cursor.fetchall()
                        
                        for (id_inst,) in instructores:
                            cursor.execute(
                                "INSERT IGNORE INTO asociaciones (id_comp, id_instructor, id_raps) VALUES (%s, %s, %s)",
                                (id_comp, id_inst, id_rap)
                            )
                            print(f"Copiada asociación general: comp={id_comp}, inst={id_inst}, rap={id_rap}")

        mysql.connection.commit()

        print("Datos procesados correctamente.")
        return jsonify({
            "numero_ficha": numero_ficha,
            "codigo_programa": codigo_programa,
            "nombre_programa": nombre_programa,
            "fecha_inicio_lectiva": fecha_inicio,
            "fecha_fin_lectiva": fecha_limite,
            "modalidad": modalidad,
        })

    except Exception as e:
        if cursor:
            mysql.connection.rollback()
        print(f"Error al procesar los datos: {str(e)}")
        return jsonify({"error": f"Error al procesar los datos: {str(e)}"}), 500

    finally:
        if cursor:
            cursor.close()