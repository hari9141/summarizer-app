from app import db
from datetime import datetime

class Summary(db.Model):
    __tablename__ = 'summaries'
    
    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True,
        doc="Unique identifier for the summary"
    )
    
    summary_text = db.Column(
        db.Text,
        nullable=False,
        doc="The generated summary text"
    )
    
    length = db.Column(
        db.String(50),
        default='medium',  
        doc="Length of the summary (short/medium/long)"
    )
    
    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        nullable=False,
        doc="When the summary was generated"
    )
    
    article_id = db.Column(
        db.Integer,
        db.ForeignKey('articles.id'),
        nullable=False,
        index=True,  
        doc="ID of the article being summarized"
    )
    
    user_id = db.Column(
        db.Integer,
        db.ForeignKey('users.id'),
        nullable=False,
        index=True,  
        doc="ID of the user who generated this summary"
    )
    
    def __repr__(self):
        return f'<Summary {self.id} for Article {self.article_id}>'
    
    def to_dict(self, include_article=False, include_user=False):
        data= {
            'id': self.id,
            'summary_text': self.summary_text,
            'length': self.length,
            'article_id': self.article_id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_article and self.article:
            data['article'] = {
                'id': self.article.id,
                'title': self.article.title,
                'word_count': self.article.word_count()
            }
        if include_user and self.user:
            data['user'] = {
                'id': self.user.id,
                'username': self.user.username
            }
        
        return data
    
    def word_count(self):
        return len(self.summary_text.split())

    def compression_ratio(self):
        if not self.article:
            return 0.0
        
        article_words = self.article.word_count()
        summary_words = self.word_count()
        
        if summary_words == 0:
            return 0.0
        
        return article_words / summary_words


    @staticmethod
    def get_by_article(article_id):
        return Summary.query.filter_by(article_id=article_id).order_by(
            Summary.created_at.desc()
        ).all()

    @staticmethod
    def get_by_user(user_id):
        return Summary.query.filter_by(user_id=user_id).order_by(
            Summary.created_at.desc()
        ).all()

    @staticmethod
    def get_latest(limit=10):
        return Summary.query.order_by(
            Summary.created_at.desc()
        ).limit(limit).all()