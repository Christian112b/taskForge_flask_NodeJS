// API client para subtareas

// URL del API - usa variable de entorno en producción
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = API_BASE_URL ? `${API_BASE_URL}/api/subtasks` : '/api/subtasks';

// Función para obtener el token de Supabase
async function getSupabaseToken(): Promise<string | null> {
  const { supabase } = await import('./supabase')
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

async function fetchSubtasksApi<T>(
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

// Tipos de datos
export interface Subtask {
  id: string;
  name: string;
  status: string;
  project_id: string;
  description?: string;
  category_id?: string;
  created_at: string;
}

// Funciones de subtareas
export const subtasksApi = {
  // Obtener subtareas por proyecto
  getByProject: (projectId: string) =>
    fetchSubtasksApi<Subtask[]>(`/project/${projectId}`),

  // Crear subtarea
  create: (
    projectId: string, 
    name: string, 
    status: string = 'todo',
    description?: string,
    categoryId?: string
  ) =>
    fetchSubtasksApi<Subtask>('', {
      method: 'POST',
      body: JSON.stringify({ 
        project_id: projectId, 
        name, 
        status,
        description,
        category_id: categoryId
      }),
    }),

  // Actualizar subtarea
  update: (subtaskId: string, data: { 
    name?: string; 
    status?: string;
    description?: string;
    category_id?: string;
  }) =>
    fetchSubtasksApi<Subtask>(`/${subtaskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Eliminar subtarea
  delete: (subtaskId: string) =>
    fetchSubtasksApi<Subtask>(`/${subtaskId}`, {
      method: 'DELETE',
    }),
};
