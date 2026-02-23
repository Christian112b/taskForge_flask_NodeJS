// API client para comunicarse con Flask

const API_URL = 'http://localhost:8000/api/auth';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'Error desconocido');
  }

  return data;
}

// Funciones de autenticación
export const authApi = {
  register: (email: string, password: string, confirmPassword: string) =>
    fetchApi<{ message: string; user: { id: string; email: string }; token: string }>(
      '/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, confirmPassword }),
      }
    ),

  login: (email: string, password: string) =>
    fetchApi<{ user: { id: string; email: string }; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getCurrentUser: () =>
    fetchApi<{ id: string; email: string; created_at: string }>('/me', {
      method: 'GET',
    }),

  logout: () =>
    fetchApi<{ message: string }>('/logout', {
      method: 'POST',
    }),
};

export { ApiError };
