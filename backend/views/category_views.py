# Category Views
from fastapi import APIRouter

from flask import Blueprint, request, jsonify
from middleware.auth_middleware import jwt_required
from controllers import category_controller
from models.category import CategoryCreate, CategoryUpdate

router = APIRouter(
    prefix="/api/categories",
    tags=["categories"]
)

@router.get('')
@jwt_required
def get_categories():
    """Obtener todas las categorías"""
    user_id = getattr(request, 'user_id', None)
    categories = category_controller.get_categories(user_id)
    return jsonify(categories)

@router.get('/<category_id>')
@jwt_required
def get_category(category_id):
    """Obtener una categoría por ID"""
    user_id = getattr(request, 'user_id', None)
    category = category_controller.get_category(category_id, user_id)
    if category:
        return jsonify(category)
    return jsonify({'error': 'Categoría no encontrada'}), 404

@router.post('')
@jwt_required
def create_category():
    """Crear una nueva categoría"""
    user_id = getattr(request, 'user_id', None)
    data = request.get_json()
    
    # Validar datos requeridos
    if not data or not data.get('name'):
        return jsonify({'error': 'name es requerido'}), 400
    
    category = CategoryCreate(
        name=data['name'],
        color=data.get('color', '#6b7280'),
        icon=data.get('icon')
    )
    
    result = category_controller.create_category(category, user_id)
    
    if result:
        return jsonify(result), 201
    return jsonify({'error': 'Error al crear categoría'}), 500

@router.put('/<category_id>')
@jwt_required
def update_category(category_id):
    """Actualizar una categoría"""
    user_id = getattr(request, 'user_id', None)
    data = request.get_json()
    
    category = CategoryUpdate(
        name=data.get('name'),
        color=data.get('color'),
        icon=data.get('icon')
    )
    
    result = category_controller.update_category(category_id, category, user_id)
    
    if result:
        return jsonify(result)
    return jsonify({'error': 'Categoría no encontrada'}), 404

@router.delete('/<category_id>')
@jwt_required
def delete_category(category_id):
    """Eliminar una categoría"""
    user_id = getattr(request, 'user_id', None)
    result = category_controller.delete_category(category_id, user_id)
    
    if result:
        return jsonify({'message': 'Categoría eliminada'})
    return jsonify({'error': 'Categoría no encontrada'}), 404
