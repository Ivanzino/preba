from flask import Blueprint, Flask, jsonify, make_response, render_template, request, redirect, url_for, flash, session
import datetime
from flask_mysqldb import MySQL
import mysql.connector

# Crear el Blueprint
trimestresAño_bp = Blueprint('trimestresAño', __name__)

mysql = MySQL()

def obtener_calendarios_academicos_db(cursor):
    """
    Obtiene los calendarios académicos desde la base de datos
    Retorna un diccionario con la misma estructura que antes tenía CALENDARIOS_ACADEMICOS
    """
    cursor.execute("""
        SELECT fecha_inicio, fecha_fin, trimestre_año 
        FROM trimestres 
        ORDER BY fecha_inicio
    """)
    
    resultados = cursor.fetchall()
    calendarios = {}
    
    for resultado in resultados:
        fecha_inicio = resultado[0].strftime('%Y-%m-%d') if resultado[0] else None
        fecha_fin = resultado[1].strftime('%Y-%m-%d') if resultado[1] else None
        trimestre_año = resultado[2]
        
        if fecha_inicio and fecha_fin:
            # Extraer el año de la fecha de inicio
            año = datetime.datetime.strptime(fecha_inicio, '%Y-%m-%d').year
            
            if año not in calendarios:
                calendarios[año] = {}
            
            calendarios[año][trimestre_año] = {
                'inicio': fecha_inicio,
                'fin': fecha_fin
            }
    
    return calendarios

def verificar_trimestre_año_existe(cursor, año, trimestre_año):
    """
    Verifica si ya existe un trimestre específico de un año en la tabla trimestres
    """
    cursor.execute("""
        SELECT COUNT(*) 
        FROM trimestres 
        WHERE YEAR(fecha_inicio) = %s AND trimestre_año = %s
    """, (año, trimestre_año))
    
    resultado = cursor.fetchone()
    return resultado[0] > 0

def insertar_trimestre_año(cursor, fecha_inicio, fecha_fin, trimestre_año):
    """
    Inserta un nuevo trimestre del año en la tabla trimestres
    """
    cursor.execute("""
        INSERT INTO trimestres (fecha_inicio, fecha_fin, trimestre_año) 
        VALUES (%s, %s, %s)
    """, (fecha_inicio, fecha_fin, trimestre_año))

def obtener_ultimo_trimestre_ficha(numero_ficha, cursor):
    """
    Obtiene el último trimestre registrado de una ficha específica
    """
    cursor.execute("""
        SELECT id_trimestre 
        FROM trimetres_ano 
        WHERE numero_ficha = %s 
        ORDER BY id_trimestre DESC 
        LIMIT 1
    """, (numero_ficha,))
    
    resultado = cursor.fetchone()
    if resultado:
        # Extraer el último número del id_trimestre (formato: secuencia_año_trimestre)
        partes = resultado[0].split('_')
        if len(partes) >= 3:
            try:
                return int(partes[-1])  # Último trimestre de la ficha
            except ValueError:
                return 0
    return 0

def validar_fecha_permitida(fecha_inicio):
    """
    Valida que la fecha de inicio sea igual o posterior a la fecha actual
    """
    fecha_actual = datetime.date.today()
    fecha_ingresada = datetime.datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
    
    return fecha_ingresada >= fecha_actual

