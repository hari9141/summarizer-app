import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

class QStashClient:
    def __init__(self):
        self.token = os.getenv('QSTASH_TOKEN')
        self.api_url = "https://qstash.upstash.io/v1/publish"
        
        if not self.token:
            raise Exception("QSTASH_TOKEN not set in environment variables")
    
    def publish_task(self, function_name, **kwargs):
        """Queue a task to be executed"""
        payload = {
            "function_name": function_name,
            **kwargs
        }
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # The URL where QStash will send the webhook
        callback_url = os.getenv('BACKEND_URL', 'https://your-app.render.com') + '/api/tasks/execute'
        
        response = requests.post(
            self.api_url,
            headers=headers,
            json={
                "destination": callback_url,
                "body": json.dumps(payload),
                "retries": 3,
                "delay": "0s"
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"QStash error: {response.text}")
        
        return response.json().get('messageId')

qstash_client = QStashClient()
