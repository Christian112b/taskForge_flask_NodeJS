# Stage Views
from fastapi import APIRouter

from middleware.auth_middleware import jwt_required
from controllers import stage_controller

router = APIRouter(
    prefix="/api/stages",
    tags=["stages"]
)

@router.get('')

@jwt_required
def get_stages():
    """Obtener todos los stages"""
    stages = stage_controller.get_all_stages()
    return jsonify(stages)
