from flask import Blueprint, request, jsonify
from app.models import Article, Summary
from app.utils.summarizer import summarize_text_task
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
        print(f"🤖 Generating summary for article {article_id} using Hugging Face AI")
        task = summarize_text_task.apply_async(args=[article.content, length, article.id, user_id])
        return jsonify({
            'task_id': task.id,
            'message': 'Summary generation started (asynchronous)',
            'article_id': article_id
        }), 202
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Summarization error: {error_msg}")
        return jsonify({'error': error_msg}), 500


@bp.route('/summarize_status/<task_id>', methods=['GET'])
@jwt_required()
def summarize_status(task_id):
    try:
        task = summarize_text_task.AsyncResult(task_id)
        if task.state == 'PENDING':
            return jsonify({'status': 'pending', 'task_id': task_id}), 200
        elif task.state == 'SUCCESS':
            summary_text = task.result
            return jsonify({'status': 'done', 'summary': summary_text, 'task_id': task_id}), 200
        elif task.state == 'FAILURE':
            return jsonify({'status': 'failed', 'error': str(task.info), 'task_id': task_id}), 200
        else:
            return jsonify({'status': task.state, 'task_id': task_id}), 200
    except Exception as e:
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
