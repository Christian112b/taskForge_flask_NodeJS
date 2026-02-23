# MVC App - Flask + React + Supabase

Proyecto de aprendizaje que demuestra el patrón MVC con Flask (backend), React (frontend) y Supabase (base de datos).

## Estructura del Proyecto

```
/
├── backend/           # API REST con Flask
│   ├── app.py        # Entry point
│   ├── config.py     # Configuración
│   ├── models/       # Model (datos)
│   ├── controllers/  # Controller (lógica)
│   ├── views/        # Routes
│   ├── middleware/   # JWT middleware
│   └── services/     # Cliente Supabase
│
└── frontend/         # SPA con React
    └── src/
        ├── pages/    # Páginas
        ├── components/
        ├── contexts/ # Estado global
        └── lib/      # API client
```

## Requisitos

- Node.js 18+
- Python 3.9+
- Cuenta de Supabase

## Instalación

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Configura las variables de entorno en `backend/.env`:
```
SUPABASE_URL=tu_url_de_supabase
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_KEY=tu_service_key
SECRET_KEY=tu_secret_key
```

Inicia el servidor:
```bash
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Tecnologías

- **Frontend**: React, TypeScript, Vite
- **Backend**: Python, Flask
- **Base de datos**: Supabase
- **Autenticación**: JWT
