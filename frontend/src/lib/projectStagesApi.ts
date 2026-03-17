import { supabase } from './supabase';

// URL del API - usa variable de entorno en producción
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = API_BASE_URL ? `${API_BASE_URL}/api/project-stages` : '/api/project-stages';

export interface ProjectStage {
  id: string;
  project_id: string;
  stage_id: string;
  stage_name: string;
  stage_color: string;
  stage_order: number;
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

export const projectStagesApi = {
  getByProject: async (projectId: string): Promise<ProjectStage[]> => {
    return fetchApi<ProjectStage[]>(`/project/${projectId}`);
  },

  create: async (projectId: string, stage: Omit<ProjectStage, 'id' | 'project_id' | 'created_at'>): Promise<ProjectStage> => {
    return fetchApi<ProjectStage>(`/project/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(stage)
    });
  },

  update: async (id: string, stage: Partial<ProjectStage>): Promise<ProjectStage> => {
    return fetchApi<ProjectStage>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(stage)
    });
  },

  delete: async (id: string): Promise<void> => {
    await fetchApi<void>(`/${id}`, {
      method: 'DELETE'
    });
  },

  initialize: async (projectId: string): Promise<ProjectStage[]> => {
    return fetchApi<ProjectStage[]>(`/project/${projectId}/initialize`, {
      method: 'POST'
    });
  }
};
