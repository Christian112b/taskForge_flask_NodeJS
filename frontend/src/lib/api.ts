// API client para comunicarse con Flask
// Usa proxy y token de Supabase

const API_URL = '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Función para obtener el token de Supabase
async function getSupabaseToken(): Promise<string | null> {
  const { supabase } = await import('./supabase')
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Obtener token de Supabase
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
    throw new ApiError(response.status, data.error || 'Error desconocido');
  }

  return data;
}

// Funciones de autenticación (ya no se usan, login es directo con Supabase)
export const authApi = {
  // getCurrentUser ya no es necesario con Supabase
  getCurrentUser: async () => {
    const token = await getSupabaseToken()
    if (!token) throw new Error('No hay sesión')
    return { id: '', email: '' } // El backend obtendrá el usuario del token
  },
  
  logout: async () => {
    const { supabase } = await import('./supabase')
    await supabase.auth.signOut()
  }
};

export { ApiError };
