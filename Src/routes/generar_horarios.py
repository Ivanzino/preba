from flask import Blueprint, jsonify, render_template, request, session
from flask_mysqldb import MySQL

generar_horarios_bp = Blueprint('generar_horarios', __name__)
mysql = MySQL()

@generar_horarios_bp.route("/generar_horarios", methods=["GET"])
def generar_horarios():
    return render_template("Modelo generación de horarios.html")

# Endpoint para obtener las sedes asociadas al centro del usuario
@generar_horarios_bp.route("/obtener_sedes_usuario", methods=["GET"])
def obtener_sedes_usuario():
    try:
        user = session.get('user')
        if not user or len(user) < 1:
            return jsonify({"error": "No hay sesión activa"}), 401
        
        cedula = user[0]
        cursor = mysql.connection.cursor()
        
        # Obtener el código del centro del usuario
        cursor.execute('SELECT codigo_centro FROM vinculados WHERE cedula = %s', (cedula,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({"error": "No se encontró el usuario"}), 404
        
        codigo_centro = result[0]
        
        # Obtener las sedes asociadas a ese centro
        cursor.execute('SELECT codigo_sede, nombre FROM sedes WHERE codigo_centro = %s', (codigo_centro,))
        sedes = [{"id": row[0], "nombre": row[1]} for row in cursor.fetchall()]
        cursor.close()
        
        return jsonify(sedes), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint para obtener las jornadas disponibles
@generar_horarios_bp.route("/obtener_jornadas", methods=["GET"])
def obtener_jornadas():
    try:
        # Obtener solo las jornadas únicas
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT DISTINCT jornada FROM fichas')
        jornadas = [row[0] for row in cursor.fetchall()]
        cursor.close()
        
        return jsonify(jornadas), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Endpoint mejorado para fichas sin horarios con filtros
@generar_horarios_bp.route("/fichas_sin_horarios", methods=["GET"])
def fichas_sin_horarios():
    try:
        # Obtener los parámetros de filtro
        codigo_sede = request.args.get('sede')
        jornada = request.args.get('jornada')
        trimestre = request.args.get('trimestre')

        # Consulta base: fichas que no tienen horarios en ningún trimestre
        query = """
            SELECT f.numero_ficha, f.programa, f.jornada
            FROM fichas f
            WHERE NOT EXISTS (
                SELECT 1
                FROM trimetres_ano t
                JOIN horarios h ON h.id_trimestre = t.id_trimestre
                WHERE t.numero_ficha = f.numero_ficha
            )
        """
        params = []

        # Filtro por sede
        if codigo_sede:
            query += " AND f.codigo_sede = %s"
            params.append(codigo_sede)
        
        # Filtro por jornada
        if jornada:
            query += " AND f.jornada = %s"
            params.append(jornada)

        # Filtro opcional por trimestre: sólo fichas que en ese trimestre no tengan horarios
        if trimestre:
            query += " AND NOT EXISTS ("
            query += " SELECT 1 FROM trimetres_ano t2 "
            query += " JOIN horarios h2 ON h2.id_trimestre = t2.id_trimestre"
            query += " WHERE t2.numero_ficha = f.numero_ficha"
            query += "   AND RIGHT(t2.id_trimestre,1) = %s"
            query += " )"
            params.append(trimestre)

        cursor = mysql.connection.cursor()
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        cursor.close()

        # Construir la lista de resultados con nombre de programa
        fichas = []
        for numero_ficha, id_programa, jornada_val in rows:
            # Obtener nombre real del programa
            cursor = mysql.connection.cursor()
            cursor.execute("SELECT nombre FROM programas WHERE id_prog = %s", (id_programa,))
            prog = cursor.fetchone()
            cursor.close()
            nombre_programa = prog[0] if prog else f"Programa ID: {id_programa}"

            fichas.append({
                "numero_ficha": numero_ficha,
                "nombre_programa": nombre_programa,
                "jornada": jornada_val
            })

        return jsonify(fichas), 200

    except Exception as e:
        # En caso de error, devolver JSON con mensaje
        return jsonify({"error": str(e)}), 500

    
    
    
@generar_horarios_bp.route("/obtener_ambientes", methods=["GET"])
def obtener_ambientes():
    try:
        tipo_ambiente = request.args.get('tipo', None)

        # Validar tipo_ambiente si está presente
        if tipo_ambiente is not None:
            try:
                tipo_ambiente = int(tipo_ambiente)
                if tipo_ambiente not in [0, 1, 2, 3]:
                    return jsonify({"error": "Tipo de ambiente inválido"}), 400
            except ValueError:
                return jsonify({"error": "Tipo de ambiente debe ser un número"}), 400

        user = session.get('user')
        if not user or len(user) < 1:
            return jsonify({"error": "Usuario no autenticado"}), 401

        cedula = user[0]

        cursor = mysql.connection.cursor()

        # Obtener el codigo_centro del usuario
        cursor.execute('SELECT codigo_centro FROM vinculados WHERE cedula = %s', (cedula,))
        resultado = cursor.fetchone()
        if not resultado:
            cursor.close()
            return jsonify({"error": "No se encontró el usuario vinculado"}), 404

        codigo_centro = resultado[0]

        # Obtener los códigos de sede asociados al centro
        cursor.execute('SELECT codigo_sede FROM sedes WHERE codigo_centro = %s', (codigo_centro,))
        sedes = cursor.fetchall()
        if not sedes:
            cursor.close()
            return jsonify({"error": "No se encontraron sedes asociadas"}), 404

        # Convertir los resultados a una lista de códigos
        codigos_sede = [s[0] for s in sedes]

        # Construir consulta para ambientes filtrando por códigos de sede
        query = 'SELECT id_ambiente, nombre FROM ambientes WHERE codigo_sede IN %s'
        params = [tuple(codigos_sede)]

        if tipo_ambiente is not None:
            query += ' AND tipo = %s'
            params.append(tipo_ambiente)

        cursor.execute(query, tuple(params))
        ambientes = [{"id": row[0], "nombre": row[1]} for row in cursor.fetchall()]
        cursor.close()

        return jsonify(ambientes), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@generar_horarios_bp.route("/verificar_mallas_sede", methods=["GET"])
def verificar_mallas_sede():
    try:
        codigo_sede = request.args.get('sede')
        if not codigo_sede:
            return jsonify({"error": "No se proporcionó el código de sede"}), 400
        
        # Consulta para obtener las fichas de la sede y verificar sus mallas
        query = """
            SELECT f.numero_ficha, f.programa, p.nombre, m.estado
            FROM fichas f
            JOIN programas p ON f.programa = p.id_prog
            LEFT JOIN mallas m ON f.numero_ficha = m.numero_ficha
            WHERE f.codigo_sede = %s
        """
        
        cursor = mysql.connection.cursor()
        cursor.execute(query, (codigo_sede,))
        rows = cursor.fetchall()
        cursor.close()
        
        # Verificar el estado de las mallas
        fichas_con_mallas_incompletas = []
        todas_las_fichas = []
        
        for row in rows:
            numero_ficha, id_programa, nombre_programa, estado = row
            todas_las_fichas.append({
                "numero_ficha": numero_ficha,
                "nombre_programa": nombre_programa
            })
            
            if estado == 0:
                fichas_con_mallas_incompletas.append({
                    "numero_ficha": numero_ficha,
                    "nombre_programa": nombre_programa
                })
        
        return jsonify({
            "todas_completas": len(fichas_con_mallas_incompletas) == 0,
            "fichas_incompletas": fichas_con_mallas_incompletas,
            "total_fichas": todas_las_fichas
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500