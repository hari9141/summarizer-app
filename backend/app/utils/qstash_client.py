import os
import uuid
import threading
from app.utils.redis_client import get_redis_client

def queue_task_simple(function_name, **kwargs):
    """Simple task queuing without external services"""
    task_id = str(uuid.uuid4())
    redis_client = get_redis_client()
    
    # Mark as processing
    redis_client.setex(f"task_{task_id}", 3600, "processing")
    
    # Execute in background thread
    def execute():
        try:
            if function_name == 'summarize_text_task':
                from app.utils.summarizer import summarize_text_task
                result = summarize_text_task(
                    kwargs['text'],
                    kwargs['length'],
                    kwargs['article_id'],
                    kwargs['user_id']
                )
                redis_client.setex(f"summary_{task_id}", 3600, result)
                redis_client.delete(f"task_{task_id}")
        except Exception as e:
            redis_client.setex(f"error_{task_id}", 3600, str(e))
            redis_client.delete(f"task_{task_id}")
    
    thread = threading.Thread(target=execute, daemon=True)
    thread.start()
    
    return task_id
