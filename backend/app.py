from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importa tus routers (antes eran blueprints en Flask)
from views.auth_views import router as auth_router
from views.protected_views import router as protected_router
from views.project_views import router as projects_router
from views.subtask_views import router as subtask_router
from views.stage_views import router as stage_router
from views.category_views import router as category_router
from views.project_stage_views import router as project_stage_router
from config import Config

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
)

# Registrar routers (antes blueprints)
app.include_router(auth_router)
app.include_router(protected_router)
app.include_router(projects_router)
app.include_router(subtask_router)
app.include_router(stage_router)
app.include_router(category_router)
app.include_router(project_stage_router)

# Ruta raíz
@app.get("/")
def index():
    return {"status": "root"}

# Ruta de health check
@app.get("/health")
def health():
    return {"status": "healthy"}
