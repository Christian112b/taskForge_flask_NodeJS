from functools import wraps
from flask import request, jsonify
from services.supabase_client import supabase_client


def jwt_required(f):
    """
    Decorador para proteger rutas con JWT de Supabase
    
    El token de Supabase se pasa en el header Authorization: Bearer <token>
    
    Uso:
        @app.route('/ruta-protegida')
        @jwt_required
        def ruta_protegida():
            return {...}
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Obtener token del header Authorization
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'No se proporcionó token de autorización'}), 401
        
        # Extraer el token (formato: "Bearer <token>")
        try:
            token = auth_header.split(' ')[1]
        except IndexError:
            return jsonify({'error': 'Formato de token inválido'}), 401
        
        # Verificar el token con Supabase
        user_info = supabase_client.verify_token(token)
        
        if not user_info:
            return jsonify({'error': 'Token inválido o expirado'}), 401
        
        # Agregar el user_id al request para usarlo en la función
        request.user_id = user_info.get('id')
        request.user_email = user_info.get('email')
        request.token = token  # Guardar el token para usar en Supabase
        
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
        
        token = None
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
            except (IndexError, KeyError):
                token = None
        
        if token:
            user_info = supabase_client.verify_token(token)
            
            if user_info:
                request.user_id = user_info.get('id')
                request.user_email = user_info.get('email')
            else:
                request.user_id = None
                request.user_email = None
        else:
            request.user_id = None
            request.user_email = None
        
        return f(*args, **kwargs)
    
    return decorated_function
