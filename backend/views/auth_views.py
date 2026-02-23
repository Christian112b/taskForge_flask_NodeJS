from flask import Blueprint, request, jsonify
from controllers.auth_controller import AuthController

# Blueprint para las rutas de autenticación
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


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
    return jsonify(response), status_code


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Endpoint para iniciar sesión
    
    Body:
        - email: Correo electrónico
        - password: Contraseña
        
    Returns:
        - 200: Inicio de sesión exitoso
        - 400: Error de validación
        - 401: Credenciales incorrectas
    """

    data = request.get_json()
    response, status_code = AuthController.login(data)
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
    # En una implementación con JWT, el logout se maneja del lado del cliente
    # eliminando el token. Aquí solo confirmamos.
    return jsonify({'message': 'Sesión cerrada exitosamente'}), 200
