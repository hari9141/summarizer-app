from .health import bp as health_bp
from .ping import bp as ping_bp
from .test_db import bp as test_db_bp
from .auth import bp as auth_bp
__all__ = ['health_bp','ping_bp','test_db_bp','auth_bp']
