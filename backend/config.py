import os
from datetime import timedelta
from dotenv import load_dotenv
load_dotenv()

class Config:
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-fallback')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    APP_NAME = 'PrecisAI'
    DEBUG = False

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

class DevelopmentConfig(Config):
    DEBUG = True 
    TESTING = False 
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'sqlite:///dev.db' 
    )
    SQLALCHEMY_ECHO = True
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

class ProductionConfig(Config):
    DEBUG = False  
    TESTING = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_ECHO = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

class TestingConfig(Config):
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:' 
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig 
}
