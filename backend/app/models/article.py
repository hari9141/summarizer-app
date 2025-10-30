from app import db
from datetime import datetime

class Article(db.Model):
    __tablename__ = 'articles'
    
    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True,
        doc="Unique identifier for the article"
    )
    
    title = db.Column(
        db.String(255),
        nullable=False,
        index=True,
        doc="Title of the article"
    )
    
    content = db.Column(
        db.Text,
        nullable=False,
        doc="Full text content of the article"
    )
    
    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        nullable=False,
        doc="When the article was uploaded"
    )
    
    updated_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now(),  
        doc="When the article was last updated"
    )
    
    user_id = db.Column(
        db.Integer,
        db.ForeignKey('users.id'),  
        nullable=False,
        index=True,
        doc="ID of the user who uploaded this article"
    )
    
    summaries = db.relationship(
        'Summary',
        backref='article',
        lazy=True,
        cascade='all, delete-orphan',
        order_by='Summary.created_at.desc()',
        doc="All summaries generated for this article"
    )
    
    def __repr__(self):
        title_preview = self.title[:50]
        if len(self.title) > 50:
            title_preview += '...'
        return f'<Article {title_preview}>'
    
    def to_dict(self, include_content=True, include_summaries=False):
        data= {
            'id': self.id,
            'title': self.title,
            'author_id': self.user_id,
            'author_username': self.author.username if self.author else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'summaries_count': len(self.summaries)
        }
        if include_content:
            data['content'] = self.content
        if include_summaries:
            data['summaries'] = [s.to_dict() for s in self.summaries]
        
        return data
    
    def get_latest_summary(self):
        return self.summaries[0] if self.summaries else None

    def word_count(self):
        return len(self.content.split())



    @staticmethod
    def get_by_user(user_id):
        return Article.query.filter_by(user_id=user_id).order_by(Article.created_at.desc()).all()

    @staticmethod
    def search_by_title(search_term):
        return Article.query.filter(
            Article.title.ilike(f'%{search_term}%')
        ).all()