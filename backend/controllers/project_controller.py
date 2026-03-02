from typing import List
from services.supabase_client import supabase_client
from models.project import Project, Stage, ProjectStage, ProjectSchema


class ProjectController:
    """Controlador para manejar proyectos"""
    
    # ========== PROYECTOS ==========
    
    @staticmethod
    def get_all(user_id: str, user_token: str = None) -> tuple[List[dict], int]:
        """Obtiene todos los proyectos del usuario"""
        try:
            projects = supabase_client.select(
                'projects',
                {'user_id': user_id},
                'id,name,description,created_at,updated_at',
                user_token=user_token
            )
            return projects, 200
        except Exception as e:
            return [{'error': str(e)}], 500
    
    @staticmethod
    def get_by_id(project_id: str, user_id: str, user_token: str = None) -> tuple[dict, int]:
        """Obtiene un proyecto por ID"""
        try:
            projects = supabase_client.select(
                'projects',
                {'id': project_id, 'user_id': user_id},
                'id,name,description,created_at,updated_at',
                user_token=user_token
            )
            
            if not projects or len(projects) == 0:
                return {'error': 'Proyecto no encontrado'}, 404
            
            return projects[0], 200
        except Exception as e:
            return {'error': str(e)}, 500
    
    @staticmethod
    def create(data: dict, user_id: str, user_token: str = None) -> tuple[dict, int]:
        """Crea un nuevo proyecto"""
        # Validar datos
        is_valid, error_message = ProjectSchema.validate_create(data)
        if not is_valid:
            return {'error': error_message}, 400
        
        try:
            project_id = Project.generate_id()
            
            project_data = {
                'id': project_id,
                'name': data.get('name'),
                'description': data.get('description', ''),
                'user_id': user_id
            }
            
            supabase_client.insert('projects', project_data, user_token=user_token)
            
            # Asignar automáticamente a la primera etapa (Por hacer)
            ProjectController._assign_to_stage(project_id, 'todo', user_token)
            
            return project_data, 201
        except Exception as e:
            return {'error': str(e)}, 500
    
    @staticmethod
    def update(project_id: str, data: dict, user_id: str, user_token: str = None) -> tuple[dict, int]:
        """Actualiza un proyecto"""
        is_valid, error_message = ProjectSchema.validate_update(data)
        if not is_valid:
            return {'error': error_message}, 400
        
        try:
            # Verificar que el proyecto pertenece al usuario
            project, status = ProjectController.get_by_id(project_id, user_id, user_token)
            if status != 200:
                return project, status
            
            # Actualizar
            update_data = {
                'name': data.get('name'),
                'description': data.get('description'),
                'updated_at': 'now()'
            }
            
            # Filtrar valores None
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            supabase_client.update('projects', {'id': project_id}, update_data, user_token=user_token)
            
            return {'message': 'Proyecto actualizado', 'id': project_id}, 200
        except Exception as e:
            return {'error': str(e)}, 500
    
    @staticmethod
    def delete(project_id: str, user_id: str, user_token: str = None) -> tuple[dict, int]:
        """Elimina un proyecto"""
        try:
            # Verificar propiedad
            project, status = ProjectController.get_by_id(project_id, user_id, user_token)
            if status != 200:
                return project, status
            
            supabase_client.delete('projects', {'id': project_id}, user_token=user_token)
            
            return {'message': 'Proyecto eliminado'}, 200
        except Exception as e:
            return {'error': str(e)}, 500
    
    # ========== ETAPAS ==========
    
    @staticmethod
    def get_stages() -> tuple[List[dict], int]:
        """Obtiene todas las etapas"""
        try:
            stages = supabase_client.select('stages', select='id,name,"order",color')
            stages_sorted = sorted(stages, key=lambda x: x.get('order', 0))
            return stages_sorted, 200
        except Exception as e:
            return [{'error': str(e)}], 500
    
    # ========== PROJECT STAGES (Kanban) ==========
    
    @staticmethod
    def _assign_to_stage(project_id: str, stage_id: str, user_token: str = None):
        """Asigna un proyecto a una etapa"""
        ps_id = ProjectStage.generate_id()
        ps_data = {
            'id': ps_id,
            'project_id': project_id,
            'stage_id': stage_id,
            'position': 0
        }
        supabase_client.insert('project_stages', ps_data, user_token=user_token)
    
    @staticmethod
    def get_kanban(user_id: str, user_token: str = None) -> tuple[List[dict], int]:
        """Obtiene el tablero Kanban con proyectos en cada etapa"""
        try:
            # Obtener etapas
            stages = supabase_client.select('stages', select='id,name,"order",color', user_token=user_token)
            stages_sorted = sorted(stages, key=lambda x: x.get('order', 0))
            
            # Obtener proyectos del usuario
            projects = supabase_client.select(
                'projects',
                {'user_id': user_id},
                'id,name,description',
                user_token=user_token
            )
            
            # Obtener asignaciones de proyectos a etapas
            project_ids = [p['id'] for p in projects]
            
            if not project_ids:
                # No hay proyectos, retornar etapas vacías
                return [{'stage': s, 'projects': []} for s in stages_sorted], 200
            
            # Obtener project_stages para los proyectos del usuario
            # Como Supabase no permite IN con arrays en la URL easily, usamos workaround
            all_ps = supabase_client.select('project_stages', select='id,project_id,stage_id,position', user_token=user_token)
            
            # Filtrar solo los proyectos del usuario
            project_id_set = set(project_ids)
            user_ps = [ps for ps in all_ps if ps.get('project_id') in project_id_set]
            
            # Agrupar por etapa
            kanban = []
            for stage in stages_sorted:
                stage_id = stage['id']
                stage_projects = []
                
                for ps in user_ps:
                    if ps.get('stage_id') == stage_id:
                        # Encontrar el proyecto
                        for proj in projects:
                            if proj['id'] == ps.get('project_id'):
                                stage_projects.append({
                                    'id': ps['id'],
                                    'project_id': proj['id'],
                                    'name': proj['name'],
                                    'description': proj.get('description', ''),
                                    'position': ps.get('position', 0)
                                })
                                break
                
                # Ordenar por posición
                stage_projects.sort(key=lambda x: x['position'])
                
                kanban.append({
                    'stage': stage,
                    'projects': stage_projects
                })
            
            return kanban, 200
        except Exception as e:
            return [{'error': str(e)}], 500
    
    @staticmethod
    def move_project(project_id: str, new_stage_id: str, user_id: str, user_token: str = None) -> tuple[dict, int]:
        """Mueve un proyecto a otra etapa"""
        try:
            # Verificar propiedad del proyecto
            project, status = ProjectController.get_by_id(project_id, user_id, user_token)
            if status != 200:
                return project, status
            
            # Buscar y actualizar el project_stage
            all_ps = supabase_client.select('project_stages', {'project_id': project_id}, user_token=user_token)
            
            if all_ps and len(all_ps) > 0:
                ps = all_ps[0]
                supabase_client.update(
                    'project_stages',
                    {'id': ps['id']},
                    {'stage_id': new_stage_id},
                    user_token=user_token
                )
            
            return {'message': 'Proyecto movido'}, 200
        except Exception as e:
            return {'error': str(e)}, 500
