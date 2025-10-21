# Flask - dentro del blueprint perfilesAsociarComp_bp
from flask import Blueprint, render_template, request, jsonify
from flask_mysqldb import MySQL

perfilesAsociarComp_bp = Blueprint('perfilesAsociarComp', __name__)
mysql = MySQL()

@perfilesAsociarComp_bp.route("/perfilesAsociarComp")
def perfilesAsociarComp():
    cur = mysql.connection.cursor()
    query = """
        SELECT c.id_comp, c.nombre, c.tipo, c.sigla, p.nombre AS programa
        FROM competencias c
        LEFT JOIN programas p ON c.id_prog = p.id_prog
    """
    cur.execute(query)
    rows = cur.fetchall()
    competencias = [
        {
            'id': row[0],
            'nombre': row[1],
            'tipo': row[2] if row[2] is not None else '',
            'sigla': row[3],
            'programa': row[4]
        }
        for row in rows
    ]
    return render_template('perfilesAsociarComp.html', competencias=competencias)

@perfilesAsociarComp_bp.route("/editarComp", methods=['POST'])
def editarComp():
    data = request.get_json()
    id_comp = data['id']
    tipo = data['tipo']
    sigla = data['sigla']
    cur = mysql.connection.cursor()
    cur.execute("UPDATE competencias SET tipo=%s, sigla=%s WHERE id_comp=%s", (tipo, sigla, id_comp))
    mysql.connection.commit()
    return jsonify(success=True, tipo=tipo, sigla=sigla)

@perfilesAsociarComp_bp.route("/verComp", methods=['POST'])
def verComp():
    data = request.get_json()
    id_comp = data['id']
    cur = mysql.connection.cursor()
    cur.execute("SELECT nombre, sigla FROM competencias WHERE id_comp = %s", (id_comp,))
    nombre, sigla = cur.fetchone()
    cur.execute("SELECT id_raps, descripcion FROM raps WHERE id_comp = %s", (id_comp,))
    raps = [{'id_raps': r[0], 'descripcion': r[1]} for r in cur.fetchall()]
    return jsonify(nombre=nombre, sigla=sigla, raps=raps)

@perfilesAsociarComp_bp.route("/perfilesRap", methods=['POST'])
def perfilesRap():
    data = request.get_json()
    cur = mysql.connection.cursor()

    # Si llega id_raps: comportamiento antiguo (por compatibilidad)
    if data.get('id_raps') is not None:
        id_raps = data['id_raps']
        cur.execute("""
            SELECT p.id_perfil, p.nombre FROM perfiles p
            JOIN perfiles_raps pr ON p.id_perfil = pr.id_perfil
            WHERE pr.id_raps = %s
        """, (id_raps,))
        perfiles_asociados = [{'id': row[0], 'nombre': row[1]} for row in cur.fetchall()]

        cur.execute("SELECT id_perfil, nombre FROM perfiles")
        todos = [{'id': row[0], 'nombre': row[1]} for row in cur.fetchall()]

        return jsonify(perfiles=perfiles_asociados, todos=todos)

    # Si llega id_comp: devolver estado por competencia (para el modal masivo)
    if data.get('id_comp') is not None:
        id_comp = data['id_comp']

        # Obtener todos los RAPs de la competencia
        cur.execute("SELECT id_raps FROM raps WHERE id_comp = %s", (id_comp,))
        rap_rows = [r[0] for r in cur.fetchall()]

        total_raps = len(rap_rows)
        if total_raps == 0:
            return jsonify(perfiles_status=[], total_raps=0)

        # Preparar placeholders para IN (...)
        placeholders = ','.join(['%s'] * total_raps)

        # Para cada perfil, traer los id_raps asociados (solo dentro de los RAPs de esa competencia)
        # y contar cuántos RAPs (dentro de esa competencia) tiene asociado.
        cur.execute(f"""
            SELECT p.id_perfil, p.nombre,
                   GROUP_CONCAT(pr.id_raps) AS rap_ids,
                   COUNT(pr.id_raps) AS associated_count
            FROM perfiles p
            LEFT JOIN perfiles_raps pr
              ON p.id_perfil = pr.id_perfil AND pr.id_raps IN ({placeholders})
            GROUP BY p.id_perfil, p.nombre
        """, tuple(rap_rows))

        perfiles_status = []
        for row in cur.fetchall():
            rap_ids_raw = row[2]  # puede ser None
            rap_ids = rap_ids_raw.split(',') if rap_ids_raw else []
            perfiles_status.append({
                'id': row[0],
                'nombre': row[1],
                'associated_count': int(row[3]),
                'rap_ids': rap_ids   # lista de id_raps en string
            })

        return jsonify(perfiles_status=perfiles_status, total_raps=total_raps)

    # Si no se envía nada válido:
    return jsonify(error="Faltan parámetros (id_raps o id_comp)"), 400


