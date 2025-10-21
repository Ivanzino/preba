from flask import Blueprint, Flask, jsonify, make_response, render_template, request, redirect, url_for, flash, session
import pandas as pd
import hashlib
import os
from collections import defaultdict
from flask_mysqldb import MySQL
import mysql.connector

# Crear los Blueprints
mostrar_datos_bp = Blueprint('mostrar_datos', __name__)
# guardar_distribucion_bp = Blueprint('guardar_distribucion', __name__)
# eliminar_distribucion_bp = Blueprint('eliminar_distribucion', __name__)

# Inicializar MySQL (esto se puede mover a app.py si es necesario)
mysql = MySQL()

@mostrar_datos_bp.route("/raps")
def raps():
    return render_template("malla.html")


@mostrar_datos_bp.route('/mostrar_datos', methods=['POST'])
def mostrar_datos():
    try:
        data = request.get_json()
        NumeroFicha = data.get('NumeroFicha')

        user = session.get('user')
        if not user or len(user) < 1:
            return jsonify({'success': False, 'message': 'Inicia sesión, Por favor.'}), 401

        cursor = mysql.connection.cursor()

        # Seleccionar modalidad, jornada, programa e intensidad de la ficha
        cursor.execute(
            '''
            SELECT modalidad, jornada, programa, intensidad
            FROM fichas
            WHERE numero_ficha = %s
            ''', (NumeroFicha,)
        )
        ficha_result = cursor.fetchone()
        if not ficha_result:
            return jsonify({'success': False, 'message': 'Número de ficha no encontrado.'}), 404

        modalidad, jornada, id_programa, intensidad = ficha_result

        if modalidad == 0:
            return jsonify({'success': False, 'message': 'Esta funcionalidad solo está disponible para fichas de modalidad presencial.'}), 403

        # Validación de intensidad para jornadas "mañana" o "tarde"
        if jornada.lower() in ['mañana', 'tarde']:
            intensidad = 0
            cursor.execute(
                '''
                UPDATE fichas
                SET intensidad = %s
                WHERE numero_ficha = %s
                ''', (intensidad, NumeroFicha)
            )
            mysql.connection.commit()

        # Lógica de mallas
        # Primero se consulta si hay algún registro en la tabla mallas (globalmente)
        cursor.execute(
            '''
            SELECT id_malla FROM mallas LIMIT 1
            '''
        )
        global_malla = cursor.fetchone()

        if global_malla is None:
            # La tabla mallas está vacía: crear malla para esta ficha (estado 0)
            cursor.execute(
                '''
                INSERT INTO mallas (numero_ficha, estado)
                VALUES (%s, %s)
                ''', (NumeroFicha, 0)
            )
            mysql.connection.commit()
            cursor.execute(
                '''
                SELECT id_malla, numero_ficha, estado
                FROM mallas
                WHERE numero_ficha = %s AND estado = 0
                ''', (NumeroFicha,)
            )
            malla_result = cursor.fetchone()
            malla_existe = True  # Se carga la interfaz directamente
        else:
            # Existen registros en mallas
            # Primero se consulta si la ficha ingresada ya tiene una malla
            cursor.execute(
                '''
                SELECT id_malla, numero_ficha, estado
                FROM mallas
                WHERE numero_ficha = %s
                ''', (NumeroFicha,)
            )
            ficha_mallas = cursor.fetchall()
            if ficha_mallas:
                # La ficha ya tiene malla, se devuelve la primera encontrada
                malla_result = ficha_mallas[0]
                malla_existe = True
            else:
                # La ficha no tiene malla; se obtienen todas las fichas que tengan el mismo valor en la columna "programa"
                cursor.execute(
                    '''
                    SELECT numero_ficha FROM fichas
                    WHERE programa = %s
                    ''', (id_programa,)
                )
                fichas_del_programa = cursor.fetchall()
                if fichas_del_programa:
                    numeros = [ficha[0] for ficha in fichas_del_programa]
                    # Se consulta si existe al menos una malla en estado 1 para alguno de esos números de ficha
                    format_strings = ','.join(['%s'] * len(numeros))
                    cursor.execute(
                        f'''
                        SELECT id_malla, numero_ficha, estado
                        FROM mallas
                        WHERE numero_ficha IN ({format_strings}) AND estado = 1
                        LIMIT 1
                        ''', tuple(numeros)
                    )
                    malla_programa = cursor.fetchone()
                    if malla_programa:
                        # Existe al menos una malla en estado 1 para fichas de este programa:
                        # se sigue el flujo normal (mostrar botones Espejo/Manual).
                        malla_result = None
                        malla_existe = False
                    else:
                        # No existe ninguna malla en estado 1 para fichas de este programa,
                        # se crea la malla para la ficha ingresada de forma automática.
                        cursor.execute(
                            '''
                            INSERT INTO mallas (numero_ficha, estado)
                            VALUES (%s, %s)
                            ''', (NumeroFicha, 0)
                        )
                        mysql.connection.commit()
                        cursor.execute(
                            '''
                            SELECT id_malla, numero_ficha, estado
                            FROM mallas
                            WHERE numero_ficha = %s AND estado = 0
                            ''', (NumeroFicha,)
                        )
                        malla_result = cursor.fetchone()
                        malla_existe = True
                else:
                    # Caso poco probable: no se encontraron fichas con el mismo valor en "programa"
                    cursor.execute(
                        '''
                        INSERT INTO mallas (numero_ficha, estado)
                        VALUES (%s, %s)
                        ''', (NumeroFicha, 0)
                    )
                    mysql.connection.commit()
                    cursor.execute(
                        '''
                        SELECT id_malla, numero_ficha, estado
                        FROM mallas
                        WHERE numero_ficha = %s AND estado = 0
                        ''', (NumeroFicha,)
                    )
                    malla_result = cursor.fetchone()
                    malla_existe = True

        if malla_result:
            id_malla = malla_result[0]
            estado_malla = malla_result[2]
        else:
            id_malla = None
            estado_malla = None

        # Obtener información del programa
        cursor.execute(
            '''
            SELECT nombre, cant_trimestres 
            FROM programas 
            WHERE id_prog = %s
            ''', (id_programa,)
        )
        programa_result = cursor.fetchone()
        if not programa_result:
            return jsonify({'success': False, 'message': 'Programa no encontrado.'}), 404
        nombre_programa, cant_trimestres = programa_result

        # Obtener competencias
        cursor.execute(
            '''
            SELECT id_comp, nombre 
            FROM competencias 
            WHERE id_prog = %s
            ''', (id_programa,)
        )
        competencias_result = cursor.fetchall()
        competencias_dict = [{'id': comp[0], 'nombre': comp[1]} for comp in competencias_result] if competencias_result else []

        # Obtener RAPs por competencia
        raps_by_competencia = {}
        for comp in competencias_dict:
            cursor.execute(
                '''
                SELECT id_raps, descripcion 
                FROM raps 
                WHERE id_comp = %s
                ''', (comp['id'],)
            )
            raps_result = cursor.fetchall()
            raps_by_competencia[comp['id']] = [{'id': rap[0], 'descripcion': rap[1]} for rap in raps_result]

        # Obtener distribuciones ya guardadas
        if id_malla:
            cursor.execute(
                '''
                SELECT r.id_comp, c.nombre, dr.trimestre, r.id_raps, r.descripcion, dr.horas_ejecucion
                FROM distribucion_raps dr
                JOIN raps r ON dr.id_raps = r.id_raps
                JOIN competencias c ON r.id_comp = c.id_comp
                WHERE dr.id_malla = %s
                ''', (id_malla,)
            )
            distribuciones_raw = cursor.fetchall()
        else:
            distribuciones_raw = []
        distribuciones = {}
        horas_totales_sum = 0
        for id_comp, comp_nombre, trimestre, id_rap, rap_desc, horas in distribuciones_raw:
            key = (trimestre, id_comp)
            if key not in distribuciones:
                distribuciones[key] = {
                    'trimestre': trimestre,
                    'id_comp': id_comp,
                    'competencia': comp_nombre,
                    'raps': [],
                    'horas': 0
                }
            distribuciones[key]['raps'].append({'id': id_rap, 'descripcion': rap_desc})
            distribuciones[key]['horas'] += horas
            horas_totales_sum += horas
        distribuciones_list = list(distribuciones.values())

        # Para jornada mixta, la intensidad se actualiza vía /actualizar_intensidad en el frontend.
        # Por ello, si no se ha asignado, se deja sin modificar aquí.

        return jsonify({
            'success': True,
            'malla_existe': malla_existe,  # True si la ficha ya tiene malla o se creó automáticamente; False si no, para mostrar las opciones Espejo/Manual.
            'programa': id_programa,
            'nombre': nombre_programa,
            'competencias': competencias_dict,
            'raps': raps_by_competencia,
            'jornada': jornada,
            'cant_trimestres': cant_trimestres,
            'distribuciones': distribuciones_list,
            'intensidad': intensidad,
            'estado': estado_malla  # Estado de la malla actual (0 o 1)
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()


@mostrar_datos_bp.route('/crear_malla', methods=['POST'])
def crear_malla():
    try:
        data = request.get_json()
        NumeroFicha = data.get('NumeroFicha')
        
        user = session.get('user')
        if not user or len(user) < 1:
            return jsonify({'success': False, 'message': 'Inicia sesión, Por favor.'}), 401

        cursor = mysql.connection.cursor()
        cursor.execute(
            '''
            INSERT INTO mallas (numero_ficha) 
            VALUES (%s)
            ''', (NumeroFicha,)
        )
        mysql.connection.commit()
        cursor.close()
        return jsonify({'success': True, 'message': 'Malla creada correctamente.'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@mostrar_datos_bp.route('/guardar_distribucion', methods=['POST'])
def guardar_distribucion():
    if request.method == 'POST':
        try:
            data = request.get_json()
            numero_ficha = data.get('numeroFicha')
            trimestre = data.get('trimestre')
            raps_datos = data.get('raps', [])
            
            user = session.get('user')
            if not user or len(user) < 1:
                return jsonify({'success': False, 'message': 'Inicia sesión, Por favor.'}), 401

            cursor = mysql.connection.cursor()
            
            # Obtener el id_malla correspondiente al número de ficha
            cursor.execute(
                '''
                SELECT id_malla 
                FROM mallas 
                WHERE numero_ficha = %s
                ''', (numero_ficha,)
            )
            malla_result = cursor.fetchone()
            
            if not malla_result:
                return jsonify({'success': False, 'message': 'No se encontró la malla asociada.'}), 404
                
            id_malla = malla_result[0]
            
            # Insertar cada RAP con sus horas en la tabla distribucion_raps
            for rap_data in raps_datos:
                id_rap = rap_data.get('id_rap')
                horas = rap_data.get('horas')
                
                cursor.execute(
                    '''
                    INSERT INTO distribucion_raps (id_malla, id_raps, horas_ejecucion, trimestre) 
                    VALUES (%s, %s, %s, %s)
                    ''', (id_malla, id_rap, horas, trimestre)
                )
            
            mysql.connection.commit()
            return jsonify({'success': True, 'message': 'Distribución guardada correctamente.'})
            
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500
        finally:
            cursor.close()


@mostrar_datos_bp.route('/eliminar_distribucion', methods=['POST'])
def eliminar_distribucion():
    if request.method == 'POST':
        try:
            data = request.get_json()
            numero_ficha = data.get('numeroFicha')
            id_rap = data.get('id_rap')
            trimestre = data.get('trimestre')
            
            user = session.get('user')
            if not user or len(user) < 1:
                return jsonify({'success': False, 'message': 'Inicia sesión, Por favor.'}), 401

            cursor = mysql.connection.cursor()
            
            # Obtener el id_malla correspondiente al número de ficha
            cursor.execute(
                '''
                SELECT id_malla 
                FROM mallas 
                WHERE numero_ficha = %s
                ''', (numero_ficha,)
            )
            malla_result = cursor.fetchone()
            
            if not malla_result:
                return jsonify({'success': False, 'message': 'No se encontró la malla asociada.'}), 404
                
            id_malla = malla_result[0]
            
            # Eliminar la distribución específica
            cursor.execute(
                '''
                DELETE FROM distribucion_raps 
                WHERE id_malla = %s AND id_raps = %s AND trimestre = %s
                ''', (id_malla, id_rap, trimestre)
            )
            
            mysql.connection.commit()
            return jsonify({'success': True, 'message': 'Distribución eliminada correctamente.'})
            
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500
        finally:
            cursor.close()


@mostrar_datos_bp.route('/actualizar_intensidad', methods=['POST'])
def actualizar_intensidad():
    try:
        data = request.get_json()
        NumeroFicha = data.get("NumeroFicha")
        selected_horas = data.get("selected_horas")  # Esperamos "286" o "308"

        if not NumeroFicha or not selected_horas:
            return jsonify({"success": False, "message": "Falta número de ficha o selección de horas."}), 400

        # Mapeo: si se selecciona 286 se guarda 1; si 308 se guarda 2
        try:
            selected_horas = int(selected_horas)
        except ValueError:
            return jsonify({"success": False, "message": "El valor de horas debe ser numérico."}), 400

        intensidad_val = None
        if selected_horas == 286:
            intensidad_val = 1
        elif selected_horas == 308:
            intensidad_val = 2
        else:
            return jsonify({"success": False, "message": "Valor de horas no válido."}), 400

        cursor = mysql.connection.cursor()
        cursor.execute(
            '''
            UPDATE fichas 
            SET intensidad = %s 
            WHERE numero_ficha = %s
            ''', (intensidad_val, NumeroFicha)
        )
        mysql.connection.commit()
        cursor.close()
        return jsonify({"success": True, "intensidad": intensidad_val})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@mostrar_datos_bp.route('/actualizar_estado_malla', methods=['POST'])
def actualizar_estado_malla():
    try:
        data = request.get_json()
        NumeroFicha = data.get("NumeroFicha")
        nuevo_estado = data.get("estado")  # Esperamos el valor 1 para indicar "Terminado"
        
        if not NumeroFicha or nuevo_estado is None:
            return jsonify({"success": False, "message": "Falta número de ficha o estado."}), 400
        
        cursor = mysql.connection.cursor()
        cursor.execute(
            "UPDATE mallas SET estado = %s WHERE numero_ficha = %s",
            (nuevo_estado, NumeroFicha)
        )
        mysql.connection.commit()
        cursor.close()
        return jsonify({"success": True, "message": "Estado de malla actualizado correctamente."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
