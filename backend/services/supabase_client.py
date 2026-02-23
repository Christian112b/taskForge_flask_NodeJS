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
    
    def select(self, table: str, filters: dict = None, select: str = '*'):
        """
        Obtiene registros de una tabla
        
        Args:
            table: Nombre de la tabla
            filters: Diccionario de filtros {columna: valor}
            select: Columnas a seleccionar
            
        Returns:
            Lista de registros
        """
        url = f"{self.url}/rest/v1/{table}?select={select}"
        
        if filters:
            for column, value in filters.items():
                url += f"&{column}=eq.{value}"
        
        response = requests.get(url, headers=self._get_anon_headers())
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Error fetching from Supabase: {response.text}")
    
    def insert(self, table: str, data: dict):
        """
        Inserta un registro en una tabla
        
        Args:
            table: Nombre de la tabla
            data: Diccionario con los datos
            
        Returns:
            Registro insertado
        """
        url = f"{self.url}/rest/v1/{table}"
        response = requests.post(url, json=data, headers=self.headers)
        
        if response.status_code in [200, 201]:
            return response.json()
        else:
            raise Exception(f"Error inserting into Supabase: {response.text}")
    
    def update(self, table: str, filters: dict, data: dict):
        """
        Actualiza registros en una tabla
        
        Args:
            table: Nombre de la tabla
            filters: Diccionario de filtros {columna: valor}
            data: Diccionario con los datos a actualizar
            
        Returns:
            Registros actualizados
        """
        url = f"{self.url}/rest/v1/{table}"
        
        # Agregar filtros a la URL
        filter_parts = [f"{col}=eq.{val}" for col, val in filters.items()]
        url += "?" + "&".join(filter_parts)
        
        response = requests.patch(url, json=data, headers=self.headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Error updating Supabase: {response.text}")
    
    def delete(self, table: str, filters: dict):
        """
        Elimina registros de una tabla
        
        Args:
            table: Nombre de la tabla
            filters: Diccionario de filtros {columna: valor}
            
        Returns:
            Respuesta de Supabase
        """
        url = f"{self.url}/rest/v1/{table}"
        
        # Agregar filtros a la URL
        filter_parts = [f"{col}=eq.{val}" for col, val in filters.items()]
        url += "?" + "&".join(filter_parts)
        
        response = requests.delete(url, headers=self.headers)
        
        if response.status_code in [200, 204]:
            return True
        else:
            raise Exception(f"Error deleting from Supabase: {response.text}")


# Instancia global del cliente
supabase_client = SupabaseClient()
