from functools import wraps
from flask import request, jsonify
from controllers.auth_controller import AuthController


def jwt_required(f):
    """
    Decorador para proteger rutas con JWT
    
    Uso:
        @app.route('/ruta-protegida')
        @jwt_required
        def ruta_protegida():
            return {...}
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Obtener el token del header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'No se proporcionó token de autorización'}), 401
        
        # Extraer el token (formato: "Bearer <token>")
        try:
            token = auth_header.split(' ')[1]
        except IndexError:
            return jsonify({'error': 'Formato de token inválido'}), 401
        
        # Verificar el token
        is_valid, payload = AuthController.verify_token(token)
        
        if not is_valid:
            return jsonify(payload), 401
        
        # Agregar el user_id al request para usarlo en la función
        request.user_id = payload.get('user_id')
        request.user_email = payload.get('email')
        
        return f(*args, **kwargs)
    
    return decorated_function


def optional_jwt_required(f):
    """
    Decorador opcional que permite acceso tanto a usuarios autenticados como anónimos
    
    Si el usuario envía un token válido, request.user_id estará disponible.
    Si no envía token o es inválido, request.user_id será None.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
                is_valid, payload = AuthController.verify_token(token)
                
                if is_valid:
                    request.user_id = payload.get('user_id')
                    request.user_email = payload.get('email')
                else:
                    request.user_id = None
                    request.user_email = None
            except (IndexError, KeyError):
                request.user_id = None
                request.user_email = None
        else:
            request.user_id = None
            request.user_email = None
        
        return f(*args, **kwargs)
    
    return decorated_function