def calcular_trimestre_ficha_simplificado(fecha_inicio_ficha, cant_trimestres, numero_ficha, cursor):
    """
    Calcula en qué trimestre de la ficha debería estar basado en:
    - La fecha de inicio de la ficha
    - La cantidad de trimestres del programa  
    - Los trimestres existentes en la tabla trimestres
    - Los registros existentes en trimetres_ano para esta ficha
    """
    try:
        fecha_inicio_ficha_obj = datetime.datetime.strptime(fecha_inicio_ficha, '%Y-%m-%d')
        
        print(f"DEBUG: Calculando trimestre para ficha {numero_ficha} que empezó {fecha_inicio_ficha}")
        
        # Verificar el último trimestre registrado de esta ficha
        ultimo_trimestre_registrado = obtener_ultimo_trimestre_ficha(numero_ficha, cursor)
        
        print(f"DEBUG: Último trimestre registrado para ficha {numero_ficha}: {ultimo_trimestre_registrado}")
        
        # Si ya tiene registros, el siguiente trimestre es ultimo + 1
        if ultimo_trimestre_registrado > 0:
            siguiente_trimestre = ultimo_trimestre_registrado + 1
            
            # Verificar que no exceda la cantidad máxima de trimestres
            if siguiente_trimestre > cant_trimestres:
                print(f"DEBUG: Ficha {numero_ficha} ya completó todos sus {cant_trimestres} trimestres")
                return None  # No se debe crear más trimestres
            
            print(f"DEBUG: Ficha {numero_ficha} continuará en trimestre {siguiente_trimestre}")
            return siguiente_trimestre
        
        # Si no tiene registros, calcular basado en los trimestres académicos existentes
        # Contar cuántos trimestres han pasado desde que empezó la ficha
        cursor.execute("""
            SELECT COUNT(*) 
            FROM trimestres 
            WHERE fecha_inicio >= %s
            ORDER BY fecha_inicio
        """, (fecha_inicio_ficha,))
        
        resultado = cursor.fetchone()
        trimestres_disponibles = resultado[0] if resultado else 0
        
        print(f"DEBUG: Trimestres académicos disponibles desde {fecha_inicio_ficha}: {trimestres_disponibles}")
        
        # El trimestre de la ficha será el número de trimestres académicos disponibles
        # Si no hay trimestres disponibles, está en el primero
        trimestre_ficha_actual = max(1, trimestres_disponibles)
        
        # Verificar que no exceda la cantidad máxima de trimestres del programa
        if trimestre_ficha_actual > cant_trimestres:
            print(f"DEBUG: Ficha {numero_ficha} ya debería haber completado el programa (trimestre {trimestre_ficha_actual} > {cant_trimestres})")
            return None
        
        print(f"DEBUG: RESULTADO -> Ficha {numero_ficha} está en trimestre {trimestre_ficha_actual} de {cant_trimestres}")
        print("="*50)
            
        return int(trimestre_ficha_actual)
        
    except Exception as e:
        print(f"Error calculando trimestre para ficha {numero_ficha} con fecha inicio {fecha_inicio_ficha}: {e}")
        return 1

@trimestresAño_bp.route("/trimestresAño")
def traertrimestresAño():
    return render_template("trimestresAño.html")

