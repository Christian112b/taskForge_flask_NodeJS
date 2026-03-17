import { useState, useEffect, useRef, type JSX, Fragment } from 'react'
import { createPortal } from 'react-dom'
import ConnectionStatus from '../../components/ConnectionStatus'
import {
  DndContext,
  closestCenter,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { projectsApi } from '../../lib/projectsApi'
import { subtasksApi } from '../../lib/subtasksApi'
import { projectStagesApi } from '../../lib/projectStagesApi'
import { categoriesApi, type Category } from '../../lib/categoriesApi'
import { validateTaskName, validateTaskDescription, sanitizeInput, MAX_TASK_NAME_LENGTH, MAX_TASK_DESCRIPTION_LENGTH } from '../../lib/validation'
import './ProjectsPage.css'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBug, faPencil, faStar, faArrowTrendUp, faBook, faTrash, faFile } from '@fortawesome/free-solid-svg-icons'

// Icon mapping for categories
function getCategoryIcon(categoryName: string, icon?: string): JSX.Element {
  const iconMap: Record<string, JSX.Element> = {
    Bug: <FontAwesomeIcon icon={faBug} />,
    bug: <FontAwesomeIcon icon={faBug} />,
    Documentacion: <FontAwesomeIcon icon={faFile} />,
    Documentación: <FontAwesomeIcon icon={faFile} />,
    Documentation: <FontAwesomeIcon icon={faFile} />,
    documentacion: <FontAwesomeIcon icon={faFile} />,
    documentation: <FontAwesomeIcon icon={faFile} />,
    Feature: <FontAwesomeIcon icon={faStar} />,
    feature: <FontAwesomeIcon icon={faStar} />,
    Caracteristica: <FontAwesomeIcon icon={faStar} />,
    Característica: <FontAwesomeIcon icon={faStar} />,
    Improvement: <FontAwesomeIcon icon={faArrowTrendUp} />,
    improvement: <FontAwesomeIcon icon={faArrowTrendUp} />,
    Mejora: <FontAwesomeIcon icon={faArrowTrendUp} />,
    mejora: <FontAwesomeIcon icon={faArrowTrendUp} />,
    Aprendizaje: <FontAwesomeIcon icon={faBook} />,
    aprendizaje: <FontAwesomeIcon icon={faBook} />,
    Learning: <FontAwesomeIcon icon={faBook} />,
    learning: <FontAwesomeIcon icon={faBook} />,
    Default: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
  }

  // Use the icon field if provided, otherwise fallback to name mapping
  const key = icon || categoryName
  return iconMap[key] || iconMap[categoryName] || iconMap.Default
}

// Colores predefinidos para etapas
const STAGE_COLORS = [
  '#6b7280', // gray
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
]

interface Stage {
  id: string
  stage_id: string
  stage_name: string
  stage_color: string
  stage_order: number
}

// Componente para cada etapa en el formulario de etapas (con drag and drop)
interface SortableStageItemProps {
  id: number
  stage: { stage_name: string; stage_color: string; stage_order: number }
  index: number
  newStages: { stage_name: string; stage_color: string; stage_order: number }[]
  setNewStages: React.Dispatch<React.SetStateAction<{ stage_name: string; stage_color: string; stage_order: number }[]>>
  showColorPicker: number | null
  setShowColorPicker: React.Dispatch<React.SetStateAction<number | null>>
}

function SortableStageItem({ id, stage, index, newStages, setNewStages, showColorPicker, setShowColorPicker }: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : 'none',
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <div 
      ref={setNodeRef} 
      style={{...style, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: stage.stage_color + '20', borderLeft: `4px solid ${stage.stage_color}`, padding: '4px 8px', borderRadius: '4px' }}
      className="stage-item-form" 
      {...attributes}
    >
      <div 
        className="stage-drag-handle" 
        style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
        {...listeners}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>
      <input
        type="text"
        value={stage.stage_name}
        onChange={(e) => {
          if (e.target.value.length <= 50) {
            const updated = [...newStages]
            updated[index] = { ...updated[index], stage_name: e.target.value }
            setNewStages(updated)
          }
        }}
        className="stage-name-input"
        placeholder="Nombre de la etapa"
        maxLength={50}
        style={{ flex: 1, minWidth: '80px', maxWidth: '200px', padding: '0.25rem 0.5rem', fontSize: '0.9rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#2a3441', color: '#e2e8f0' }}
      />
      <div className="stage-color-picker" style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
        {STAGE_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => {
              const updated = [...newStages]
              updated[index] = { ...updated[index], stage_color: color }
              setNewStages(updated)
            }}
            style={{ 
              width: '18px', 
              height: '18px', 
              borderRadius: '3px', 
              backgroundColor: color,
              border: stage.stage_color === color ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              padding: 0,
              opacity: stage.stage_color === color ? 1 : 0.6,
              transition: 'opacity 0.2s',
              flexShrink: 0
            }}
          />
        ))}
      </div>
      {newStages.length > 1 && (
        <button
          className="stage-remove-btn"
          onClick={() => {
            const updated = newStages.filter((_, i) => i !== index).map((s, i) => ({ ...s, stage_order: i }))
            setNewStages(updated)
          }}
          title="Eliminar etapa"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

interface Task {
  id: string
  project_id: string
  name: string
  status: string
  description?: string
  category_id?: string
}

interface Project {
  id: string
  project_id: string
  name: string
  description: string
  created_at?: string
  deadline?: string
  icon?: string
}

interface ProjectWithTasks extends Project {
  tasks: Task[]
  stages: Stage[]
}

// Modal para crear proyecto
interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, description: string, deadline: string, icon: string) => Promise<void>
}

