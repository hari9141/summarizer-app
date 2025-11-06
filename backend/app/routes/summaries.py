from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Article, Summary
from app.utils.summarizer import summarize_text_task
from app.utils.celery_worker import celery_app

bp = Blueprint('summaries', __name__, url_prefix='/api/summaries')

@bp.route('', methods=['POST'])
@jwt_required()
def create_summary():
    """Create a summary - returns task_id immediately, doesn't wait"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    article_id = data.get('article_id')
    summary_length = data.get('length', 'medium')
    
    if not article_id:
        return jsonify({
            'error': 'article_id is required',
            'required': ['article_id']
        }), 400
    
    if summary_length not in ['short', 'medium', 'long']:
        return jsonify({
            'error': 'Invalid length. Must be: short, medium, or long'
        }), 400
    
    try:
        article = Article.query.filter_by(
            id=article_id,
            user_id=current_user_id
        ).first()
        
        if not article:
            return jsonify({'error': 'Article not found'}), 404
        
        if len(article.content) < 20:
            return jsonify({'error': 'Article content is too short to summarize'}), 400
        
        print(f"🤖 Queueing summary task for article {article_id}")
        
        # IMPORTANT: Use .delay() to queue task ASYNCHRONOUSLY
        task = summarize_text_task.delay(
            article.content.strip(),
            length=summary_length,
            article_id=article_id,
            user_id=current_user_id
        )
        
        # Return immediately with task_id (don't wait for result)
        return jsonify({
            'message': 'Summary generation started',
            'task_id': task.id,
            'article_id': article_id,
            'status': 'queued'
        }), 202  # 202 = Accepted (task queued)
    
    except Exception as e:
        print(f"❌ Error queuing summary: {e}")
        return jsonify({'error': 'Failed to queue summary. Please try again.'}), 500


@bp.route('/status/<task_id>', methods=['GET'])
def get_summary_status(task_id):
    """Check the status of a summarization task"""
    try:
        task = celery_app.AsyncResult(task_id)
        
        if task.state == 'PENDING':
            return jsonify({
                'status': 'pending',
                'progress': 0
            }), 202
        
        elif task.state == 'SUCCESS':
            # Task completed successfully
            return jsonify({
                'status': 'done',
                'summary': task.result
            }), 200
        
        elif task.state == 'FAILURE':
            # Task failed
            return jsonify({
                'status': 'failed',
                'error': str(task.info)
            }), 400
        
        else:
            # RETRY or other states
            return jsonify({
                'status': task.state
            }), 202
    
    except Exception as e:
        return jsonify({'error': f'Failed to get status: {str(e)}'}), 500


@bp.route('', methods=['GET'])
@jwt_required()
def get_summaries():
    """Get all summaries for current user"""
    article_id = request.args.get('article_id', None, type=int)
    current_user_id = int(get_jwt_identity())
    length_filter = request.args.get('length', None, type=str)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    if page < 1:
        page = 1
    if per_page < 1 or per_page > 50:
        per_page = 10
    
    try:
        query = Summary.query.join(Article).filter(
            Article.user_id == current_user_id
        )
        
        if article_id:
            query = query.filter_by(article_id=article_id)
        if current_user_id:
            query = query.filter_by(user_id=current_user_id)
        if length_filter and length_filter in ['short', 'medium', 'long']:
            query = query.filter_by(length=length_filter)
        
        query = query.order_by(Summary.created_at.desc())
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        summaries_data = [
            summary.to_dict(include_article=True, include_user=False) 
            for summary in paginated.items
        ]
        
        return jsonify({
            'summaries': summaries_data,
            'pagination': {
                'total': paginated.total,
                'pages': paginated.pages,
                'current_page': page,
                'per_page': per_page
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve summaries: {str(e)}'}), 500


@bp.route('/<int:summary_id>', methods=['GET'])
@jwt_required()
def get_summary(summary_id):
    """Get a specific summary"""
    try:
        summary = Summary.query.get(summary_id)
        if not summary:
            return jsonify({'error': 'Summary not found'}), 404
        return jsonify({
            'summary': summary.to_dict(include_article=True, include_user=True)
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve summary: {str(e)}'}), 500


@bp.route('/<int:summary_id>', methods=['DELETE'])
@jwt_required()
def delete_summary(summary_id):
    """Delete a summary"""
    current_user_id = int(get_jwt_identity())
    
    summary = Summary.query.get(summary_id)
    
    if not summary:
        return jsonify({'error': 'Summary not found'}), 404
    
    if summary.user_id != current_user_id:
        return jsonify({'error': 'Forbidden - You can only delete your own summaries'}), 403
    
    try:
        db.session.delete(summary)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Summary deleted successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting summary: {e}")
        return jsonify({'error': f'Failed to delete summary: {str(e)}'}), 500
