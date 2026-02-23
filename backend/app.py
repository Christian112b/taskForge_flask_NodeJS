from flask import Flask
from flask_cors import CORS
from views.auth_views import auth_bp
from views.protected_views import protected_bp


def create_app():
    """Crea y configura la aplicación Flask"""
    
    app = Flask(__name__)
    
    # Habilitar CORS para permitir solicitudes desde el frontend
    CORS(app, 
         origins=["http://localhost:5173", "http://127.0.0.1:5173"],
         supports_credentials=True)
    
    # Registrar blueprints (rutas)
    app.register_blueprint(auth_bp)
    app.register_blueprint(protected_bp)
    
    # Ruta raíz
    @app.route('/')
    def index():
        return {
            'message': 'API de Flask - MVC Pattern',
            'version': '1.0.0',
            'endpoints': {
                'auth': {
                    'register': 'POST /api/auth/register',
                    'login': 'POST /api/auth/login',
                    'me': 'GET /api/auth/me',
                    'logout': 'POST /api/auth/logout'
                },
                'protected': {
                    'profile': 'GET /api/profile (requiere JWT)',
                    'update_profile': 'PUT /api/profile (requiere JWT)',
                    'user_data': 'GET /api/data (requiere JWT)',
                    'health_check': 'GET /api/health-check (requiere JWT)'
                }
            }
        }
    
    # Ruta de health check
    @app.route('/health')
    def health():
        return {'status': 'healthy'}
    
    return app


# Crear la aplicación
app = create_app()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
