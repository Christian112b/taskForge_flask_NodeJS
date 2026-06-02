# Project Stage Views
from fastapi import APIRouter

from middleware.auth_middleware import jwt_required
from controllers import project_stage_controller
from models.project_stage import ProjectStageCreate, ProjectStageUpdate

router = APIRouter(
    prefix="/api/project-stages",
    tags=["project_stages"]
)

@router.get('/project/<project_id>')
@jwt_required
def get_project_stages(project_id):
    """Obtener todas las etapas de un proyecto"""
    user_id = getattr(request, 'user_id', None)
    stages = project_stage_controller.get_project_stages(project_id, user_id)
    return jsonify(stages)

@router.post('/project/<project_id>')
@jwt_required
def create_project_stage(project_id):
    """Crear una nueva etapa de proyecto"""
    user_id = getattr(request, 'user_id', None)
    data = request.get_json()
    
    # Validar datos requeridos
    if not data or not data.get('stage_id') or not data.get('stage_name'):
        return jsonify({'error': 'stage_id y stage_name son requeridos'}), 400
    
    project_stage = ProjectStageCreate(
        project_id=project_id,
        stage_id=data['stage_id'],
        stage_name=data['stage_name'],
        stage_color=data.get('stage_color', '#6b7280'),
        stage_order=data.get('stage_order', 0)
    )
    
    result = project_stage_controller.create_project_stage(project_stage, user_id)
    
    if result:
        return jsonify(result), 201
    return jsonify({'error': 'Error al crear etapa de proyecto'}), 500

@router.put('/<project_stage_id>')
@jwt_required
def update_project_stage(project_stage_id):
    """Actualizar una etapa de proyecto"""
    user_id = getattr(request, 'user_id', None)
    data = request.get_json()
    
    project_stage = ProjectStageUpdate(
        stage_name=data.get('stage_name'),
        stage_color=data.get('stage_color'),
        stage_order=data.get('stage_order')
    )
    
    result = project_stage_controller.update_project_stage(project_stage_id, project_stage, user_id)
    
    if result:
        return jsonify(result)
    return jsonify({'error': 'Etapa de proyecto no encontrada'}), 404

@router.delete('/<project_stage_id>')
@jwt_required
def delete_project_stage(project_stage_id):
    """Eliminar una etapa de proyecto"""
    user_id = getattr(request, 'user_id', None)
    result = project_stage_controller.delete_project_stage(project_stage_id, user_id)
    
    if result:
        return jsonify({'message': 'Etapa de proyecto eliminada'})
    return jsonify({'error': 'Etapa de proyecto no encontrada'}), 404

@router.post('/project/<project_id>/initialize')
@jwt_required
def initialize_project_stages(project_id):
    """Inicializar etapas por defecto para un proyecto"""
    user_id = getattr(request, 'user_id', None)
    stages = project_stage_controller.initialize_project_stages(project_id, user_id)
    return jsonify(stages)