function CreateProjectModal({ isOpen, onClose, onSubmit }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectDeadline, setProjectDeadline] = useState('')
  const [projectIcon, setProjectIcon] = useState('folder')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim()) {
      setError('El nombre del proyecto es requerido')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onSubmit(projectName, projectDescription, projectDeadline, projectIcon)
      setProjectName('')
      setProjectDescription('')
      setProjectDeadline('')
      setProjectIcon('folder')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear proyecto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Crear Nuevo Proyecto</h2>
          <button className="modal__close" onClick={onClose} disabled={loading}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal__content">
          {error && <p className="modal__error">{error}</p>}
          
          <div className="form-group">
            <label>Nombre del Proyecto</label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="Mi Proyecto"
              className="form-input"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Descripción (opcional)</label>
            <textarea
              value={projectDescription}
              onChange={e => setProjectDescription(e.target.value)}
              placeholder="Descripción del proyecto"
              className="form-input"
              rows={2}
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha Límite (opcional)</label>
              <input
                type="date"
                value={projectDeadline}
                onChange={e => setProjectDeadline(e.target.value)}
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Icono</label>
              <select
                value={projectIcon}
                onChange={e => setProjectIcon(e.target.value)}
                className="form-input"
                disabled={loading}
              >
                <option value="folder">Carpeta</option>
                <option value="briefcase">Maleta</option>
                <option value="code">Código</option>
                <option value="rocket">Cohete</option>
                <option value="heart">Corazón</option>
                <option value="star">Estrella</option>
                <option value="target">Objetivo</option>
                <option value="lightbulb">Idea</option>
              </select>
            </div>
          </div>

          <div className="modal__actions">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="loading-spinner loading-spinner--small"></span> Creando...</> : 'Crear Proyecto'}
            </button>
          </div>
        </form>
        
        {loading && (
          <div className="modal__loading-overlay">
            <div className="loading-spinner loading-spinner--large"></div>
            <span>Creando proyecto...</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Modal para agregar etapas con drag-and-drop
interface AddStageModalProps {
  isOpen: boolean
  onClose: () => void
  stages: { stage_name: string; stage_color: string; stage_order: number }[]
  setStages: React.Dispatch<React.SetStateAction<{ stage_name: string; stage_color: string; stage_order: number }[]>>
  onSave: () => void
}

function AddStageModal({ isOpen, onClose, stages, setStages, onSave }: AddStageModalProps) {
  const addNewStage = () => {
    const newOrder = stages.length
    setStages([
      ...stages,
      { stage_name: 'Nueva etapa', stage_color: STAGE_COLORS[newOrder % STAGE_COLORS.length], stage_order: newOrder }
    ])
  }

  const removeNewStage = (index: number) => {
    if (stages.length <= 1) return
    const updated = stages.filter((_, i) => i !== index).map((s, i) => ({ ...s, stage_order: i }))
    setStages(updated)
  }

  const updateNewStage = (index: number, field: 'stage_name' | 'stage_color', value: string) => {
    const updated = [...stages]
    updated[index] = { ...updated[index], [field]: value }
    setStages(updated)
  }

  if (!isOpen) {
    console.log('Modal cerrado')
    return null
  }

  console.log('Modal ABIERTO, renderizando con Portal...')

  const modalContent = (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999, position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', zIndex: 10000, position: 'relative', margin: 'auto' }}>
        <div className="modal__header">
          <h2>Agregar Etapas</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__content">
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            Define las etapas de tu flujo de trabajo arrastrando para reordenar.
          </p>
          
          <div className="stages-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {stages.map((stage, index) => (
              <div key={index} className="stage-item-form" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <div className="stage-drag-handle" style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="6" r="1.5" />
                    <circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" />
                    <circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" />
                    <circle cx="15" cy="18" r="1.5" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={stage.stage_name}
                  onChange={(e) => updateNewStage(index, 'stage_name', e.target.value)}
                  className="stage-name-input"
                  placeholder="Nombre de la etapa"
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
                <div className="stage-color-picker" style={{ display: 'flex', gap: '4px' }}>
                  {STAGE_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`color-option ${stage.stage_color === color ? 'selected' : ''}`}
                      style={{ 
                        backgroundColor: color, 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        border: stage.stage_color === color ? '3px solid white' : '2px solid transparent',
                        cursor: 'pointer',
                        boxShadow: stage.stage_color === color ? '0 0 0 2px var(--primary-color)' : 'none'
                      }}
                      onClick={() => updateNewStage(index, 'stage_color', color)}
                    />
                  ))}
                </div>
                {stages.length > 1 && (
                  <button
                    className="stage-remove-btn"
                    onClick={() => removeNewStage(index)}
                    title="Eliminar etapa"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button 
            type="button"
            onClick={addNewStage}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Agregar etapa
          </button>
        </div>
        
        <div className="modal__actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="button" onClick={onSave} className="btn btn-primary" style={{ background: '#f97316', borderColor: '#f97316' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17,21 17,13 7,13 7,21" />
              <polyline points="7,3 7,8 15,8" />
            </svg>
            Guardar Etapas
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

interface TaskCardProps {
  task: Task
  onDelete: (taskId: string) => void
  onEdit?: (task: Task) => void
  stageColor?: string
  category?: Category
}

function SortableTaskCard({ task, onDelete, onEdit, stageColor, category }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const cardStyle = category 
    ? { ...style, borderColor: category.color, '--task-category-color': category.color } as React.CSSProperties
    : style

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      {...attributes}
      {...listeners}
      className="task-card"
    >
      <div className="task-card__header">
        <span 
          className="task-card__icon" 
          style={{ backgroundColor: category?.color || '#6b7280' }}
        >
          {category ? getCategoryIcon(category.name, category.icon) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
          )}
        </span>
        <span 
          className="task-card__title-container"
          style={category ? { borderColor: category.color } : {}}
        >
          <span className="task-card__title">{task.name}</span>
        </span>
      </div>
      {task.description && (
        <span className="task-card__description">{task.description}</span>
      )}
      {onEdit && (
        <button 
          className="task-card__edit"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(task)
          }}
          title="Editar tarea"
        >
          <FontAwesomeIcon icon={faPencil} />
        </button>
      )}
      <button 
        className="task-card__delete"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(task.id)
        }}
        title="Eliminar tarea"
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </div>
  )
}

interface KanbanColumnProps {
  stage: Stage
  tasks: Task[]
  categories: Category[]
  onDeleteTask: (taskId: string) => void
  onEditTask?: (task: Task) => void
  onUpdateTask?: (taskId: string, data: { name?: string; description?: string; category_id?: string }) => void
  onAddTask: (stageId: string, taskName: string, description?: string, categoryId?: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: (collapsed: boolean) => void
  index?: number
  // Global editing state from parent
  editingTaskId?: string | null
  onSetEditingTaskId?: (taskId: string | null) => void
  showAddForm?: boolean
  onSetShowAddForm?: (show: boolean) => void
}

function KanbanColumn({ stage, tasks, categories, onDeleteTask, onEditTask, onUpdateTask, onAddTask, isCollapsed: externalIsCollapsed, onToggleCollapse, index, editingTaskId, onSetEditingTaskId, showAddForm, onSetShowAddForm }: KanbanColumnProps) {
  const [newTask, setNewTask] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('')
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false)
  
  // Edit form state - local state for form inputs
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  
  // Form validation errors
  const [nameError, setNameError] = useState<string | null>(null)
  const [descriptionError, setDescriptionError] = useState<string | null>(null)

