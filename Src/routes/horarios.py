from flask import Blueprint, request, jsonify, session, render_template
from datetime import datetime
from flask_mysqldb import MySQL
from routes.generador_horarios import generar_horario_ficha
from MySQLdb.cursors import DictCursor
from routes.generador_horarios import generar_horario_ficha

mysql = MySQL()
horarios_bp = Blueprint('horarios', __name__)

@horarios_bp.route("/vista_generar_horario")
def vista_generar_horario():
    return render_template("generar_horario.html")

@horarios_bp.route('/fichas_activas', methods=['GET'])
def fichas_activas():
    if 'centro_usuario' not in session:
        return jsonify({"error": "No hay sesión activa"}), 401

    centro = session['centro_usuario']
    if isinstance(centro, tuple):
        centro = centro[0]

    conn = mysql.connection
    cursor = conn.cursor(DictCursor)
    cursor.execute("""
    SELECT f.numero_ficha, f.numero_ficha AS id_ficha
    FROM fichas f
    JOIN sedes s ON f.codigo_sede = s.codigo_sede
    WHERE f.fecha_fin_lectiva > CURDATE()
    AND s.codigo_centro = %s
""", (centro,))

    fichas = cursor.fetchall()
    return jsonify(fichas)

@horarios_bp.route('/generar_horario', methods=['POST'])
def generar_horario():
    if 'user' not in session or 'centro_usuario' not in session:
        return jsonify({'error': 'Sesión no válida'}), 401

    data = request.json
    numero_ficha = data.get('ficha_id')
    if not numero_ficha:
        return jsonify({'error': 'Falta el número de ficha'}), 400

    try:
        centro_usuario = session['centro_usuario']
        if isinstance(centro_usuario, tuple):
            centro_usuario = centro_usuario[0]

        conn = mysql.connection
        fecha_actual = datetime.today()

        resultado = generar_horario_ficha(
            conn=conn,
            numero_ficha=int(numero_ficha),
            usuario_centro=int(centro_usuario),
            fecha_actual=fecha_actual
        )

        return jsonify(resultado)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
