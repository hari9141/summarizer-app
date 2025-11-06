from flask import Blueprint, request, jsonify
from app.models import Article, Summary
from app.utils.summarizer import queue_summarization
from app.utils.redis_client import get_redis_client
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity

bp = Blueprint('articles', __name__, url_prefix='/api/articles')

@bp.route('', methods=['POST'])
@jwt_required()
def create_article():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('content'):
        return jsonify({'error': 'Content required'}), 400
    
    try:
        article = Article(
            title=data.get('title', 'Untitled'),
            content=data['content'],
            user_id=user_id
        )
        db.session.add(article)
        db.session.commit()
        
        return jsonify({
            'article': article.to_dict(),
            'message': 'Article created'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:article_id>', methods=['GET'])
@jwt_required()
def get_article(article_id):
    user_id = get_jwt_identity()
    article = Article.query.filter_by(id=article_id, user_id=user_id).first()
    
    if not article:
        return jsonify({'error': 'Not found'}), 404
    
    return jsonify({'article': article.to_dict()}), 200

@bp.route('', methods=['GET'])
@jwt_required()
def get_articles():
    user_id = get_jwt_identity()
    articles = Article.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'articles': [a.to_dict() for a in articles],
        'count': len(articles)
    }), 200

@bp.route('/<int:article_id>/summarize', methods=['POST'])
@jwt_required()
def summarize_article(article_id):
    user_id = get_jwt_identity()
    
    article = Article.query.filter_by(id=article_id, user_id=user_id).first()
    if not article:
        return jsonify({'error': 'Article not found'}), 404
    
    data = request.get_json() or {}
    length = data.get('length', 'medium')
    
    if length not in ['short', 'medium', 'long']:
        length = 'medium'
    
    try:
        task_id = queue_summarization(
            article.content.strip(),
            length,
            article_id,
            user_id
        )
        
        return jsonify({
            'task_id': task_id,
            'message': 'Summary queued',
            'article_id': article_id
        }), 202
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/summarize_status/<task_id>', methods=['GET'])
def summarize_status(task_id):
    redis_client = get_redis_client()
    
    summary = redis_client.get(f"summary_{task_id}")
    error = redis_client.get(f"error_{task_id}")
    status = redis_client.get(f"task_{task_id}")
    
    if summary:
        return jsonify({'status': 'done', 'summary': summary}), 200
    
    if error:
        return jsonify({'status': 'failed', 'error': error}), 400
    
    if status == "processing":
        return jsonify({'status': 'pending'}), 202
    
    return jsonify({'status': 'unknown'}), 200

@bp.route('/<int:article_id>', methods=['DELETE'])
@jwt_required()
def delete_article(article_id):
    user_id = get_jwt_identity()
    article = Article.query.filter_by(id=article_id, user_id=user_id).first()
    
    if not article:
        return jsonify({'error': 'Not found'}), 404
    
    try:
        db.session.delete(article)
        db.session.commit()
        return jsonify({'message': 'Deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