  // Use external state from parent if available
  const editingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) || null : null
  const isFormVisible = showAddForm === true

  // Use external state if provided, otherwise use internal state
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed
  const setIsCollapsed = (collapsed: boolean) => {
    if (onToggleCollapse) {
      onToggleCollapse(collapsed)
    } else {
      setInternalIsCollapsed(collapsed)
    }
  }
  
  const { setNodeRef } = useDroppable({
    id: stage.stage_id,
  })

  const getCategoryById = (categoryId?: string) => {
    return categories.find(c => c.id === categoryId)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate input
    const nameResult = validateTaskName(newTask)
    const descResult = validateTaskDescription(newDescription)
    
    if (nameResult.error) {
      setNameError(nameResult.error)
      return
    }
    
    if (descResult.error) {
      setDescriptionError(descResult.error)
      return
    }
    
    // Clear errors and submit
    setNameError(null)
    setDescriptionError(null)
    
    // Sanitize inputs before sending
    const sanitizedName = sanitizeInput(nameResult.value)
    const sanitizedDesc = descResult.value ? sanitizeInput(descResult.value) : undefined
    
    onAddTask(stage.stage_id, sanitizedName, sanitizedDesc, newCategoryId || undefined)
    setNewTask('')
    setNewDescription('')
    setNewCategoryId('')
    onSetShowAddForm?.(false)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingTask) return
    
    // Validate input
    const nameResult = validateTaskName(editName)
    const descResult = validateTaskDescription(editDescription)
    
    if (nameResult.error) {
      setNameError(nameResult.error)
      return
    }
    
    if (descResult.error) {
      setDescriptionError(descResult.error)
      return
    }
    
    // Clear errors and submit
    setNameError(null)
    setDescriptionError(null)
    
    // Sanitize inputs before sending
    const sanitizedName = sanitizeInput(nameResult.value)
    const sanitizedDesc = descResult.value ? sanitizeInput(descResult.value) : undefined
    
    onUpdateTask?.(editingTask.id, {
      name: sanitizedName,
      description: sanitizedDesc,
      category_id: editCategoryId || undefined
    })
    onSetEditingTaskId?.(null)
    setEditName('')
    setEditDescription('')
    setEditCategoryId('')
  }

  const openEditForm = (task: Task) => {
    // Close add form if open
    onSetShowAddForm?.(false)
    // Clear previous errors
    setNameError(null)
    setDescriptionError(null)
    // If clicking on the same task that's already being edited, close it
    if (editingTaskId === task.id) {
      onSetEditingTaskId?.(null)
      return
    }
    // Otherwise, open the edit form for the new task
    onSetEditingTaskId?.(task.id)
    setEditName(task.name)
    setEditDescription(task.description || '')
    setEditCategoryId(task.category_id || '')
  }

  // Close edit and add forms when column is collapsed
  useEffect(() => {
    if (isCollapsed) {
      onSetEditingTaskId?.(null)
      onSetShowAddForm?.(false)
    }
  }, [isCollapsed])

  return (
    <div className={`kanban-column ${isCollapsed ? 'kanban-column--collapsed' : ''}`} ref={setNodeRef}>
      <div 
        className="kanban-column__header"
        style={{ 
          borderTopColor: stage.stage_color,
          backgroundColor: stage.stage_color 
        }}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="collapse-btn"
          title={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
        <h3 className="kanban-column__title">{stage.stage_name}</h3>
        <span className="kanban-column__count">{tasks.length}</span>
      </div>
      <div className="kanban-column__content">
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <Fragment key={task.id}>
              {editingTask?.id === task.id ? (
                <form 
                  onSubmit={handleEditSubmit} 
                  className="task-form task-form--inline" 
                  style={{ 
                    borderColor: getCategoryById(task.category_id)?.color || '#6b7280',
                    '--task-category-color': getCategoryById(task.category_id)?.color || '#6b7280'
                  } as React.CSSProperties}
                >
                  <div className="task-card__header">
                    <span className="task-card__icon" style={{ backgroundColor: getCategoryById(task.category_id)?.color || '#6b7280' }}>
                      {getCategoryById(task.category_id) ? getCategoryIcon(getCategoryById(task.category_id)?.name || '', getCategoryById(task.category_id)?.icon || '') : (
                        <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                      )}
                    </span>
                    <span className="task-card__title-container" style={{ borderColor: getCategoryById(task.category_id)?.color || '#6b7280' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => {
                          setEditName(e.target.value)
                          if (nameError) setNameError(null)
                        }}
                        placeholder="Nombre de tarea"
                        maxLength={MAX_TASK_NAME_LENGTH}
                        autoFocus
                        className="task-card__title"
                        style={{ background: 'transparent', border: 'none', flex: 1, padding: 0, width: '100%' }}
                      />
                      {nameError && (
                        <span style={{ color: '#ef4444', fontSize: '12px', marginLeft: '8px' }}>{nameError}</span>
                      )}
                    </span>
                  </div>
                  <span className="task-card__description">
                    <textarea
                      value={editDescription}
                      onChange={(e) => {
                        setEditDescription(e.target.value)
                        if (descriptionError) setDescriptionError(null)
                      }}
                      placeholder="Descripción (opcional)"
                      maxLength={MAX_TASK_DESCRIPTION_LENGTH}
                      style={{ 
                        width: '100%', 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#9ca3af',
                        fontSize: '0.75rem',
                        resize: 'none',
                        outline: 'none'
                      }}
                    />
                    {descriptionError && (
                      <span style={{ color: '#ef4444', fontSize: '12px', marginLeft: '8px' }}>{descriptionError}</span>
                    )}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', borderTop: '1px solid #3d3d3d', gap: '0.5rem' }}>
                    {categories.length > 0 && (
                      <div className="task-form-category-select">
                        <div
                          className={`task-form-category-select__trigger ${!editCategoryId ? 'task-form-category-select__trigger--empty' : ''}`}
                          onClick={() => {
                            const select = document.getElementById('edit-task-category-select');
                            if (select) (select as HTMLSelectElement).click();
                          }}
                        >
                          {editCategoryId && getCategoryById(editCategoryId) ? (
                            <>
                              <span className="task-form-category-select__icon" style={{ backgroundColor: getCategoryById(editCategoryId)?.color }}>
                                {getCategoryIcon(getCategoryById(editCategoryId)?.name || '', getCategoryById(editCategoryId)?.icon)}
                              </span>
                              <span style={{ flex: 1 }}>{getCategoryById(editCategoryId)?.name}</span>
                            </>
                          ) : (
                            <span style={{ flex: 1 }}>Sin categoría</span>
                          )}
                          <span className="task-form-category-select__arrow">▼</span>
                        </div>
                        <select
                          id="edit-task-category-select"
                          value={editCategoryId}
                          onChange={(e) => setEditCategoryId(e.target.value)}
                          className="task-form-category-select__hidden"
                        >
                          <option value="">Sin categoría</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.25rem', marginLeft: 'auto' }}>
                      <button 
                        type="submit" 
                        className="task-card__edit"
                        style={{ position: 'relative', top: 'auto', right: 'auto', width: '24px', height: '24px' }}
                        title="Guardar"
                      >✓</button>
                      <button 
                        type="button" 
                        onClick={() => onSetEditingTaskId?.(null)} 
                        className="task-card__delete"
                        style={{ position: 'relative', top: 'auto', right: 'auto', width: '24px', height: '24px' }}
                        title="Cancelar"
                      >×</button>
                    </div>
                  </div>
                </form>
              ) : (
                <SortableTaskCard
                  task={task}
                  stageColor={stage.stage_color}
                  category={getCategoryById(task.category_id)}
                  onDelete={onDeleteTask}
                  onEdit={openEditForm}
                />
              )}
            </Fragment>
          ))}
        </SortableContext>
        
        {isFormVisible ? (
          <form onSubmit={handleSubmit} className="task-form task-form--inline" style={{ borderColor: getCategoryById(newCategoryId)?.color || '#6b7280', '--task-category-color': getCategoryById(newCategoryId)?.color || '#6b7280' } as React.CSSProperties}>
            <div className="task-card__header" style={{ backgroundColor: getCategoryById(newCategoryId)?.color || '#6b7280' }}>
              <span className="task-card__icon" style={{ backgroundColor: getCategoryById(newCategoryId)?.color || '#6b7280' }}>
                {newCategoryId && getCategoryById(newCategoryId) ? getCategoryIcon(getCategoryById(newCategoryId)?.name || '', getCategoryById(newCategoryId)?.icon || '') : (
                  <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                )}
              </span>
              <span className="task-card__title-container" style={{ borderColor: getCategoryById(newCategoryId)?.color || '#6b7280' }}>
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => {
                    setNewTask(e.target.value)
                    if (nameError) setNameError(null)
                  }}
                  placeholder="Nombre de tarea"
                  maxLength={MAX_TASK_NAME_LENGTH}
                  autoFocus
                  className="task-card__title"
                  style={{ background: 'transparent', border: 'none', flex: 1, padding: 0, width: '100%' }}
                />
                {nameError && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginLeft: '8px' }}>{nameError}</span>
                )}
              </span>
            </div>
            <span className="task-card__description">
              <textarea
                value={newDescription}
                onChange={(e) => {
                  setNewDescription(e.target.value)
                  if (descriptionError) setDescriptionError(null)
                }}
                placeholder="Descripción (opcional)"
                maxLength={MAX_TASK_DESCRIPTION_LENGTH}
                style={{ 
                  width: '100%', 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#9ca3af',
                  fontSize: '0.75rem',
                  resize: 'none',
                  outline: 'none'
                }}
              />
              {descriptionError && (
                <span style={{ color: '#ef4444', fontSize: '12px', marginLeft: '8px' }}>{descriptionError}</span>
              )}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', borderTop: '1px solid #3d3d3d', gap: '0.5rem' }}>
              {categories.length > 0 && (
                <div className="task-form-category-select">
                  <div
                    className={`task-form-category-select__trigger ${!newCategoryId ? 'task-form-category-select__trigger--empty' : ''}`}
                    onClick={() => {
                      const select = document.getElementById('new-task-category-select');
                      if (select) (select as HTMLSelectElement).click();
                    }}
                  >
                    {newCategoryId && getCategoryById(newCategoryId) ? (
                      <>
                        <span className="task-form-category-select__icon" style={{ backgroundColor: getCategoryById(newCategoryId)?.color }}>
                          {getCategoryIcon(getCategoryById(newCategoryId)?.name || '', getCategoryById(newCategoryId)?.icon)}
                        </span>
                        <span style={{ flex: 1 }}>{getCategoryById(newCategoryId)?.name}</span>
                      </>
                    ) : (
                      <span style={{ flex: 1 }}>Sin categoría</span>
                    )}
                    <span className="task-form-category-select__arrow">▼</span>
                  </div>
                  <select
                    id="new-task-category-select"
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="task-form-category-select__hidden"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.25rem', marginLeft: 'auto' }}>
                <button 
                  type="submit" 
                  className="task-card__edit"
                  style={{ position: 'relative', top: 'auto', right: 'auto', width: '24px', height: '24px' }}
                  title="Agregar"
>+</button>
                <button 
                  type="button" 
                  onClick={() => onSetShowAddForm?.(false)} 
                  className="task-card__delete"
                  style={{ position: 'relative', top: 'auto', right: 'auto', width: '24px', height: '24px' }}
                  title="Cancelar"
>×</button>
              </div>
            </div>
          </form>
        ) : null}
        </div>
        {/* Floating add task button - only show for first stage and when not collapsed */}
        {index === 0 && !isCollapsed && (
          <button 
            onClick={() => {
              onSetEditingTaskId?.(null)  // Close any open edit form
              onSetShowAddForm?.(true)
            }} 
            className="add-task-btn-floating"
            title="Agregar tarea"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        )}
    </div>
  )
}

