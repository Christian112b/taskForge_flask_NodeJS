from dataclasses import dataclass
from typing import Optional, List
import secrets


@dataclass
class Project:
    """Modelo de Proyecto"""
    id: str
    name: str
    description: Optional[str]
    user_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'user_id': self.user_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @staticmethod
    def generate_id() -> str:
        return f"proj_{secrets.token_urlsafe(12)}"


@dataclass
class Stage:
    """Modelo de Etapa"""
    id: str
    name: str
    order: int
    color: str

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'order': self.order,
            'color': self.color
        }


@dataclass
class ProjectStage:
    """Modelo de Proyecto en una Etapa"""
    id: str
    project_id: str
    stage_id: str
    position: int
    created_at: Optional[str] = None
    
    # Datos relacionados (para joins)
    project: Optional[Project] = None
    stage: Optional[Stage] = None

    def to_dict(self) -> dict:
        result = {
            'id': self.id,
            'project_id': self.project_id,
            'stage_id': self.stage_id,
            'position': self.position,
            'created_at': self.created_at
        }
        if self.project:
            result['project'] = self.project.to_dict()
        if self.stage:
            result['stage'] = self.stage.to_dict()
        return result

    @staticmethod
    def generate_id() -> str:
        return f"ps_{secrets.token_urlsafe(12)}"


class ProjectSchema:
    """Schema para validar datos de proyecto"""
    
    @staticmethod
    def validate_create(data: dict) -> tuple[bool, str]:
        name = data.get('name', '').strip()
        
        if not name:
            return False, "El nombre del proyecto es requerido"
        
        if len(name) < 3:
            return False, "El nombre debe tener al menos 3 caracteres"
        
        return True, ""
    
    @staticmethod
    def validate_update(data: dict) -> tuple[bool, str]:
        if 'name' in data:
            name = data.get('name', '').strip()
            if len(name) < 3:
                return False, "El nombre debe tener al menos 3 caracteres"
        
        return True, ""