@trimestresAño_bp.route('/trimestresAño', methods=['POST'])
def trimestresAño():
    # Datos del formulario principal
    trimestre_año = int(request.form.get('trimestres'))
    fechaInicio = request.form.get('fechaInicio')
    fechaFin = request.form.get('fechaFin')
    
    # Verificar que se hayan enviado ambas fechas
    if not fechaInicio or not fechaFin:
        flash("Las fechas son obligatorias.")
        return redirect(url_for('trimestresAño.traertrimestresAño'))
    
    # Validar que la fecha sea actual o futura
    if not validar_fecha_permitida(fechaInicio):
        flash("Solo se pueden crear trimestres con fechas actuales o futuras.")
        return redirect(url_for('trimestresAño.traertrimestresAño'))
    
    # Convertir la fecha para extraer el año
    try:
        fecha_inicio_obj = datetime.datetime.strptime(fechaInicio, '%Y-%m-%d')
    except ValueError:
        flash("Formato de fecha inválido.")
        return redirect(url_for('trimestresAño.traertrimestresAño'))
    
    year_input = fecha_inicio_obj.year
    
    cursor = mysql.connection.cursor()
    
    # Verificar si ya existe este trimestre del año en la tabla trimestres
    if verificar_trimestre_año_existe(cursor, year_input, trimestre_año):
        flash(f"Ya existe el trimestre {trimestre_año} del año {year_input}. No se puede crear nuevamente.")
        return redirect(url_for('trimestresAño.traertrimestresAño'))
    
    # --- Verificar duplicados considerando el trimestre del año ---
    pattern = f"%_{year_input}_{trimestre_año}"
    cursor.execute("SELECT numero_ficha FROM trimetres_ano WHERE id_trimestre LIKE %s", (pattern,))
    duplicates = cursor.fetchall()
    
    if duplicates:
        duplicate_fichas = ", ".join([str(row[0]) for row in duplicates])
        return render_template("trimestresAño.html", 
                               duplicate_alert=True,
                               trimestre=trimestre_año,
                               duplicate_fichas=duplicate_fichas,
                               fechaInicio=fechaInicio,
                               fechaFin=fechaFin)
    
    # Insertar el nuevo trimestre del año en la tabla trimestres
    # (Se hace DESPUÉS de verificar duplicados pero ANTES de calcular trimestres de fichas)
    try:
        insertar_trimestre_año(cursor, fechaInicio, fechaFin, trimestre_año)
        mysql.connection.commit()
        print(f"DEBUG: Insertado trimestre {trimestre_año} del año {year_input} en tabla trimestres")
    except Exception as e:
        mysql.connection.rollback()
        flash(f"Error al crear el trimestre del año: {e}")
        return redirect(url_for('trimestresAño.traertrimestresAño'))
    
    # --- Insertar para fichas con oferta 0 ---
    query_oferta0 = """
        SELECT f.numero_ficha, f.fecha_inicio_lectiva, f.fecha_fin_lectiva, p.cant_trimestres 
        FROM fichas f 
        INNER JOIN programas p ON f.programa = p.id_Prog 
        WHERE f.oferta = 0
    """
    cursor.execute(query_oferta0)
    fichas0 = cursor.fetchall()
    
    secuencia = 1
    fichas_procesadas_oferta0 = []
    
    for ficha in fichas0:
        numero_ficha = ficha[0]
        fecha_inicio_ficha = ficha[1].strftime('%Y-%m-%d') if ficha[1] else None
        fecha_fin_ficha = ficha[2].strftime('%Y-%m-%d') if ficha[2] else None
        cant_trimestres = ficha[3] or 4
        
        # Solo procesar si tiene fecha de inicio lectiva
        if fecha_inicio_ficha:
            # Calcular el trimestre real de esta ficha usando la función simplificada
            trimestre_real_ficha = calcular_trimestre_ficha_simplificado(
                fecha_inicio_ficha, cant_trimestres, numero_ficha, cursor
            )
            
            # Solo insertar si el trimestre es válido (no None)
            if trimestre_real_ficha is not None:
                # Crear ID con el trimestre real de la ficha
                id_trimestre = f"{secuencia}_{year_input}_{trimestre_real_ficha}"
                
                cursor.execute(
                    "INSERT INTO trimetres_ano (id_trimestre, fecha_inicio, fecha_fin, numero_ficha) VALUES (%s, %s, %s, %s)",
                    (id_trimestre, fechaInicio, fechaFin, numero_ficha)
                )
                
                fichas_procesadas_oferta0.append({
                    'numero_ficha': numero_ficha,
                    'trimestre_real': trimestre_real_ficha,
                    'id_trimestre': id_trimestre
                })
                
                print(f"Ficha {numero_ficha}: Inicio lectivo {fecha_inicio_ficha} -> Trimestre {trimestre_real_ficha}")
            else:
                print(f"Ficha {numero_ficha}: Ya completó todos sus trimestres, se omite")
        else:
            print(f"Ficha {numero_ficha}: Sin fecha de inicio lectiva, se omite")
        
        secuencia += 1
    
    mysql.connection.commit()
    
    # --- Consultar fichas con oferta 1 ---
    query_oferta1 = """
        SELECT f.numero_ficha, p.nombre AS nombre_programa, f.jornada, 
               f.fecha_inicio_lectiva, f.fecha_fin_lectiva, p.cant_trimestres
        FROM fichas f 
        INNER JOIN programas p ON f.programa = p.id_Prog 
        WHERE f.oferta = 1
    """
    cursor.execute(query_oferta1)
    fichas1 = cursor.fetchall()
    
    if fichas1:
        # Procesar fichas1 para incluir el trimestre calculado
        fichas_procesadas = []
        for ficha in fichas1:
            numero_ficha = ficha[0]
            nombre_programa = ficha[1]
            jornada = ficha[2]
            fecha_inicio_ficha = ficha[3].strftime('%Y-%m-%d') if ficha[3] else None
            fecha_fin_ficha = ficha[4].strftime('%Y-%m-%d') if ficha[4] else None
            cant_trimestres = ficha[5] or 4
            
            # Solo procesar si tiene fecha de inicio lectiva
            if fecha_inicio_ficha:
                # Calcular trimestre real usando la función simplificada
                trimestre_real_ficha = calcular_trimestre_ficha_simplificado(
                    fecha_inicio_ficha, cant_trimestres, numero_ficha, cursor
                )
                
                # Solo agregar si el trimestre es válido
                if trimestre_real_ficha is not None:
                    fichas_procesadas.append({
                        'numero_ficha': numero_ficha,
                        'nombre_programa': nombre_programa,
                        'jornada': jornada,
                        'trimestre_real': trimestre_real_ficha,
                        'fecha_inicio_ficha': fecha_inicio_ficha,
                        'fecha_fin_ficha': fecha_fin_ficha,
                        'cant_trimestres': cant_trimestres
                    })
                    print(f"Ficha {numero_ficha}: Inicio lectivo {fecha_inicio_ficha} -> Trimestre {trimestre_real_ficha}")
                else:
                    print(f"Ficha {numero_ficha}: Ya completó todos sus trimestres, se omite del modal")
            else:
                print(f"Ficha {numero_ficha}: Sin fecha de inicio lectiva, se omite del modal")
        
        if fichas_procesadas:
            return render_template("trimestresAño.html", 
                                   show_modal=True, 
                                   secuencia=secuencia,
                                   current_year=year_input, 
                                   trimestre_año=trimestre_año,
                                   fichas_procesadas=fichas_procesadas,
                                   fechaInicio=fechaInicio,
                                   fechaFin=fechaFin)
        else:
            flash("Se han insertado los registros para fichas en oferta 0. Las fichas de oferta 1 ya completaron sus trimestres.")
            return redirect(url_for('trimestresAño.traertrimestresAño'))
    else:
        mensaje = "Se han insertado los registros para fichas en oferta 0. No se encontraron fichas en oferta 1."
        if fichas_procesadas_oferta0:
            mensaje += f" Se procesaron {len(fichas_procesadas_oferta0)} fichas."
        flash(mensaje)
        return redirect(url_for('trimestresAño.traertrimestresAño'))
