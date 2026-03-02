// API client para proyectos
// Usa el mismo proxy (/api -> localhost:8000)

const API_URL = '/api/projects';

// Función para obtener el token de Supabase
async function getSupabaseToken(): Promise<string | null> {
  const { supabase } = await import('./supabase')
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

async function fetchProjectsApi<T>(
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
    throw new Error(data.error || 'Error desconocido');
  }

  return data;
}

// Funciones de proyectos
export const projectsApi = {
  // Obtener todos los proyectos
  getAll: () =>
    fetchProjectsApi<any[]>(''),

  // Obtener un proyecto por ID
  getById: (id: string) =>
    fetchProjectsApi<any>(`/${id}`),

  // Crear proyecto
  create: (name: string, description: string = '') =>
    fetchProjectsApi<any>('', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  // Actualizar proyecto
  update: (id: string, data: { name?: string; description?: string }) =>
    fetchProjectsApi<any>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Eliminar proyecto
  delete: (id: string) =>
    fetchProjectsApi<any>(`/${id}`, {
      method: 'DELETE',
    }),

  // Obtener tablero Kanban
  getKanban: () =>
    fetchProjectsApi<any[]>('/kanban'),

  // Mover proyecto a otra etapa
  move: (projectId: string, stageId: string) =>
    fetchProjectsApi<any>(`/${projectId}/move`, {
      method: 'PUT',
      body: JSON.stringify({ stage_id: stageId }),
    }),
};
