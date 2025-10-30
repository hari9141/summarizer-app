from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name='development'):
    app = Flask(__name__)
    CORS(app)

    from config import config
    app.config.from_object(config[config_name])
    
    db.init_app(app)
    jwt.init_app(app)
    
    with app.app_context():
        from app.models import User, Article, Summary



    from app.routes import health_bp, ping_bp, test_db_bp, auth_bp
    app.register_blueprint(health_bp) 
    app.register_blueprint(ping_bp)   
    app.register_blueprint(test_db_bp)
    app.register_blueprint(auth_bp)
    
    return app
