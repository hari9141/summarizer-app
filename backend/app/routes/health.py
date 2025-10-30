from flask import Blueprint, jsonify
bp = Blueprint('health', __name__, url_prefix='/api')
@bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'API is running successfully',
        'service': 'Summarizer API'
    }), 200