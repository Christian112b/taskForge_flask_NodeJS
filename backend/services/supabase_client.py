import requests
from config import Config


class SupabaseClient:
    """Cliente para interactuar con la API de Supabase"""
    
    def __init__(self):
        self.url = Config.SUPABASE_URL
        self.anon_key = Config.SUPABASE_ANON_KEY
        self.service_key = Config.SUPABASE_SERVICE_KEY
        self.headers = {
            'apikey': self.service_key,
            'Authorization': f'Bearer {self.service_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    
    def _get_anon_headers(self):
        """Headers para operaciones públicas"""
        return {
            'apikey': self.anon_key,
            'Authorization': f'Bearer {self.anon_key}',
            'Content-Type': 'application/json'
        }
    
    def select(self, table: str, filters: dict = None, select: str = '*', user_token: str = None):
        """
        Obtiene registros de una tabla
        
        Args:
            table: Nombre de la tabla
            filters: Diccionario de filtros {columna: valor}
            select: Columnas a seleccionar
            user_token: Token JWT del usuario (para RLS)
            
        Returns:
            Lista de registros
        """
        url = f"{self.url}/rest/v1/{table}?select={select}"
        
        if filters:
            for column, value in filters.items():
                url += f"&{column}=eq.{value}"
        
        headers = self._get_anon_headers()
        if user_token:
            headers['Authorization'] = f'Bearer {user_token}'
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Error fetching from Supabase: {response.text}")
    
    def insert(self, table: str, data: dict, user_token: str = None):
        """
        Inserta un registro en una tabla
        
        Args:
            table: Nombre de la tabla
            data: Diccionario con los datos
            user_token: Token JWT del usuario (para RLS)
            
        Returns:
            Registro insertado
        """
        url = f"{self.url}/rest/v1/{table}"
        headers = self._get_anon_headers()
        if user_token:
            headers['Authorization'] = f'Bearer {user_token}'
        
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code in [200, 201]:
            # Si la respuesta está vacía, retornar los datos enviados
            if response.text:
                return response.json()
            else:
                return data  # Retornar los datos que se insertaron
        else:
            raise Exception(f"Error inserting into Supabase: {response.text}")
    
    def update(self, table: str, filters: dict, data: dict, user_token: str = None):
        """
        Actualiza registros en una tabla
        
        Args:
            table: Nombre de la tabla
            filters: Diccionario de filtros {columna: valor}
            data: Diccionario con los datos a actualizar
            user_token: Token JWT del usuario (para RLS)
            
        Returns:
            Registros actualizados
        """
        url = f"{self.url}/rest/v1/{table}"
        
        # Agregar filtros a la URL
        filter_parts = [f"{col}=eq.{val}" for col, val in filters.items()]
        url += "?" + "&".join(filter_parts)
        
        headers = self._get_anon_headers()
        if user_token:
            headers['Authorization'] = f'Bearer {user_token}'
        
        response = requests.patch(url, json=data, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Error updating Supabase: {response.text}")
    
    def delete(self, table: str, filters: dict, user_token: str = None):
        """
        Elimina registros de una tabla
        
        Args:
            table: Nombre de la tabla
            filters: Diccionario de filtros {columna: valor}
            user_token: Token JWT del usuario (para RLS)
            
        Returns:
            Respuesta de Supabase
        """
        url = f"{self.url}/rest/v1/{table}"
        
        # Agregar filtros a la URL
        filter_parts = [f"{col}=eq.{val}" for col, val in filters.items()]
        url += "?" + "&".join(filter_parts)
        
        headers = self._get_anon_headers()
        if user_token:
            headers['Authorization'] = f'Bearer {user_token}'
        
        response = requests.delete(url, headers=headers)
        
        if response.status_code in [200, 204]:
            return True
        else:
            raise Exception(f"Error deleting from Supabase: {response.text}")
    
    def verify_token(self, token: str) -> dict | None:
        """
        Verifica un token JWT de Supabase y obtiene información del usuario
        
        Args:
            token: Token JWT de Supabase
            
        Returns:
            Diccionario con info del usuario o None si es inválido
        """
        try:
            # Usar la API de auth de Supabase para verificar el token
            url = f"{self.url}/auth/v1/user"
            headers = {
                'apikey': self.anon_key,
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
        except Exception:
            return None


# Instancia global del cliente
supabase_client = SupabaseClient()
