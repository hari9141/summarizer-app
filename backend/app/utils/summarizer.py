import requests
import os
import hashlib
from dotenv import load_dotenv
from app.utils.redis_client import get_redis_client

load_dotenv()

class HFSummarizer:
    def __init__(self):
        self.hf_token = os.getenv('HUGGING_FACE_API_KEY')
        if not self.hf_token:
            print("⚠️ HUGGING_FACE_API_KEY not found")
            self.available = False
            return
        
        self.api_url = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn"
        self.available = True
        print("✅ Summarizer ready")
    
    def summarize(self, text, length='medium'):
        if not self.available:
            raise Exception("HF API key missing")
        
        if not text or len(text.strip()) < 50:
            raise Exception("Text too short")
        
        try:
            clean_text = text.strip().replace('\n', ' ')
            
            if length == 'short':
                min_l, max_l = 30, 80
            elif length == 'medium':
                min_l, max_l = 80, 150
            else:
                min_l, max_l = 150, 250
            
            payload = {
                "inputs": clean_text,
                "parameters": {"min_length": min_l, "max_length": max_l}
            }
            
            resp = requests.post(
                self.api_url,
                headers={"Authorization": f"Bearer {self.hf_token}"},
                json=payload,
                timeout=60
            )
            
            if resp.status_code != 200:
                raise Exception(f"HF error: {resp.status_code}")
            
            result = resp.json()
            summary = result[0]['summary_text'] if isinstance(result, list) else ""
            
            if not summary:
                raise Exception("Empty response")
            
            return summary
        
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            raise

_summarizer = None

def get_summarizer():
    global _summarizer
    if _summarizer is None:
        _summarizer = HFSummarizer()
    return _summarizer

def summarize_text_task(text, length='medium', article_id=None, user_id=None):
    """Main summarization function"""
    try:
        from app import create_app, db
        from app.models.summary import Summary
        
        app = create_app('production')
        with app.app_context():
            redis_client = get_redis_client()
            cache_key = f"summ_{hashlib.sha256((text+length).encode()).hexdigest()}"
            
            # Check cache
            cached = redis_client.get(cache_key)
            if cached:
                if article_id and user_id:
                    existing = Summary.query.filter_by(
                        article_id=article_id, user_id=user_id
                    ).first()
                    if not existing:
                        db.session.add(Summary(
                            summary_text=cached,
                            length=length,
                            article_id=article_id,
                            user_id=user_id
                        ))
                        db.session.commit()
                return cached
            
            # Generate summary
            summarizer = get_summarizer()
            result = summarizer.summarize(text, length)
            
            # Cache it
            redis_client.setex(cache_key, 43200, result)
            
            # Save to DB
            if article_id and user_id:
                db.session.add(Summary(
                    summary_text=result,
                    length=length,
                    article_id=article_id,
                    user_id=user_id
                ))
                db.session.commit()
            
            return result
    
    except Exception as e:
        print(f"❌ Summarization failed: {str(e)}")
        raise

def queue_summarization(text, length, article_id, user_id):
    """Queue a summarization task"""
    from app.utils.qstash_client import queue_task_simple
    return queue_task_simple('summarize_text_task', 
        text=text, length=length, article_id=article_id, user_id=user_id)
