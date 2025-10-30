from flask import Blueprint, jsonify
from app import db
from app.models import User, Article, Summary

bp = Blueprint('test_db', __name__, url_prefix='/api')

@bp.route('/test-db', methods=['GET'])
def test_database():
    try:
        user_count = User.query.count()
        article_count = Article.query.count()
        summary_count = Summary.query.count()
        
        return jsonify({
            'status': 'connected',
            'message': 'Database connection successful',
            'tables': {
                'users': user_count,
                'articles': article_count,
                'summaries': summary_count
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Database connection failed: {str(e)}'
        }), 500
