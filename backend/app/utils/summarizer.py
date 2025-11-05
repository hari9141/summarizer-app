import requests
import os
import hashlib
from dotenv import load_dotenv
from app.utils.redis_client import get_redis_client
from .celery_worker import celery_app
load_dotenv()


class HFSummarizer:
    def __init__(self):
        self.hf_token = os.getenv('HUGGING_FACE_API_KEY')
        if not self.hf_token:
            print(" HUGGING_FACE_API_KEY not found in .env")
            self.available = False
            return
        
        self.api_url = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn"
        self.available = True
        print(" Hugging Face BART Summarizer initialized (NEW ROUTER ENDPOINT)")
    
    def summarize(self, text, length='medium'):
        if not self.available:
            raise Exception("HF API key not configured - add HUGGING_FACE_API_KEY to .env")
        
        if not text or len(text.strip()) < 50:
            raise Exception("Text too short (minimum 50 chars)")
        
        try:
            clean_text = text.strip().replace('\n', ' ')
            
            if length == 'short':
                min_length = 30
                max_length = 80
            elif length == 'medium':
                min_length = 80
                max_length = 150
            else:
                min_length = 150
                max_length = 250
            
            payload = {
                "inputs": clean_text,
                "parameters": {
                    "min_length": min_length,
                    "max_length": max_length,
                }
            }
            
            headers = {"Authorization": f"Bearer {self.hf_token}"}
            
            response = requests.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 503:
                raise Exception("HF model loading - try again in 10 seconds")
            
            if response.status_code != 200:
                error = response.json() if response.text else f"HTTP {response.status_code}"
                raise Exception(f"HF API error: {error}")
            
            result = response.json()
            
            if isinstance(result, list) and len(result) > 0:
                summary = result[0].get('summary_text', '')
            else:
                raise Exception("Invalid HF response format")
            
            if not summary or len(summary) < 20:
                raise Exception("Empty summary returned")
            
            print(f"✅ BART generated {length} summary ({len(summary)} chars)")
            return summary
            
        except requests.exceptions.Timeout:
            raise Exception("HF API timeout - try again")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error: {str(e)}")
        except Exception as e:
            error_msg = str(e)[:200]
            print(f"❌ HF Error: {error_msg}")
            raise Exception(f"Summarization failed: {error_msg}")

_summarizer = None

def get_summarizer():
    global _summarizer
    if _summarizer is None:
        _summarizer = HFSummarizer()
    return _summarizer

@celery_app.task(bind=True)
def summarize_text_task(self, text, length='medium', article_id=None, user_id=None):
    from app import create_app, db
    from app.models import Summary
    app = create_app('development')
    with app.app_context():
        try:
            redis_client = get_redis_client()
            cache_key = f"summ_{hashlib.sha256((text+length).encode()).hexdigest()}"
            cached = redis_client.get(cache_key)
            if cached:
                print(f"✅ CACHE HIT for {cache_key}")
                if article_id and user_id:
                    existing = Summary.query.filter_by(article_id=article_id, user_id=user_id).first()
                    if not existing:
                        summary_obj = Summary(
                            summary_text=cached,
                            length=length,
                            article_id=article_id,
                            user_id=user_id
                        )
                        db.session.add(summary_obj)
                        db.session.commit()
                return cached

            summarizer = get_summarizer()
            result = summarizer.summarize(text, length)
            if not result or len(result) < 20:
                raise Exception("Invalid summary")
            redis_client.setex(cache_key, 43200, result)
            if article_id and user_id:
                summary_obj = Summary(
                    summary_text=result,
                    length=length,
                    article_id=article_id,
                    user_id=user_id
                )
                db.session.add(summary_obj)
                db.session.commit()

            print(f"✅ CACHE SAVE and DB SAVE for {cache_key}")
            return result

        except Exception as e:
            db.session.rollback()
            print(f"❌ Summarization error: {str(e)}")
            raise