@trimestresAño_bp.route('/confirmarTrimestres', methods=['POST'])
def confirmarTrimestres():
    # Recibir datos del modal para fichas en oferta 1
    id_trimestres = request.form.getlist('id_trimestre[]')
    numeros_ficha = request.form.getlist('numero_ficha[]')
    fechas_inicio = request.form.getlist('fecha_inicio[]')
    fechas_fin = request.form.getlist('fecha_fin[]')
    
    cursor = mysql.connection.cursor()
    fichas_insertadas = 0
    
    for i, id_tri in enumerate(id_trimestres):
        fi = fechas_inicio[i]
        ff = fechas_fin[i]
        
        if not fi or not ff:
            flash("No se han enviado las fechas correctamente en alguna ficha.")
            return redirect(url_for('trimestresAño.traertrimestresAño'))
        
        # Validar que las fechas sean actuales o futuras
        if not validar_fecha_permitida(fi):
            flash(f"La fecha de inicio para la ficha {numeros_ficha[i]} debe ser actual o futura.")
            return redirect(url_for('trimestresAño.traertrimestresAño'))
            
        cursor.execute(
            "INSERT INTO trimetres_ano (id_trimestre, fecha_inicio, fecha_fin, numero_ficha) VALUES (%s, %s, %s, %s)",
            (id_tri, fi, ff, numeros_ficha[i])
        )
        fichas_insertadas += 1
    
    mysql.connection.commit()
    flash(f"Se han insertado {fichas_insertadas} registros para fichas en oferta 1.")
    return redirect(url_for('trimestresAño.traertrimestresAño'))

@trimestresAño_bp.route('/check_duplicates', methods=['GET'])
def check_duplicates():
    # Endpoint para verificar duplicados vía AJAX
    trimestre = request.args.get('trimestre')
    fechaInicio = request.args.get('fechaInicio')
    
    if not trimestre or not fechaInicio:
        return jsonify({'error': 'Faltan parámetros'}), 400
    
    # Validar fecha permitida
    if not validar_fecha_permitida(fechaInicio):
        return jsonify({
            'error': True,
            'message': 'Solo se pueden crear trimestres con fechas actuales o futuras.'
        }), 400
    
    try:
        fecha_inicio_obj = datetime.datetime.strptime(fechaInicio, '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Formato de fecha inválido'}), 400
    
    year_input = fecha_inicio_obj.year
    cursor = mysql.connection.cursor()
    
    # Verificar si ya existe este trimestre del año
    if verificar_trimestre_año_existe(cursor, year_input, int(trimestre)):
        return jsonify({
            'error': True,
            'message': f'Ya existe el trimestre {trimestre} del año {year_input}. No se puede crear nuevamente.'
        })
    
    # Verificar duplicados para el trimestre del año específico
    pattern = f"%_{year_input}_{trimestre}"
    cursor.execute("SELECT numero_ficha FROM trimetres_ano WHERE id_trimestre LIKE %s", (pattern,))
    duplicates = cursor.fetchall()
    
    if duplicates:
        duplicate_fichas = ", ".join([str(row[0]) for row in duplicates])
        return jsonify({
            'duplicate': True,
            'trimestre': trimestre,
            'duplicate_fichas': duplicate_fichas
        })
    else:
        return jsonify({'duplicate': False})