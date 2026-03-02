from flask import Blueprint, request, jsonify, make_response
from controllers.auth_controller import AuthController

# Blueprint para las rutas de autenticación
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Nombre de la cookie
TOKEN_COOKIE_NAME = 'auth_token'


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Endpoint para registrar un nuevo usuario
    
    Body:
        - email: Correo electrónico
        - password: Contraseña
        - confirmPassword: Confirmación de contraseña
        
    Returns:
        - 201: Usuario registrado exitosamente
        - 400: Error de validación
    """
    data = request.get_json()
    response, status_code = AuthController.register(data)
    
    # Si el registro es exitoso, establecer cookie HttpOnly
    if status_code == 201:
        token = response.get('token')
        if token:
            # Crear respuesta con cookie segura
            resp = make_response(jsonify({
                'user': response.get('user'),
                'message': response.get('message')
            }), status_code)
            
            # Configurar cookie HttpOnly (no accesible desde JS)
            resp.set_cookie(
                TOKEN_COOKIE_NAME,
                token,
                httponly=True,
                secure=False,  # True en producción con HTTPS
                samesite='Lax',
                max_age=60 * 60 * 24 * 7  # 7 días
            )
            return resp
    
    return jsonify(response), status_code


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Endpoint para iniciar sesión
    
    Body:
        - email: Correo electrónico
        - password: Contraseña
        
    Returns:
        - 200: Inicio de sesión exitoso (token en cookie HttpOnly)
        - 400: Error de validación
        - 401: Credenciales incorrectas
    """

    data = request.get_json()
    response, status_code = AuthController.login(data)
    
    # Si el login es exitoso, establecer cookie HttpOnly
    if status_code == 200:
        token = response.get('token')
        if token:
            # Crear respuesta con cookie segura
            resp = make_response(jsonify({
                'user': response.get('user'),
                'message': 'Login exitoso'
            }), status_code)
            
            # Configurar cookie HttpOnly (no accesible desde JS)
            resp.set_cookie(
                TOKEN_COOKIE_NAME,
                token,
                httponly=True,
                secure=False,  # True en producción con HTTPS
                samesite='Lax',
                max_age=60 * 60 * 24 * 7  # 7 días
            )
            return resp
    
    return jsonify(response), status_code


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """
    Endpoint para obtener el usuario actual
    
    Headers:
        - Authorization: Bearer <token>
        
    Returns:
        - 200: Datos del usuario
        - 401: No autorizado
        - 404: Usuario no encontrado
    """
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
    
    # Obtener los datos del usuario
    user_id = payload.get('user_id')
    response, status_code = AuthController.get_current_user(user_id)
    
    return jsonify(response), status_code


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Endpoint para cerrar sesión
    
    Returns:
        - 200: Sesión cerrada exitosamente
    """
    # Eliminar la cookie
    resp = make_response(jsonify({'message': 'Sesión cerrada exitosamente'}), 200)
    resp.set_cookie(TOKEN_COOKIE_NAME, '', expires=0, httponly=True)
    return resp