interface ProjectCardProps {
  project: ProjectWithTasks
  onDelete: (projectId: string) => void
}

function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Global editing state for cross-column form management
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [showAddFormStage, setShowAddFormStage] = useState<string | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  
  // Sensores para drag and drop - configuracion optimizada para movimientos rapidos
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: {
        distance: 1,
        tolerance: 5,
      }
    }),
    useSensor(KeyboardSensor, { 
      coordinateGetter: sortableKeyboardCoordinates 
    })
  )

  // Cargar etapas del proyecto y tareas cuando se expande
  useEffect(() => {
    if (expanded) {
      loadProjectData()
    }
  }, [expanded])

  const loadProjectData = async () => {
    setLoading(true)
    try {
      // Usar endpoint unificado - una sola llamada HTTP
      const data = await projectsApi.getFull(project.project_id)
      
      // Las etapas ya vienen ordenadas del backend
      setStages(data.stages)
      
      // Las tareas
      setTasks(data.tasks)
      
      // Las categorías
      setCategories(data.categories)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Agrupar tareas por estado
  const tasksByStage = stages.map(stage => ({
    stage,
    tasks: tasks.filter(t => t.status === stage.stage_id)
  }))

  const getCategoryById = (categoryId?: string) => {
    return categories.find(c => c.id === categoryId)
  }

  const handleAddTask = async (stageId: string, taskName: string, description?: string, categoryId?: string) => {
    try {
      const created = await subtasksApi.create(project.project_id, taskName, stageId, description, categoryId)
      setTasks([...tasks, created])
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await subtasksApi.delete(taskId)
      setTasks(tasks.filter(t => t.id !== taskId))
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleUpdateTask = async (taskId: string, data: { name?: string; description?: string; category_id?: string }) => {
    try {
      const updated = await subtasksApi.update(taskId, data)
      setTasks(tasks.map(t => t.id === taskId ? updated : t))
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find(t => t.id === activeId)
    if (!activeTask) return

    let newStatus = ''
    
    // Check if dropping over a stage (column)
    const overStage = stages.find(s => s.stage_id === overId)
    if (overStage) {
      newStatus = overStage.stage_id
    } else {
      // Check if dropping over another task
      const overTask = tasks.find(t => t.id === overId)
      if (overTask) {
        newStatus = overTask.status
      }
    }

    // Also check if the droppable container is the stage (for empty columns)
    if (!newStatus && over.id && typeof over.id === 'string') {
      const stageMatch = stages.find(s => s.stage_id === over.id)
      if (stageMatch) {
        newStatus = stageMatch.stage_id
      }
    }

    if (newStatus && newStatus !== activeTask.status) {
      setTasks(prev => prev.map(t => 
        t.id === activeId ? { ...t, status: newStatus } : t
      ))
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string
    const task = tasks.find(t => t.id === activeId)
    setActiveDragTask(task || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragTask(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const task = tasks.find(t => t.id === activeId)
    
    if (task) {
      // Determine final status
      let finalStatus = task.status
      
      // Check if dropped on a stage directly
      const overStage = stages.find(s => s.stage_id === over.id)
      if (overStage) {
        finalStatus = overStage.stage_id
      } else {
        const overTask = tasks.find(t => t.id === over.id)
        if (overTask) {
          finalStatus = overTask.status
        }
      }
      
      // Only update if status changed
      if (finalStatus !== task.status) {
        setTasks(prev => prev.map(t => 
          t.id === activeId ? { ...t, status: finalStatus } : t
        ))
      }
      
      try {
        await subtasksApi.update(task.id, { status: finalStatus })
      } catch (err) {
        console.error('Error:', err)
        loadProjectData()
      }
    }
  }

  return (
    <div className="project-card">
      <div className="project-card__header" onClick={() => setExpanded(!expanded)}>
        <div className="project-card__title-row">
          <h3 className="project-card__title">{project.name}</h3>
          <span className="project-card__expand">{expanded ? '▼' : '▶'}</span>
        </div>
        <button 
          className="project-card__delete"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(project.project_id)
          }}
        >
          ×
        </button>
      </div>

      {expanded && (
        <div className="project-card__board">
          {loading ? (
            <p className="project-card__loading">Cargando...</p>
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div style={{ display: 'contents' }}>
                  {tasksByStage.map(({ stage, tasks: stageTasks }, index) => (
                    <KanbanColumn
                      key={stage.stage_id}
                      stage={stage}
                      tasks={stageTasks}
                      categories={categories}
                      onDeleteTask={handleDeleteTask}
                      onAddTask={handleAddTask}
                      index={index}
                      editingTaskId={editingTaskId}
                      onSetEditingTaskId={setEditingTaskId}
                      showAddForm={showAddFormStage === stage.stage_id}
                      onSetShowAddForm={(show) => setShowAddFormStage(show ? stage.stage_id : null)}
                    />
                  ))}
                </div>
                <DragOverlay>
                  {activeDragTask ? (
                    <div 
                      className="task-card task-card--overlay"
                      style={{ 
                        borderColor: getCategoryById(activeDragTask.category_id)?.color || '#6b7280' 
                      }}
                    >
                      <div className="task-card__header">
                        <span 
                          className="task-card__icon" 
                          style={{ backgroundColor: getCategoryById(activeDragTask.category_id)?.color || '#6b7280' }}
                        >
                          {activeDragTask.category_id ? (
                            getCategoryIcon(getCategoryById(activeDragTask.category_id)?.name || '')
                          ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                          )}
                        </span>
                        <span className="task-card__title-container">
                          <span className="task-card__title">{activeDragTask.name}</span>
                        </span>
                      </div>
                      {activeDragTask.description && (
                        <span className="task-card__description">{activeDragTask.description}</span>
                      )}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProjectsPage(): JSX.Element {
  const [projects, setProjects] = useState<ProjectWithTasks[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithTasks | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [projectToEdit, setProjectToEdit] = useState<ProjectWithTasks | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showStageModal, setShowStageModal] = useState(false)
  const [showStageForm, setShowStageForm] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null)
  const [savingStages, setSavingStages] = useState(false)
  
  // Sensores para drag and drop del formulario de etapas
  const stageFormSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  
  const [newStages, setNewStages] = useState<{ stage_name: string; stage_color: string; stage_order: number }[]>([
    { stage_name: 'Por hacer', stage_color: '#6b7280', stage_order: 0 }
  ])

  // Handler para reorder de etapas en el formulario
  const handleStagesReorder = (activeId: number, overId: number) => {
    const oldIndex = activeId
    const newIndex = overId
    
    if (oldIndex === newIndex) return
    
    const updated = [...newStages]
    const [movedItem] = updated.splice(oldIndex, 1)
    updated.splice(newIndex, 0, movedItem)
    
    // Actualizar el orden
    const reordered = updated.map((stage, index) => ({
      ...stage,
      stage_order: index
    }))
    
    setNewStages(reordered)
  }
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedProjectData, setSelectedProjectData] = useState<{
    stages: Stage[];
    tasks: Task[];
    categories: Category[];
  } | null>(null)
  const [loadingProject, setLoadingProject] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'deadline'>('created_at')
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({})

  const toggleAllCollapsed = (collapse: boolean) => {
    if (selectedProjectData) {
      const newCollapsed: Record<string, boolean> = {}
      selectedProjectData.stages.forEach(stage => {
        newCollapsed[stage.stage_id] = collapse
      })
      setCollapsedStages(newCollapsed)
    }
  }

  // Cargar proyectos
  const loadProjects = async () => {
    try {
      setLoading(true)
      const data = await projectsApi.getAll()
      
      // Convertir al formato de proyecto con tareas
      const projectsWithTasks: ProjectWithTasks[] = data.map((p: any) => ({
        id: p.id,
        project_id: p.id,
        name: p.name,
        description: p.description || '',
        created_at: p.created_at,
        deadline: p.deadline,
        icon: p.icon || 'folder',
        tasks: [],
        stages: []
      }))
      
      setProjects(projectsWithTasks)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleCreateProject = async (
    name: string,
    description: string,
    deadline: string,
    icon: string
  ) => {
    try {
      // Crear el proyecto (las etapas se crean dentro del proyecto)
      await projectsApi.create(name, description, deadline, icon)
      
      loadProjects()
      toast.success('Proyecto creado correctamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear')
      toast.error('Error al crear el proyecto')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      await projectsApi.delete(projectId)
      setProjects(projects.filter(p => p.project_id !== projectId))
      toast.success('Proyecto eliminado correctamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
      toast.error('Error al eliminar el proyecto')
    }
  }

  const handleUpdateProject = async (
    projectId: string,
    name: string,
    description: string,
    deadline: string,
    icon: string
  ) => {
    try {
      setIsEditing(true)
      await projectsApi.update(projectId, { name, description, deadline, icon })
      
      // Actualizar la lista de proyectos
      setProjects(projects.map(p => 
        p.project_id === projectId 
          ? { ...p, name, description, deadline, icon }
          : p
      ))
      setProjectToEdit(null)
      toast.success('Proyecto actualizado correctamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar')
      toast.error('Error al actualizar el proyecto')
    } finally {
      setIsEditing(false)
    }
  }

  // Agregar una etapa al proyecto
  const handleAddStage = async (stageName: string, stageColor: string) => {
    if (!selectedProjectId || !stageName.trim()) return
    
    try {
      const stagesCount = selectedProjectData?.stages.length || 0
      await projectStagesApi.create(selectedProjectId, {
        stage_id: `stage_${stagesCount}`,
        stage_name: stageName,
        stage_color: stageColor,
        stage_order: stagesCount
      })
      
      // Recargar los datos del proyecto
      const data = await projectsApi.getFull(selectedProjectId)
      setSelectedProjectData({
        stages: data.stages,
        tasks: data.tasks,
        categories: data.categories
      })
      toast.success('Etapa agregada correctamente')
    } catch (err) {
      toast.error('Error al agregar etapa')
    }
  }

  // Guardar las etapas del proyecto (create o update)
  const handleSaveInitialStages = async () => {
    if (!selectedProjectId || newStages.length === 0) return
    
    try {
      // Si hay etapas existentes, primero las eliminamos en paralelo
      if (selectedProjectData && selectedProjectData.stages.length > 0) {
        await Promise.all(selectedProjectData.stages.map(stage => projectStagesApi.delete(stage.id)))
      }
      
      // Crear las nuevas etapas en paralelo
      await Promise.all(newStages.map((stage, i) => 
        projectStagesApi.create(selectedProjectId, {
          stage_id: `stage_${i}`,
          stage_name: stage.stage_name,
          stage_color: stage.stage_color,
          stage_order: i
        })
      ))
      
      // Recargar los datos del proyecto
      const data = await projectsApi.getFull(selectedProjectId)
      setSelectedProjectData({
        stages: data.stages,
        tasks: data.tasks,
        categories: data.categories
      })
      toast.success('Etapas guardadas correctamente')
    } catch (err) {
      toast.error('Error al guardar las etapas')
    }
  }

  const addNewStage = () => {
    const newOrder = newStages.length
    setNewStages([
      ...newStages,
      { stage_name: 'Nueva etapa', stage_color: STAGE_COLORS[newOrder % STAGE_COLORS.length], stage_order: newOrder }
    ])
  }

  const removeNewStage = (index: number) => {
    if (newStages.length <= 1) return
    const updated = newStages.filter((_, i) => i !== index).map((s, i) => ({ ...s, stage_order: i }))
    setNewStages(updated)
  }

  const updateNewStage = (index: number, field: 'stage_name' | 'stage_color', value: string) => {
    const updated = [...newStages]
    updated[index] = { ...updated[index], [field]: value }
    setNewStages(updated)
  }
  const handleSelectProject = async (projectId: string) => {
    try {
      setSelectedProjectId(projectId)  // Primero cambiar a la vista del proyecto
      setLoadingProject(true)
      const data = await projectsApi.getFull(projectId)
      setSelectedProjectData({
        stages: data.stages,
        tasks: data.tasks,
        categories: data.categories
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proyecto')
      setSelectedProjectId(null)  // Volver a la lista en caso de error
    } finally {
      setLoadingProject(false)
    }
  }

  // Volver a la lista de proyectos
  const handleBackToList = () => {
    setSelectedProjectId(null)
    setSelectedProjectData(null)
  }

  // Handlers para drag and drop del kanban
  const kanbanSensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { 
        distance: 1,
        tolerance: 5,
      } 
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const [kanbanTasks, setKanbanTasks] = useState<Task[]>([])
  const kanbanTasksRef = useRef<Task[]>([])
  const [activeKanbanDragTask, setActiveKanbanDragTask] = useState<Task | null>(null)
  const lastOverTargetRef = useRef<string | null>(null)
  
  // Global editing state - controls which task is being edited across all columns
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [showAddFormStage, setShowAddFormStage] = useState<string | null>(null)
  const draggedTaskOriginalStatusRef = useRef<string | null>(null)

  // Sincronizar tareas cuando se carga el proyecto
  useEffect(() => {
    if (selectedProjectData) {
      setKanbanTasks(selectedProjectData.tasks)
      kanbanTasksRef.current = selectedProjectData.tasks
    }
  }, [selectedProjectData])

  const handleKanbanDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string
    const task = kanbanTasks.find(t => t.id === activeId)
    if (task) {
      setActiveKanbanDragTask(task)
      // Guardar el estado original de la tarea antes de queDragOver lo cambie
      draggedTaskOriginalStatusRef.current = task.status
    }
  }

  const handleKanbanDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    
    // Track the last valid over target (solo guardar, no actualizar estado)
    if (over?.id) {
      lastOverTargetRef.current = over.id as string
    }
  }

  const handleKanbanDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!selectedProjectData) {
      setActiveKanbanDragTask(null)
      lastOverTargetRef.current = null
      return
    }

    const activeId = active.id as string
    const overId = over?.id || lastOverTargetRef.current
    
    if (!overId) {
      setActiveKanbanDragTask(null)
      lastOverTargetRef.current = null
      return
    }

    // Find the task being dragged
    const task = kanbanTasks.find(t => t.id === activeId)
    if (!task) {
      setActiveKanbanDragTask(null)
      lastOverTargetRef.current = null
      return
    }

    // Determine the new status based on where it was dropped
    let newStatus = ''
    
    // First, check if dropped on a stage (column header)
    const overStage = selectedProjectData.stages.find(s => s.stage_id === overId)
    if (overStage) {
      newStatus = overStage.stage_id
    } else {
      // Check if dropped on a task
      const overTask = kanbanTasks.find(t => t.id === overId)
      if (overTask) {
        newStatus = overTask.status
      } else {
        // Use last known target
        const lastTarget = lastOverTargetRef.current
        const lastStage = selectedProjectData.stages.find(s => s.stage_id === lastTarget)
        if (lastStage) {
          newStatus = lastStage.stage_id
        } else {
          const lastTask = kanbanTasks.find(t => t.id === lastTarget)
          if (lastTask) {
            newStatus = lastTask.status
          }
        }
      }
    }
    
    if (newStatus && draggedTaskOriginalStatusRef.current !== newStatus) {
      try {
        // Actualizar estado INMEDIATAMENTE para evitar animación de snap back
        const updatedTasks = kanbanTasks.map(t => 
          t.id === activeId ? { ...t, status: newStatus } : t
        )
        setKanbanTasks(updatedTasks)
        kanbanTasksRef.current = updatedTasks
        setSelectedProjectData(prev => prev ? {
          ...prev,
          tasks: updatedTasks
        } : null)
        
        // Luego guardar en la base de datos
        await subtasksApi.update(task.id, { status: newStatus })
      } catch (err) {
        console.error('Error:', err)
      }
    }
    
    // Clear the active drag task and reset
    setActiveKanbanDragTask(null)
    lastOverTargetRef.current = null
    draggedTaskOriginalStatusRef.current = null
  }

  const handleKanbanDeleteTask = async (taskId: string) => {
    try {
      await subtasksApi.delete(taskId)
      setKanbanTasks(prev => prev.filter(t => t.id !== taskId))
      setSelectedProjectData(prev => prev ? {
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== taskId)
      } : null)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleKanbanAddTask = async (stageId: string, taskName: string, description?: string, categoryId?: string) => {
    if (!selectedProjectId) return
    try {
      const created = await subtasksApi.create(selectedProjectId, taskName, stageId, description, categoryId)
      setKanbanTasks(prev => [...prev, created])
      setSelectedProjectData(prev => prev ? {
        ...prev,
        tasks: [...prev.tasks, created]
      } : null)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleKanbanUpdateTask = async (taskId: string, data: { name?: string; description?: string; category_id?: string }) => {
    try {
      const updated = await subtasksApi.update(taskId, data)
      setKanbanTasks(prev => prev.map(t => t.id === taskId ? updated : t))
      setSelectedProjectData(prev => prev ? {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? updated : t)
      } : null)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  if (loading) {
    return <div className="projects-page"><p>Cargando...</p></div>
  }

  // Vista de kanban (cuando hay un proyecto seleccionado)
  if (selectedProjectId) {
    const selectedProject = projects.find(p => p.project_id === selectedProjectId)
    
    return (
      <div className="projects-page">
        <div className="projects-page__header">
          <button 
            className="projects-page__back-btn"
            onClick={handleBackToList}
            disabled={loadingProject}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Volver
          </button>
          <h1 className="projects-page__title">{selectedProject?.name || 'Proyecto'}</h1>
          {!showStageForm && (
            <button
              type="button"
              onClick={() => {
                // Load existing stages into newStages for editing
                if (selectedProjectData && selectedProjectData.stages.length > 0) {
                  setNewStages(selectedProjectData.stages.map(s => ({
                    stage_name: s.stage_name,
                    stage_color: s.stage_color,
                    stage_order: s.stage_order
                  })))
                } else {
                  setNewStages([{ stage_name: 'Por hacer', stage_color: '#6b7280', stage_order: 0 }])
                }
                setShowStageForm(true)
              }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.5rem 1rem', 
                background: '#f97316', 
                border: 'none', 
                borderRadius: '6px', 
                color: 'white', 
                fontWeight: '600',
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar Etapas
            </button>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
            <button
              type="button"
              onClick={() => toggleAllCollapsed(true)}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.5rem 0.75rem', 
                background: 'var(--color-bg-tertiary)', 
                border: '1px solid var(--color-border)', 
                borderRadius: '6px', 
                color: 'var(--text-primary)', 
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
              title="Colapsar todas"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
              <span>Contraer</span>
            </button>
            <button
              type="button"
              onClick={() => toggleAllCollapsed(false)}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.5rem 0.75rem', 
                background: 'var(--color-bg-tertiary)', 
                border: '1px solid var(--color-border)', 
                borderRadius: '6px', 
                color: 'var(--text-primary)', 
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
              title="Expandir todas"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
              <span>Expandir</span>
            </button>
          </div>
        </div>
        
        {loadingProject ? (
          <div className="projects-page__loading-overlay">
            <div className="loading-spinner loading-spinner--large"></div>
            <span className="projects-page__loading-text">Cargando proyecto...</span>
          </div>
        ) : selectedProjectData ? (
          <div className={`kanban-board${selectedProjectData.stages.length > 0 && Object.values(collapsedStages).length === selectedProjectData.stages.length && Object.values(collapsedStages).every(v => v) ? ' kanban-board--all-collapsed' : ''}`}>
            <DndContext
              sensors={kanbanSensors}
              collisionDetection={rectIntersection}
              onDragStart={handleKanbanDragStart}
              onDragOver={handleKanbanDragOver}
              onDragEnd={handleKanbanDragEnd}
            >
              {showStageForm || selectedProjectData.stages.length === 0 ? (
                <div className="kanban-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',  margin: '0 auto' }}>
                  {selectedProjectData.stages.length === 0 && !showStageForm && (
                    <>
                      <div className="kanban-empty__icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <line x1="9" y1="3" x2="9" y2="21" />
                          <line x1="15" y1="3" x2="15" y2="21" />
                        </svg>
                      </div>
                      <p className="kanban-empty__text">Este proyecto no tiene etapas</p>
                    </>
                  )}
                  {selectedProjectData.stages.length === 0 && !showStageForm ? (
                    <button 
                      type="button" 
                      className="kanban-empty__btn"
                      style={{ display: 'flex', justifyContent: 'center', margin: '0 auto' }}
                      onClick={() => setShowStageForm(true)}
                    >
                      + Agregar etapas
                    </button>
                  ) : (
                    <div className="inline-stage-form" style={{ marginTop: '1rem', width: '100%', maxWidth: '1000px', marginLeft: 'auto', marginRight: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: '1rem' }}>
                        <h4 style={{ textAlign: 'center', margin: 0 }}>Configurar etapas del proyecto</h4>
                        <button
                          type="button"
                          onClick={() => setShowStageForm(false)}
                          style={{ position: 'absolute', right: 0, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                          title="Cerrar"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <DndContext
                        sensors={stageFormSensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => {
                          const { active, over } = event
                          if (over && active.id !== over.id) {
                            handleStagesReorder(active.id as number, over.id as number)
                          }
                        }}
                      >
                        <SortableContext items={newStages.map((_, i) => i)} strategy={verticalListSortingStrategy}>
                          <div className="stages-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem', flexWrap: 'nowrap', whiteSpace: 'nowrap', overflow: 'visible' }}>
                            {newStages.map((stage, index) => (
                              <SortableStageItem
                                key={index}
                                id={index}
                                stage={stage}
                                index={index}
                                newStages={newStages}
                                setNewStages={setNewStages}
                                showColorPicker={showColorPicker}
                                setShowColorPicker={setShowColorPicker}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
                        <button 
                          type="button"
                          onClick={() => {
                            const newOrder = newStages.length
                            setNewStages([
                              ...newStages,
                              { stage_name: 'Nueva etapa', stage_color: STAGE_COLORS[newOrder % STAGE_COLORS.length], stage_order: newOrder }
                            ])
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          Agregar etapa
                        </button>
                        
                        <button 
                          type="button"
                          onClick={async () => {
                            setSavingStages(true)
                            try {
                              await handleSaveInitialStages()
                              setShowStageForm(false)
                            } catch (err) {
                              toast.error('Error al guardar las etapas')
                            } finally {
                              setSavingStages(false)
                            }
                          }}
                          disabled={savingStages}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: savingStages ? '#9ca3af' : '#f97316', border: 'none', borderRadius: '6px', color: 'white', cursor: savingStages ? 'not-allowed' : 'pointer', fontWeight: '500' }}
                        >
                          {savingStages ? (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="loading-spinner">
                                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32" />
                              </svg>
                              Guardando...
                            </>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                                <polyline points="17,21 17,13 7,13 7,21" />
                                <polyline points="7,3 7,8 15,8" />
                              </svg>
                              Guardar Etapas
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {selectedProjectData.stages.map((stage, index) => (
                    <KanbanColumn
                      key={stage.stage_id}
                      stage={stage}
                      tasks={kanbanTasks.filter(t => t.status === stage.stage_id)}
                      categories={selectedProjectData.categories}
                      onDeleteTask={handleKanbanDeleteTask}
                      onUpdateTask={handleKanbanUpdateTask}
                      onAddTask={handleKanbanAddTask}
                      isCollapsed={collapsedStages[stage.stage_id]}
                      onToggleCollapse={(collapsed) => {
                        setCollapsedStages(prev => ({ ...prev, [stage.stage_id]: collapsed }))
                        // Close forms when collapsing
                        if (collapsed) {
                          setEditingTaskId(null)
                          setShowAddFormStage(null)
                        }
                      }}
                      index={index}
                      editingTaskId={editingTaskId}
                      onSetEditingTaskId={setEditingTaskId}
                      showAddForm={showAddFormStage === stage.stage_id}
                      onSetShowAddForm={(show) => setShowAddFormStage(show ? stage.stage_id : null)}
                    />
                  ))}
                  <DragOverlay>
                    {activeKanbanDragTask ? (
                      <div 
                        className="task-card task-card--overlay"
                        style={{ 
                          borderColor: selectedProjectData.categories.find(c => c.id === activeKanbanDragTask.category_id)?.color || '#6b7280' 
                        }}
                      >
                        <div className="task-card__header">
                          <span 
                            className="task-card__icon" 
                            style={{ backgroundColor: selectedProjectData.categories.find(c => c.id === activeKanbanDragTask.category_id)?.color || '#6b7280' }}
                          >
                            {activeKanbanDragTask.category_id ? (
                              getCategoryIcon(selectedProjectData.categories.find(c => c.id === activeKanbanDragTask.category_id)?.name || '')
                            ) : (
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="12" r="10" />
                              </svg>
                            )}
                          </span>
                          <span 
                            className="task-card__title-container"
                          >
                            <span className="task-card__title">{activeKanbanDragTask.name}</span>
                          </span>
                        </div>
                        {activeKanbanDragTask.description && (
                          <span className="task-card__description">{activeKanbanDragTask.description}</span>
                        )}
                      </div>
                    ) : null}
                  </DragOverlay>
                </>
              )}
            </DndContext>
          </div>
        ) : (
          <p className="projects-page__error">Error al cargar el proyecto</p>
        )}
      </div>
    )
  }

  // Vista de lista de proyectos (selección)
  // Filtrar y ordenar proyectos
  const filteredProjects = projects
    .filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'deadline') {
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      } else {
        const dateA = a.created_at || ''
        const dateB = b.created_at || ''
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      }
    })

  return (
    <div className="projects-page">
      <ConnectionStatus apiUrl={import.meta.env.VITE_API_URL || undefined} />
      <div className="projects-page__header">
        <div className="projects-page__header-left">
          <div className="projects-search">
            <svg className="projects-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="projects-search__input"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'created_at' | 'deadline')}
            className="projects-sort__select"
          >
            <option value="created_at">Más recientes</option>
            <option value="name">Nombre A-Z</option>
            <option value="deadline">Fecha límite</option>
          </select>
        </div>
        <button 
          className="projects-page__add-btn"
          onClick={() => setShowModal(true)}
        >
          + Nuevo Proyecto
        </button>
      </div>

      <div className="projects-grid">
        {filteredProjects.map((project) => (
          <div 
            key={project.project_id} 
            className="project-card"
            onClick={() => handleSelectProject(project.project_id)}
          >
            <div className="project-card__header">
              <div className="project-card__icon">
                {project.icon === 'briefcase' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                )}
                {project.icon === 'code' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                )}
                {project.icon === 'rocket' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                  </svg>
                )}
                {project.icon === 'heart' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                )}
                {project.icon === 'star' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )}
                {project.icon === 'target' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                )}
                {project.icon === 'lightbulb' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                  </svg>
                )}
                {(project.icon === 'folder' || !project.icon) && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                )}
              </div>
              <div className="project-card__actions-top">
                <button 
                  className="project-card__edit-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setProjectToEdit(project)
                  }}
                  title="Editar proyecto"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button 
                  className="project-card__delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setProjectToDelete(project)
                  }}
                  title="Eliminar proyecto"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="project-card__content">
              <h3 className="project-card__title">{project.name}</h3>
              <p className="project-card__description">{project.description || 'Sin descripción'}</p>
            </div>
            <div className="project-card__footer">
              <div className="project-card__dates">
                <span className="project-card__date">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {project.created_at ? new Date(project.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'Sin fecha'}
                </span>
                {project.deadline && (
                  <span className="project-card__date project-card__date--deadline">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {new Date(project.deadline).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
              <span className="project-card__arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de confirmación de eliminación */}
      {projectToDelete && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Eliminar Proyecto</h3>
            <p>¿Estás seguro de eliminar "{projectToDelete.name}"? Esta acción no se puede deshacer.</p>
            <div className="confirm-modal__actions">
              <button 
                className="confirm-modal__btn confirm-modal__btn--cancel"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button 
                className="confirm-modal__btn confirm-modal__btn--delete"
                onClick={async () => {
                  setIsDeleting(true)
                  await handleDeleteProject(projectToDelete.project_id)
                  setProjectToDelete(null)
                  setIsDeleting(false)
                }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de proyecto */}
      {projectToEdit && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Editar Proyecto</h3>
            <form 
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                await handleUpdateProject(
                  projectToEdit.project_id,
                  formData.get('name') as string,
                  formData.get('description') as string,
                  formData.get('deadline') as string,
                  formData.get('icon') as string
                )
              }}
            >
              <div className="form-group">
                <label>Nombre del Proyecto</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={projectToEdit.name}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción (opcional)</label>
                <textarea
                  name="description"
                  defaultValue={projectToEdit.description || ''}
                  className="form-input"
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha Límite (opcional)</label>
                  <input
                    type="date"
                    name="deadline"
                    defaultValue={projectToEdit.deadline || ''}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Icono</label>
                  <select
                    name="icon"
                    defaultValue={projectToEdit.icon || 'folder'}
                    className="form-input"
                  >
                    <option value="folder">Carpeta</option>
                    <option value="briefcase">Maleta</option>
                    <option value="code">Código</option>
                    <option value="rocket">Cohete</option>
                    <option value="heart">Corazón</option>
                    <option value="star">Estrella</option>
                    <option value="target">Objetivo</option>
                    <option value="lightbulb">Idea</option>
                  </select>
                </div>
              </div>

              <div className="confirm-modal__actions">
                <button 
                  type="button"
                  className="confirm-modal__btn confirm-modal__btn--cancel"
                  onClick={() => setProjectToEdit(null)}
                  disabled={isEditing}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="confirm-modal__btn confirm-modal__btn--delete"
                  disabled={isEditing}
                >
                  {isEditing ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CreateProjectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  )
}
