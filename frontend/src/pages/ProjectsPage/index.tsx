import { useState, useEffect, type JSX } from 'react'
import { projectsApi } from '../../lib/projectsApi'
import './ProjectsPage.css'

interface Stage {
  id: string
  name: string
  order: number
  color: string
}

interface Project {
  id: string
  project_id: string
  name: string
  description: string
  position: number
}

interface KanbanColumn {
  stage: Stage
  projects: Project[]
}

export default function ProjectsPage(): JSX.Element {
  const [kanban, setKanban] = useState<KanbanColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Cargar tablero Kanban
  const loadKanban = async () => {
    try {
      setLoading(true)
      const data = await projectsApi.getKanban()
      setKanban(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKanban()
  }, [])

  // Crear nuevo proyecto
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    try {
      await projectsApi.create(newProjectName)
      setNewProjectName('')
      setShowForm(false)
      loadKanban()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear')
    }
  }

  // Mover proyecto a otra etapa
  const handleMoveProject = async (projectId: string, newStageId: string) => {
    try {
      await projectsApi.move(projectId, newStageId)
      loadKanban()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al mover')
    }
  }

  // Eliminar proyecto
  const handleDeleteProject = async (projectId: string) => {
    try {
      await projectsApi.delete(projectId)
      loadKanban()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  return (
    <main className="projects-page">
      <div className="projects-page__header">
        <h1 className="projects-page__title">Proyectos</h1>
        <button 
          className="projects-page__add-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : '+ Nuevo Proyecto'}
        </button>
      </div>

      {/* Formulario para crear proyecto */}
      {showForm && (
        <form className="projects-page__form" onSubmit={handleCreateProject}>
          <input
            type="text"
            placeholder="Nombre del proyecto"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="projects-page__input"
          />
          <button type="submit" className="projects-page__submit">
            Crear
          </button>
        </form>
      )}

      {error && <p className="projects-page__error">{error}</p>}

      {/* Tablero Kanban */}
      {loading ? (
        <p className="projects-page__loading">Cargando...</p>
      ) : (
        <div className="projects-page__kanban">
          {kanban.map((column) => (
            <div key={column.stage.id} className="projects-page__column">
              <div 
                className="projects-page__column-header"
                style={{ borderColor: column.stage.color }}
              >
                <span 
                  className="projects-page__column-dot"
                  style={{ backgroundColor: column.stage.color }}
                />
                <span className="projects-page__column-title">
                  {column.stage.name}
                </span>
                <span className="projects-page__column-count">
                  {column.projects.length}
                </span>
              </div>

              <div className="projects-page__column-content">
                {column.projects.map((project) => (
                  <div key={project.id} className="projects-page__card">
                    <span className="projects-page__card-title">
                      {project.name}
                    </span>
                    
                    {/* Botones de acción */}
                    <div className="projects-page__card-actions">
                      {/* Mover a otras etapas */}
                      <select
                        className="projects-page__move-select"
                        value={column.stage.id}
                        onChange={(e) => {
                          if (e.target.value !== column.stage.id) {
                            handleMoveProject(project.project_id, e.target.value)
                          }
                        }}
                      >
                        {kanban.map((col) => (
                          <option key={col.stage.id} value={col.stage.id}>
                            Mover a {col.stage.name}
                          </option>
                        ))}
                      </select>
                      
                      <button
                        className="projects-page__delete-btn"
                        onClick={() => handleDeleteProject(project.project_id)}
                      >
                        X
                      </button>
                    </div>
                  </div>
                ))}

                {column.projects.length === 0 && (
                  <p className="projects-page__empty">
                    No hay proyectos
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
