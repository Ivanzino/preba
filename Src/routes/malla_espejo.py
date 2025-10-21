from flask import Blueprint
from flask import Flask, jsonify, make_response, render_template, request, redirect, url_for, flash, session
import pandas as pd
import hashlib
import os
from collections import defaultdict
from flask_mysqldb import MySQL
import mysql.connector

# Crear el Blueprint
malla_espejo_bp = Blueprint('malla_espejo', __name__)




# Inicializar MySQL (esto se puede mover a app.py si es necesario)
mysql = MySQL()



@malla_espejo_bp.route('/malla_espejo')
def malla_espejo():
    token = request.args.get('token')
    NumeroFicha = request.args.get('NumeroFicha')
    
    # Validar token
    if not token:
        return redirect(url_for('raps'))
    
    try:
        cursor = mysql.connection.cursor()
        
        # Primero obtenemos el programa de la ficha ingresada para usarlo en el filtro
        cursor.execute(
            "SELECT programa FROM fichas WHERE numero_ficha = %s",
            (NumeroFicha,)
        )
        ficha_programa_result = cursor.fetchone()
        if not ficha_programa_result:
            return "Ficha no encontrada", 404
        id_prog = ficha_programa_result[0]
        
        # Traemos la información de las mallas en estado 1 filtradas por el mismo programa
        query = """
            SELECT 
                m.id_malla,
                m.numero_ficha,
                p.id_prog,         
                p.nombre,
                f.jornada,
                f.intensidad,
                p.cant_trimestres
            FROM mallas m
            JOIN fichas f ON m.numero_ficha = f.numero_ficha
            JOIN programas p ON f.programa = p.id_prog
            WHERE m.estado = 1 AND p.id_prog = %s
        """
        cursor.execute(query, (id_prog,))
        mallas = cursor.fetchall()

        fichaSeleccionada = None
        
        if NumeroFicha:
            # Buscamos la ficha en las mallas obtenidas
            for m in mallas:
                if str(m[1]) == str(NumeroFicha):
                    # Mapeamos la intensidad
                    intensidad = m[5]
                    if intensidad == 0:
                        intensidad = 330
                    elif intensidad == 1:
                        intensidad = 286
                    elif intensidad == 2:
                        intensidad = 308
                    
                    # Construir la fichaSeleccionada, incluyendo cant_trimestres (m[6])
                    fichaSeleccionada = (
                        m[0],  # id_malla
                        m[1],  # numero_ficha
                        m[2],  # id_prog
                        m[3],  # nombre_programa
                        m[4],  # jornada
                        intensidad,
                        m[6]   # cant_trimestres
                    )
                    break
            
            # Si no se encontró la malla en la consulta principal, consultamos la ficha y el programa
            if fichaSeleccionada is None:
                cursor.execute(
                    """
                    SELECT 
                        f.numero_ficha,
                        p.id_prog,
                        p.nombre,
                        f.jornada,
                        f.intensidad,
                        p.cant_trimestres
                    FROM fichas f
                    JOIN programas p ON f.programa = p.id_prog
                    WHERE f.numero_ficha = %s
                    """,
                    (NumeroFicha,)
                )
                ficha_data = cursor.fetchone()
                
                if ficha_data:
                    intensidad_original = ficha_data[4]
                    if intensidad_original == 0:
                        intensidad_mapeada = 330
                    elif intensidad_original == 1:
                        intensidad_mapeada = 286
                    elif intensidad_original == 2:
                        intensidad_mapeada = 308
                    else:
                        intensidad_mapeada = intensidad_original
                    
                    fichaSeleccionada = (
                        None,               # id_malla (no existe en mallas)
                        ficha_data[0],      # numero_ficha
                        ficha_data[1],      # id_prog
                        ficha_data[2],      # nombre_programa
                        ficha_data[3],      # jornada
                        intensidad_mapeada,
                        ficha_data[5]       # cant_trimestres
                    )
        
        cursor.close()
        
        return render_template('mallaEspejo.html', mallas=mallas, fichaSeleccionada=fichaSeleccionada)
    
    except Exception as e:
        return f"Error: {str(e)}"





@malla_espejo_bp.route('/duplicar_malla', methods=['POST'])
def duplicar_malla():
    try:
        data = request.get_json()
        original_malla_id = data.get("original_malla_id")  # Malla a clonar
        nueva_ficha = data.get("numeroFicha")              # Ficha destino

        # Validar sesión
        user = session.get('user')
        if not user:
            return jsonify({'success': False, 'message': 'Inicia sesión, por favor.'}), 401

        cursor = mysql.connection.cursor()

        # 1. Verificar que la malla original existe
        cursor.execute("SELECT id_malla FROM mallas WHERE id_malla = %s", (original_malla_id,))
        original = cursor.fetchone()
        if not original:
            return jsonify({'success': False, 'message': 'Malla original no encontrada.'}), 404

        # 2. Obtener distribuciones de la malla original
        cursor.execute("""
            SELECT id_raps, horas_ejecucion, trimestre
            FROM distribucion_raps
            WHERE id_malla = %s
        """, (original_malla_id,))
        distribuciones = cursor.fetchall()

        # 3. Crear la nueva malla (estado = 1)
        cursor.execute("""
            INSERT INTO mallas (numero_ficha, estado)
            VALUES (%s, 1)
        """, (nueva_ficha,))
        mysql.connection.commit()
        nuevo_id_malla = cursor.lastrowid

        # 4. Para cada distribución, copiar directamente usando los id_raps originales
        for (id_raps, horas, trim) in distribuciones:
            # Insertar la distribución con el mismo RAP pero nueva malla
            cursor.execute("""
                INSERT INTO distribucion_raps (id_malla, id_raps, horas_ejecucion, trimestre)
                VALUES (%s, %s, %s, %s)
            """, (nuevo_id_malla, id_raps, horas, trim))
            mysql.connection.commit()

        cursor.close()
        return jsonify({'success': True, 'message': 'Malla duplicada exitosamente'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500