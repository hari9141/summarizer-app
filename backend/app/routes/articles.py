from flask import Blueprint, request, jsonify
from app.models import Article, Summary
from app.utils.summarizer import queue_summarization, summarize_text_task
from app.utils.redis_client import get_redis_client
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid

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
            'message': 'Article created successfully'
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
        return jsonify({'error': 'Article not found'}), 404
    
    return jsonify({'article': article.to_dict()}), 200

@bp.route('', methods=['GET'])
@jwt_required()
def get_articles():
    user_id = get_jwt_identity()
    articles = Article.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'articles': [article.to_dict() for article in articles],
        'count': len(articles)
    }), 200

@bp.route('/<int:article_id>/summarize', methods=['POST'])
@jwt_required()
def summarize_article(article_id):
    user_id = get_jwt_identity()
    try:
        article = Article.query.filter_by(id=article_id, user_id=user_id).first()
        if not article:
            return jsonify({'error': 'Article not found'}), 404
        
        data = request.get_json() or {}
        length = data.get('length', 'medium')
        if length not in ['short', 'medium', 'long']:
            length = 'medium'
        
        print(f"🤖 Queueing summary task for article {article_id}")
        
        # Queue via QStash
        task_id = queue_summarization(
            article.content.strip(),
            length,
            article_id,
            user_id
        )
        
        # Store task info in Redis
        redis_client = get_redis_client()
        redis_client.setex(f"task_{task_id}", 600, "processing")
        
        return jsonify({
            'task_id': task_id,
            'message': 'Summary generation started',
            'article_id': article_id
        }), 202
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/summarize_status/<task_id>', methods=['GET'])
@jwt_required()
def summarize_status(task_id):
    try:
        redis_client = get_redis_client()
        
        # Check if task is done
        status = redis_client.get(f"task_{task_id}")
        summary = redis_client.get(f"summary_{task_id}")
        
        if summary:
            return jsonify({'status': 'done', 'summary': summary}), 200
        
        elif status == "processing":
            return jsonify({'status': 'pending'}), 202
        
        else:
            return jsonify({'status': 'unknown'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# QStash Webhook endpoint
@bp.route('/tasks/execute', methods=['POST'])
def execute_task():
    """QStash sends webhook here to execute task"""
    try:
        data = request.get_json()
        task_id = request.headers.get('Upstash-Message-Id')
        
        if data.get('function_name') == 'summarize_text_task':
            result = summarize_text_task(
                data['text'],
                data['length'],
                data['article_id'],
                data['user_id']
            )
            
            # Store result in Redis
            redis_client = get_redis_client()
            redis_client.setex(f"summary_{task_id}", 600, result)
            redis_client.delete(f"task_{task_id}")
            
            return jsonify({'status': 'success'}), 200
        
        return jsonify({'status': 'unknown task'}), 400
    
    except Exception as e:
        print(f"❌ Task execution error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:article_id>', methods=['DELETE'])
@jwt_required()
def delete_article(article_id):
    user_id = get_jwt_identity()
    article = Article.query.filter_by(id=article_id, user_id=user_id).first()
    
    if not article:
        return jsonify({'error': 'Article not found'}), 404
    
    try:
        db.session.delete(article)
        db.session.commit()
        return jsonify({'message': 'Article deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
