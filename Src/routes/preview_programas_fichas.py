from flask import Blueprint, render_template, current_app, request, jsonify

preview_programas_fichas_bp = Blueprint(
    'preview_programas_fichas',
    __name__,
    template_folder='../templates'
)

@preview_programas_fichas_bp.route('/preview_programas_fichas')
def preview_programas_fichas():
    mysql = current_app.mysql
    cur = mysql.connection.cursor()

    # 1) Programas
    cur.execute("SELECT id_prog, nombre, sigla, cant_trimestres FROM programas")
    programas = [
        {'id_prog': p[0], 'nombre': p[1], 'sigla': p[2], 'cant_trimestres': p[3]}
        for p in cur.fetchall()
    ]

    # 2) Fichas
    cur.execute("""
        SELECT
            numero_ficha,
            programa,
            jornada,
            codigo_sede,
            DATE_FORMAT(fecha_inicio_lectiva,   '%Y-%m-%d') AS ini_lectiva,
            DATE_FORMAT(fecha_fin_lectiva,       '%Y-%m-%d') AS fin_lectiva,
            DATE_FORMAT(fecha_inicio_induccion, '%Y-%m-%d') AS ini_induccion,
            DATE_FORMAT(fecha_fin_induccion,     '%Y-%m-%d') AS fin_induccion,
            id_instructor,
            intensidad,
            modalidad,
            oferta
        FROM fichas
    """)
    raw = cur.fetchall()
    cur.close()

    fichas = []
    for f in raw:
        # f = tuple: (num, prog, jornada, sede, iniL, finL, iniI, finI, instr, inten, mod, of)
        modalidad_txt = 'Presencial' if f[10] == 1 else 'Virtual'
        oferta_txt    = 'Abierta'    if f[11] == 0 else 'Cerrada'
        fichas.append({
            'numero_ficha':         f[0],
            'programa':             f[1],
            'jornada':              f[2],
            'codigo_sede':          f[3],
            'fecha_inicio_lectiva': f[4],
            'fecha_fin_lectiva':    f[5],
            'fecha_inicio_induccion': f[6],
            'fecha_fin_induccion':    f[7],
            'id_instructor':        f[8],
            'intensidad':           f[9],
            'modalidad':            f[10],
            'oferta':               f[11],
        })

    return render_template(
        'preview_programas_fichas.html',
        programas=programas,
        fichas=fichas
    )

@preview_programas_fichas_bp.route('/preview_programas_fichas/update_programa', methods=['POST'])
def update_programa():
    mysql = current_app.mysql
    cur = mysql.connection.cursor()
    data = request.form
    cur.execute(
        """
        UPDATE programas
        SET nombre = %s,
            sigla  = %s,
            cant_trimestres = %s
        WHERE id_prog = %s
        """,
        (data['nombre'], data['sigla'], data['cant_trimestres'], data['id_prog'])
    )
    mysql.connection.commit()
    cur.close()
    return jsonify(success=True)

@preview_programas_fichas_bp.route('/preview_programas_fichas/update_ficha', methods=['POST'])
def update_ficha():
    mysql = current_app.mysql
    cur = mysql.connection.cursor()
    data = request.form
    # Convertir modalidad/oferta de texto a código si vienes de un select de texto
    mod_code   = 1 if data['modalidad'] == 'Presencial' else 0
    oferta_code= 0 if data['oferta']    == 'Abierta'    else 1

    cur.execute(
        """
        UPDATE fichas
        SET jornada = %s,
            codigo_sede = %s,
            fecha_inicio_lectiva = %s,
            fecha_fin_lectiva = %s,
            fecha_inicio_induccion = %s,
            fecha_fin_induccion = %s,
            id_instructor = %s,
            intensidad = %s,
            modalidad = %s,
            oferta = %s
        WHERE numero_ficha = %s
        """,
        (
            data['jornada'],
            data['codigo_sede'],
            data['fecha_inicio_lectiva'],
            data['fecha_fin_lectiva'],
            data['fecha_inicio_induccion'],
            data['fecha_fin_induccion'],
            data['id_instructor'],
            data['intensidad'],
            mod_code,
            oferta_code,
            data['numero_ficha']
        )
    )
    mysql.connection.commit()
    cur.close()
    return jsonify(success=True)