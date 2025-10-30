from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(
        db.Integer,
        primary_key=True,
        doc="Unique identifier for the user"
    )
    
    username = db.Column(
        db.String(80),
        unique=True,  
        nullable=False,
        doc="Unique username for login"
    )
    
    email = db.Column(
        db.String(120),
        unique=True,  
        nullable=False,
        doc="User email address"
    )
    
    password_hash = db.Column(
        db.String(255),
        nullable=False,
        doc="Hashed password (never store plain password!)"
    )
    
    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now(), 
        doc="When the user account was created"
    )
    
    articles = db.relationship(
        'Article',  
        backref='author',  
        lazy=True,  
        cascade='all, delete-orphan',  
        doc="All articles written by this user"
    )
    
    summaries = db.relationship(
        'Summary',
        backref='user',
        lazy=True,
        cascade='all, delete-orphan',
        doc="All summaries created by this user"
    )
    

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


    def __repr__(self):
        return f'<User {self.username}>'

    
    def to_dict(self, include_email=True):
        data= {
            'id': self.id,
            'username': self.username,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'articles_count': len(self.articles),       
            'summaries_count': len(self.summaries)}
        if include_email:
                data['email'] = self.email
        return data    

    @staticmethod
    def find_by_username(username):
        return User.query.filter_by(username=username).first()

    @staticmethod
    def find_by_email(email):
        return User.query.filter_by(email=email).first()

    @staticmethod
    def get_all_users():
        return User.query.all()