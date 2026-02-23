from flask import Blueprint, request, jsonify
from middleware.auth_middleware import jwt_required
from services.supabase_client import supabase_client

# Blueprint para rutas protegidas
protected_bp = Blueprint('protected', __name__, url_prefix='/api')


@protected_bp.route('/profile', methods=['GET'])
@jwt_required
def get_profile():
    """
    Obtiene el perfil del usuario actual
    
    Requiere: Token JWT válido
    
    Returns:
        - 200: Datos del perfil
        - 401: No autorizado
    """
    user_id = request.user_id
    
    try:
        users = supabase_client.select('users', {'id': user_id})
        
        if not users or len(users) == 0:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        user_data = users[0]
        
        return jsonify({
            'id': user_data['id'],
            'email': user_data['email'],
            'created_at': user_data.get('created_at')
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error al obtener perfil: {str(e)}'}), 500


@protected_bp.route('/profile', methods=['PUT'])
@jwt_required
def update_profile():
    """
    Actualiza el perfil del usuario actual
    
    Requiere: Token JWT válido
    Body: { email: string }
    
    Returns:
        - 200: Perfil actualizado
        - 400: Error de validación
        - 401: No autorizado
    """
    user_id = request.user_id
    data = request.get_json()
    
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'El correo es requerido'}), 400
    
    # Verificar formato básico de email
    if '@' not in email or '.' not in email:
        return jsonify({'error': 'El correo no es válido'}), 400
    
    try:
        # Actualizar en Supabase
        supabase_client.update('users', {'id': user_id}, {'email': email})
        
        return jsonify({'message': 'Perfil actualizado exitosamente'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Error al actualizar perfil: {str(e)}'}), 500


@protected_bp.route('/data', methods=['GET'])
@jwt_required
def get_user_data():
    """
    Ejemplo de ruta protegida que retorna datos del usuario
    
    Requiere: Token JWT válido
    
    Returns:
        - 200: Datos del usuario
        - 401: No autorizado
    """
    return jsonify({
        'message': 'Esta es una ruta protegida con JWT',
        'user_id': request.user_id,
        'user_email': request.user_email,
        'data': {
            'posts': 0,
            'comments': 0,
            'likes': 0
        }
    }), 200


@protected_bp.route('/health-check', methods=['GET'])
@jwt_required
def health_check():
    """
    Verificación de estado del servicio
    
    Requiere: Token JWT válido
    
    Returns:
        - 200: Estado saludable
    """
    return jsonify({
        'status': 'healthy',
        'user': request.user_email
    }), 200