@perfilesAsociarComp_bp.route("/guardarPerfilRap", methods=['POST'])
def guardarPerfilRap():
    data = request.get_json()
    id_raps = data['id_raps']
    id_perfil = data['id_perfil']
    cur = mysql.connection.cursor()
    cur.execute("SELECT 1 FROM perfiles_raps WHERE id_raps = %s AND id_perfil = %s", (id_raps, id_perfil))
    if cur.fetchone():
        return jsonify(success=False)
    cur.execute("INSERT INTO perfiles_raps (id_raps, id_perfil) VALUES (%s, %s)", (id_raps, id_perfil))
    mysql.connection.commit()
    return jsonify(success=True)

@perfilesAsociarComp_bp.route("/eliminarPerfilRap", methods=['POST'])
def eliminarPerfilRap():
    data = request.get_json()
    id_raps = data['id_raps']
    id_perfil = data['id_perfil']
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM perfiles_raps WHERE id_raps = %s AND id_perfil = %s", (id_raps, id_perfil))
    mysql.connection.commit()
    return jsonify(success=True)


@perfilesAsociarComp_bp.route("/verInstructores", methods=['POST']) 
def verInstructores(): 
    data = request.get_json() 
    id_comp = data.get('id_comp') 
    try: 
        cur = mysql.connection.cursor() 
 
        cur.execute(""" 
            SELECT  
                i.id_instructor, 
                db.nombre AS instructor, 
                GROUP_CONCAT(DISTINCT p.nombre SEPARATOR ', ') AS perfiles, 
                r.descripcion AS rap, 
                c.nombre AS competencia 
            FROM asociaciones a 
            JOIN instructores i  
                ON a.id_instructor = i.id_instructor 
            JOIN datos_basicos db  
                ON i.cedula = db.cedula 
            LEFT JOIN perfil_instructor pi  
                ON pi.id_instructor = i.id_instructor 
            LEFT JOIN perfiles p  
                ON p.id_perfil = pi.id_perfil 
            LEFT JOIN raps r  
                ON r.id_comp = a.id_comp 
            JOIN competencias c  
                ON c.id_comp = a.id_comp 
            WHERE a.id_comp = %s 
            GROUP BY i.id_instructor, db.nombre, r.descripcion, c.nombre 
        """, (id_comp,)) 
 
        rows = cur.fetchall() 
 
        instructores = [ 
            { 
                'id_instructor': row[0], 
                'nombre': row[1], 
                'perfil': row[2] if row[2] else 'Sin perfil', 
                'rap': row[3] if row[3] else 'Sin RAP' 
            } 
            for row in rows 
        ] 
 
        competencia = rows[0][4] if rows else "Sin competencia" 
 
        return jsonify(instructores=instructores, competencia=competencia) 
 
    except Exception as e: 
        print("Error en verInstructores:", e) 
        return jsonify(error=str(e)), 500




@perfilesAsociarComp_bp.route("/eliminarAsociaciones", methods=['POST'])
def eliminarAsociaciones():
    data = request.get_json()
    id_comp = data['id_comp']
    id_instructor = data['id_instructor']
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM asociaciones WHERE id_comp = %s AND id_instructor = %s", (id_comp, id_instructor))
    mysql.connection.commit()
    return jsonify(success=True)



@perfilesAsociarComp_bp.route("/rapsPorPerfil", methods=['POST'])
def rapsPorPerfil():
    data = request.get_json()
    id_comp = data.get('id_comp')
    id_perfil = data.get('id_perfil')

    if id_comp is None or id_perfil is None:
        return jsonify(error="Faltan parámetros (id_comp o id_perfil)"), 400

    cur = mysql.connection.cursor()

    # RAPs asociados al perfil (dentro de la competencia)
    cur.execute("""
        SELECT r.id_raps, r.descripcion
        FROM raps r
        JOIN perfiles_raps pr ON r.id_raps = pr.id_raps
        WHERE r.id_comp = %s AND pr.id_perfil = %s
    """, (id_comp, id_perfil))
    raps_asociados = [{'id_raps': row[0], 'descripcion': row[1]} for row in cur.fetchall()]

    # RAPs de la competencia que NO están asociados al perfil (faltantes)
    cur.execute("""
        SELECT r.id_raps, r.descripcion
        FROM raps r
        WHERE r.id_comp = %s
        AND r.id_raps NOT IN (
            SELECT pr.id_raps FROM perfiles_raps pr WHERE pr.id_perfil = %s
        )
    """, (id_comp, id_perfil))
    raps_faltantes = [{'id_raps': row[0], 'descripcion': row[1]} for row in cur.fetchall()]

    return jsonify(raps_asociados=raps_asociados, raps_faltantes=raps_faltantes)
