import { supabase } from './supabase';

// URL del API - usa variable de entorno en producción
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = API_BASE_URL ? `${API_BASE_URL}/api/categories` : '/api/categories';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  created_at: string;
}

// Función para obtener el token de Supabase
async function getSupabaseToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getSupabaseToken()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error desconocido');
  }

  return data;
}

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    return fetchApi<Category[]>('');
  },

  create: async (category: Omit<Category, 'id' | 'created_at'>): Promise<Category> => {
    return fetchApi<Category>('', {
      method: 'POST',
      body: JSON.stringify(category)
    });
  },

  update: async (id: string, category: Partial<Category>): Promise<Category> => {
    return fetchApi<Category>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category)
    });
  },

  delete: async (id: string): Promise<void> => {
    await fetchApi<void>(`/${id}`, {
      method: 'DELETE'
    });
  }
};
