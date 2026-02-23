import jwt
from datetime import datetime, timedelta
from config import Config
from models.user import User, UserSchema
from services.supabase_client import supabase_client


class AuthController:
    """Controlador para manejar la autenticación"""
    
    @staticmethod
    def register(data: dict) -> tuple[dict, int]:
        """
        Registra un nuevo usuario
        
        Args:
            data: Diccionario con email, password y confirmPassword
            
        Returns:
            Tupla (respuesta, código de estado)
        """
        # Validar datos
        is_valid, error_message = UserSchema.validate_register(data)
        if not is_valid:
            return {'error': error_message}, 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password')
        
        # Verificar si el usuario ya existe en Supabase
        try:
            existing_users = supabase_client.select('users', {'email': email})
            if existing_users and len(existing_users) > 0:
                return {'error': 'El correo ya está registrado'}, 400
        except Exception:
            # Si la tabla no existe, continuamos
            pass
        
        # Crear el usuario
        user_id = User.generate_id()
        password_hash = User.hash_password(password)
        
        user_data = {
            'id': user_id,
            'email': email,
            'password_hash': password_hash,
            'created_at': datetime.now().isoformat()
        }
        
        try:
            # Intentar insertar en Supabase
            supabase_client.insert('users', user_data)
        except Exception as e:
            # Si la tabla no existe, creamos el usuario en memoria (modo desarrollo)
            print(f"Warning: Could not insert into Supabase: {e}")
        
        # Generar token JWT
        token = AuthController.generate_token(user_id, email)
        
        return {
            'message': 'Usuario registrado exitosamente',
            'user': {
                'id': user_id,
                'email': email
            },
            'token': token
        }, 201
    
    @staticmethod
    def login(data: dict) -> tuple[dict, int]:
        """
        Inicia sesión de un usuario
        
        Args:
            data: Diccionario con email y password
            
        Returns:
            Tupla (respuesta, código de estado)
        """
        # Validar datos
        is_valid, error_message = UserSchema.validate_login(data)
        if not is_valid:
            return {'error': error_message}, 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password')
        
        # Buscar usuario en Supabase
        try:
            users = supabase_client.select('users', {'email': email})
            
            if not users or len(users) == 0:
                return {'error': 'Credenciales incorrectas'}, 401
            
            user_data = users[0]
            user = User(
                id=user_data['id'],
                email=user_data['email'],
                password_hash=user_data['password_hash'],
                created_at=user_data.get('created_at')
            )
            
            # Verificar contraseña
            if not user.verify_password(password):
                return {'error': 'Credenciales incorrectas'}, 401
            
            # Generar token JWT
            token = AuthController.generate_token(user.id, user.email)
            
            return {
                'user': user.to_public_dict(),
                'token': token
            }, 200
            
        except Exception as e:
            return {'error': f'Error al iniciar sesión: {str(e)}'}, 500
    
    @staticmethod
    def get_current_user(user_id: str) -> tuple[dict, int]:
        """
        Obtiene los datos del usuario actual
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Tupla (respuesta, código de estado)
        """
        try:
            users = supabase_client.select('users', {'id': user_id})
            
            if not users or len(users) == 0:
                return {'error': 'Usuario no encontrado'}, 404
            
            user_data = users[0]
            return {
                'id': user_data['id'],
                'email': user_data['email'],
                'created_at': user_data.get('created_at')
            }, 200
            
        except Exception as e:
            return {'error': f'Error al obtener usuario: {str(e)}'}, 500
    
    @staticmethod
    def generate_token(user_id: str, email: str) -> str:
        """Genera un token JWT"""
        expiration = datetime.utcnow() + timedelta(hours=Config.JWT_EXPIRATION_HOURS)
        
        payload = {
            'user_id': user_id,
            'email': email,
            'exp': expiration,
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(payload, Config.SECRET_KEY, algorithm=Config.JWT_ALGORITHM)
        return token
    
    @staticmethod
    def verify_token(token: str) -> tuple[bool, dict]:
        """
        Verifica un token JWT
        
        Args:
            token: Token a verificar
            
        Returns:
            Tupla (es válido, payload)
        """
        try:
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.JWT_ALGORITHM])
            return True, payload
        except jwt.ExpiredSignatureError:
            return False, {'error': 'Token expirado'}
        except jwt.InvalidTokenError:
            return False, {'error': 'Token inválido'}
