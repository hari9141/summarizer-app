from .health import bp as health_bp
from .auth import auth_bp
from .articles import bp as articles_bp
from .summaries import bp as summaries_bp
__all__ = ['health_bp','auth_bp','articles_bp','summaries_bp']
