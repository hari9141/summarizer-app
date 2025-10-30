from flask import Blueprint, jsonify
bp = Blueprint('ping', __name__, url_prefix='/api')
@bp.route('/ping', methods=['GET'])
def ping():
    return jsonify({
        'message': 'pong'
    }), 200
