from celery import Celery
import os

def make_celery():
    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    return Celery(
        'precisai',
        broker=redis_url,
        backend=redis_url,
        include=['app.utils.summarizer'] 
    )

celery_app = make_celery()

from app.utils import summarizer