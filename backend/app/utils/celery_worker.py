import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

def make_celery(app=None):
    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    
    celery = Celery(
        'summarizer_app',
        broker=redis_url,
        backend=redis_url,
        include=['app.utils.summarizer']
    )
    
    celery.conf.update(
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        timezone='UTC',
        enable_utc=True,
        result_expires=3600,
        task_track_started=True,
        task_acks_late=True,
        worker_prefetch_multiplier=1,
    )
    
    if app:
        class ContextTask(celery.Task):
            def __call__(self, *args, **kwargs):
                with app.app_context():
                    return self.run(*args, **kwargs)
        celery.Task = ContextTask
    
    return celery

celery_app = make_celery()
