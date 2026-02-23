from dataclasses import dataclass
from typing import Optional
import hashlib
import secrets


@dataclass
class User:
    """Modelo de usuario"""
    id: str
    email: str
    password_hash: str
    created_at: Optional[str] = None
    
    def verify_password(self, password: str) -> bool:
        """Verifica si la contraseña es correcta"""
        return self.password_hash == self._hash_password(password)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Genera un hash de la contraseña"""
        return User._hash_password(password)
    
    @staticmethod
    def _hash_password(password: str) -> str:
        """Crea un hash SHA-256 de la contraseña"""
        # En producción, usa bcrypt o argon2
        return hashlib.sha256(password.encode()).hexdigest()
    
    @staticmethod
    def generate_id() -> str:
        """Genera un ID único para el usuario"""
        return secrets.token_urlsafe(16)
    
    def to_dict(self) -> dict:
        """Convierte el usuario a diccionario"""
        return {
            'id': self.id,
            'email': self.email,
            'password_hash': self.password_hash,
            'created_at': self.created_at
        }
    
    def to_public_dict(self) -> dict:
        """Convierte el usuario a diccionario público (sin password)"""
        return {
            'id': self.id,
            'email': self.email,
            'created_at': self.created_at
        }


class UserSchema:
    """Schema para validar datos de usuario"""
    
    @staticmethod
    def validate_register(data: dict) -> tuple[bool, str]:
        """Valida los datos de registro"""
        email = data.get('email', '').strip()
        password = data.get('password', '')
        confirm_password = data.get('confirmPassword', '')
        
        if not email:
            return False, "El correo es requerido"
        
        if not password:
            return False, "La contraseña es requerida"
        
        if len(password) < 6:
            return False, "La contraseña debe tener al menos 6 caracteres"
        
        if password != confirm_password:
            return False, "Las contraseñas no coinciden"
        
        if '@' not in email or '.' not in email:
            return False, "El correo no es válido"
        
        return True, ""
    
    @staticmethod
    def validate_login(data: dict) -> tuple[bool, str]:
        """Valida los datos de login"""
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email:
            return False, "El correo es requerido"
        
        if not password:
            return False, "La contraseña es requerida"
        
        return True, ""
