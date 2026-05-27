# Subtask Views
from fastapi import APIRouter

from flask import Blueprint, request, jsonify
from middleware.auth_middleware import jwt_required
from controllers import subtask_controller
from models.subtask import SubtaskCreate, SubtaskUpdate

router = APIRouter(
    prefix="/api/subtasks",
    tags=["subtasks"]
)

@router.get('/project/<project_id>')
@jwt_required
def get_subtasks(project_id):
    """Obtener todas las subtareas de un proyecto"""
    user_id = getattr(request, 'user_id', None)
    subtasks = subtask_controller.get_subtasks_by_project(project_id, user_id)
    return jsonify(subtasks)

@router.post('')
@jwt_required
def create_subtask():
    """Crear una nueva subtarea"""
    user_id = getattr(request, 'user_id', None)
    data = request.get_json()
    
    # Validar datos requeridos
    if not data or not data.get('name') or not data.get('project_id'):
        return jsonify({'error': 'name y project_id son requeridos'}), 400
    
    subtask = SubtaskCreate(
        name=data['name'],
        status=data.get('status', 'todo'),
        project_id=data['project_id'],
        description=data.get('description'),
        category_id=data.get('category_id')
    )
    
    result = subtask_controller.create_subtask(subtask, user_id)
    
    if result:
        return jsonify(result), 201
    return jsonify({'error': 'Error al crear subtarea'}), 500

@router.put('/<subtask_id>')
@jwt_required
def update_subtask(subtask_id):
    """Actualizar una subtarea"""
    user_id = getattr(request, 'user_id', None)
    data = request.get_json()
    
    subtask = SubtaskUpdate(
        name=data.get('name'),
        status=data.get('status'),
        description=data.get('description'),
        category_id=data.get('category_id')
    )
    
    result = subtask_controller.update_subtask(subtask_id, subtask, user_id)
    
    if result:
        return jsonify(result)
    return jsonify({'error': 'Subtarea no encontrada'}), 404

@router.delete('/<subtask_id>')
@jwt_required
def delete_subtask(subtask_id):
    """Eliminar una subtarea"""
    user_id = getattr(request, 'user_id', None)
    result = subtask_controller.delete_subtask(subtask_id, user_id)
    
    if result:
        return jsonify({'message': 'Subtarea eliminada'})
    return jsonify({'error': 'Subtarea no encontrada'}), 404
