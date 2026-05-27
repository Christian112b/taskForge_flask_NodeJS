from fastapi import APIRouter

from flask import Blueprint, request, jsonify
from middleware.auth_middleware import jwt_required
from controllers.project_controller import ProjectController

# Blueprint para proyectos
projects_bp = Blueprint('projects', __name__, url_prefix='/api/projects')

router = APIRouter(
    prefix="/api/projects",
    tags=["projects"]
)


@router.get('')
@jwt_required
def get_projects():
    """Obtiene todos los proyectos del usuario"""
    user_id = request.user_id
    token = getattr(request, 'token', None)
    projects, status_code = ProjectController.get_all(user_id, token)
    return jsonify(projects), status_code


@router.post('')
@jwt_required
def create_project():

    """Crea un nuevo proyecto"""
    user_id = request.user_id
    token = getattr(request, 'token', None)
    data = request.get_json()

    response, status_code = ProjectController.create(data, user_id, token)


    return jsonify(response), status_code


@router.get('/<project_id>')
@jwt_required
def get_project(project_id):
    """Obtiene un proyecto por ID"""
    user_id = request.user_id
    token = getattr(request, 'token', None)
    response, status_code = ProjectController.get_by_id(project_id, user_id, token)
    return jsonify(response), status_code


@router.put('/<project_id>')
@jwt_required
def update_project(project_id):
    """Actualiza un proyecto"""

    user_id = request.user_id
    token = getattr(request, 'token', None)
    data = request.get_json()
    response, status_code = ProjectController.update(project_id, data, user_id, token)
    return jsonify(response), status_code


@router.delete('/<project_id>')
@jwt_required
def delete_project(project_id):
    """Elimina un proyecto"""
    user_id = request.user_id
    token = getattr(request, 'token', None)
    response, status_code = ProjectController.delete(project_id, user_id, token)
    return jsonify(response), status_code


# ========== ETAPAS ==========

@router.get('/stages')
@jwt_required
def get_stages():
    """Obtiene todas las etapas"""
    stages, status_code = ProjectController.get_stages()
    return jsonify(stages), status_code


# ========== KANBAN ==========

@router.get('/kanban')
@jwt_required
def get_kanban():
    """Obtiene el tablero Kanban"""
    user_id = request.user_id
    token = getattr(request, 'token', None)

    kanban, status_code = ProjectController.get_kanban(user_id, token)

    return jsonify(kanban), status_code


@router.put('/<project_id>/move')
@jwt_required
def move_project(project_id):
    """Mueve un proyecto a otra etapa"""

    user_id = request.user_id
    token = getattr(request, 'token', None)
    data = request.get_json()
    new_stage_id = data.get('stage_id')
    
    if not new_stage_id:
        return jsonify({'error': 'stage_id es requerido'}), 400
    
    response, status_code = ProjectController.move_project(project_id, new_stage_id, user_id, token)
    
    return jsonify(response), status_code


# ========== ENDPOINT UNIFICADO ==========

@router.get('/<project_id>/full')
@jwt_required
def get_project_full(project_id):
    """Obtiene un proyecto con sus etapas, tareas y categorías en una sola llamada"""
    user_id = request.user_id
    token = getattr(request, 'token', None)
    
    response, status_code = ProjectController.get_project_full(project_id, user_id, token)
    
    return jsonify(response), status_code
