import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Language = 'en' | 'es'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.introduction': 'Introduction',
    'nav.userGuide': 'User Guide',
    'nav.technical': 'Technical Docs',
    'nav.challenges': 'Challenges',
    'nav.about': 'About',
    
    // Introduction
    'intro.title': 'Welcome to TaskForge',
    'intro.subtitle': 'TaskForge - Project Management with Flask, React & Supabase',
    'intro.description1': 'TaskForge is a comprehensive full-stack project management application that demonstrates the Model-View-Controller (MVC) architectural pattern using modern web technologies. This application serves as both a functional project management tool and a demonstration of professional software development practices.',
    'intro.description2': 'The application allows users to create projects, organize them into stages using a Kanban-style board, and manage detailed subtasks. All data is securely stored in a PostgreSQL database with row-level security, ensuring data privacy and integrity.',
    'intro.keyFeatures': 'Key Features',
    'intro.highlights': 'Project Highlights',
    'intro.highlight.1': 'Full-stack application with Flask backend and React frontend',
    'intro.highlight.2': 'PostgreSQL database management with Supabase',
    'intro.highlight.3': 'Type-safe development with TypeScript throughout',
    'intro.highlight.4': 'Responsive design with dark/light mode support',
    'intro.highlight.5': 'RESTful API architecture following best practices',
    'intro.highlight.6': 'Component-based React architecture with hooks',
    'intro.cta': 'Explore the Technical Docs section to understand the architecture and implementation details, or check the User Guide to get started with using the application.',
    
    // Features
    'features.projectManagement': 'Project Management',
    'features.projectManagement.desc': 'Create and organize multiple projects with custom categories, descriptions, and dates. Full CRUD operations with real-time validation.',
    'features.kanbanBoards': 'Kanban Boards',
    'features.kanbanBoards.desc': 'Visualize your workflow with draggable stages. Organize tasks across columns like To Do, In Progress, and Done.',
    'features.taskManagement': 'Task Management',
    'features.taskManagement.desc': 'Break down complex work into manageable subtasks. Track completion status and manage priorities effectively.',
    'features.secureAuth': 'Secure Authentication',
    'features.secureAuth.desc': 'JWT-based authentication with Supabase. Secure token management with automatic refresh and protected routes.',
    
    // User Guide
    'userGuide.title': 'User Guide',
    'userGuide.platformGuide': 'Guia de la Plataforma',
    'userGuide.devGuide': 'Guia para Desarrolladores',
    'userGuide.gettingStarted': 'Getting Started',
    'userGuide.features': 'Features',
    'userGuide.faq': 'FAQ',
    'userGuide.prerequisites': 'Prerequisites',
    'userGuide.installationSteps': 'Installation Steps',
    'userGuide.cloneBackend': 'Clone and Setup Backend',
    'userGuide.setupBackend': 'Navigate to the backend directory and create a virtual environment:',
    'userGuide.configureEnv': 'Configure Environment Variables',
    'userGuide.createEnv': 'Create a .env file in the backend folder with your Supabase credentials:',
    'userGuide.setupFrontend': 'Setup Frontend',
    'userGuide.installDeps': 'Install dependencies and start the development server:',
    'userGuide.accessApp': 'Access the Application',
    'userGuide.openBrowser': 'Open your browser and navigate to:',
    'userGuide.testCredentials': 'You should see the login page where you can register a new account or use test credentials.',
    'userGuide.tip': 'You can obtain these credentials from your Supabase project dashboard.',
    
    // Features List
    'userGuide.features.subtitle': 'TaskForge provides a comprehensive set of features for managing your projects and tasks. Below is a detailed overview of each feature.',
    'userGuide.features.projectCreation': 'Project Creation',
    'userGuide.features.projectCreation.desc': 'Create new projects with custom names, descriptions, and assign them to categories for better organization.',
    'userGuide.features.categoryManagement': 'Category Management',
    'userGuide.features.categoryManagement.desc': 'Organize projects into categories like Work, Personal, or Learning to maintain a clear structure.',
    'userGuide.features.stageManagement': 'Stage Management',
    'userGuide.features.stageManagement.desc': 'Create custom stages for each project. Default stages include To Do, In Progress, and Done.',
    'userGuide.features.subtaskTracking': 'Subtask Tracking',
    'userGuide.features.subtaskTracking.desc': 'Break down tasks into smaller actionable items. Track completion status for each subtask.',
    'userGuide.features.inlineEditing': 'Inline Editing',
    'userGuide.features.inlineEditing.desc': 'Edit projects, stages, and subtasks directly from the main view with inline editing.',
    'userGuide.features.deleteOperations': 'Delete Operations',
    'userGuide.features.deleteOperations.desc': 'Remove projects, stages, and subtasks with confirmation dialogs to prevent accidental deletion.',
    
    // FAQ
    'userGuide.faq.subtitle': 'Find answers to common questions about using TaskForge.',
    'userGuide.faq.q1': 'How do I create a new project?',
    'userGuide.faq.q1.answer': 'Click on the New Project button in the Projects page. Fill in the project name, description, and select a category from the dropdown. Click Create to save the project.',
    'userGuide.faq.q2': 'Can I customize the stages in a project?',
    'userGuide.faq.q2.answer': 'Yes! While each new project comes with default stages (To Do, In Progress, Done), you can add, edit, reorder, and delete stages by clicking on the stage options menu.',
    'userGuide.faq.q3': 'How do I add subtasks to a task?',
    'userGuide.faq.q3.answer': 'Click on any task within a stage to open its details. You can then use the Add Subtask button to create new subtasks. Each subtask can be marked as complete by clicking the checkbox.',
    'userGuide.faq.q4': 'Is my data secure?',
    'userGuide.faq.q4.answer': 'Yes! All data is protected with JWT authentication. Each user can only access their own projects and data. Supabase Row Level Security (RLS) policies ensure data isolation between users.',
    'userGuide.faq.q5': 'Can I use this app on my phone?',
    'userGuide.faq.q5.answer': 'Absolutely! The app is fully responsive and works on desktop, tablet, and mobile devices. The interface adapts to different screen sizes automatically.',
    'userGuide.faq.q6': 'How do I change between light and dark mode?',
    'userGuide.faq.q6.answer': 'Click on your profile avatar in the top right corner and select the theme toggle option. Your preference is saved and persists across sessions.',
    
    // Technical Docs
    'tech.title': 'Technical Documentation',
    'tech.architecture': 'Architecture',
    'tech.stack': 'Tech Stack',
    'tech.api': 'API',
    'tech.patterns': 'Patterns',
    'tech.systemArchitecture': 'System Architecture',
    'tech.systemArchitecture.desc': 'TaskForge follows a client-server architecture with a clear separation of concerns. The application is divided into three main layers, each responsible for specific functionality. This separation ensures maintainability, scalability, and testability of the codebase.',
    'tech.frontend': 'Frontend (React)',
    'tech.backend': 'Backend (Flask)',
    'tech.database': 'Database (Supabase)',
    'tech.projectStructure': 'Project Structure',
    'tech.projectStructure.desc': 'The project follows a standard full-stack directory structure with clear separation between backend and frontend code. Each directory has a specific purpose and follows best practices.',
    'tech.dataFlow': 'Data Flow',
    'tech.dataFlow.desc': 'The typical data flow in the application follows this pattern: User interacts with the React frontend, which makes API calls to the Flask backend. The backend processes the request, interacts with Supabase (PostgreSQL), and returns the appropriate response. All sensitive operations are protected by JWT authentication.',
    'tech.techStack': 'Technology Stack',
    'tech.techStack.desc': 'TaskForge leverages modern and battle-tested technologies to deliver a robust, scalable, and maintainable application. Below is a detailed breakdown of each technology used in the project.',
    'tech.authentication': 'Authentication',
    'tech.authentication.desc': 'Most endpoints require a JWT token in the Authorization header. Include the token in the following format:',
    'tech.endpoints': 'Endpoints',
    
    // Design Patterns
    'patterns.title': 'Design Patterns',
    'patterns.desc': 'This section documents the design patterns and architectural decisions used in the project. Understanding these patterns will help you extend and maintain the codebase.',
    'patterns.mvc': 'MVC (Model-View-Controller)',
    'patterns.mvc.desc': 'The backend follows the traditional MVC architectural pattern:',
    'patterns.repository': 'Repository Pattern',
    'patterns.repository.desc': 'API calls are abstracted into separate service modules for cleaner code organization:',
    'patterns.context': 'Context API (State Management)',
    'patterns.context.desc': 'Global state management in the frontend using React Context:',
    'patterns.routes': 'Protected Routes (Route Guards)',
    'patterns.routes.desc': 'Security patterns for authentication flow:',
    'patterns.jwt': 'JWT Middleware',
    'patterns.jwt.desc': 'Server-side token validation and request enrichment:',
    
    // About
    'about.title': 'About the Developer',
    'about.intro': 'This project was built as a comprehensive learning exercise to master full-stack web development with modern technologies. It demonstrates the ability to create complete, production-ready web applications with authentication, database management, and responsive user interfaces.',
    'about.intro2': 'The application showcases proficiency in both frontend and backend development, database design, API development, and deployment considerations.',
    'about.skills': 'Skills',
    'about.learned': 'What I Learned',
    'about.learned.desc': 'Through building this project, I gained hands-on experience with the following concepts and technologies:',
    'about.future': 'Future Improvements',
    'about.future.desc': 'While the current version provides a solid foundation, there are several features and improvements planned for future versions:',
    'about.connect': "Let's Connect",
    'about.connect.desc': "Feel free to explore the code, use this project as a reference, or reach out if you'd like to collaborate!",
  },
  es: {
    // Navigation
    'nav.introduction': 'Introduccion',
    'nav.userGuide': 'Guia de Usuario',
    'nav.technical': 'Docs Tecnicas',
    'nav.challenges': 'Desafios',
    'nav.about': 'Acerca de',
    
    // Introduction
    'intro.title': 'Bienvenido a TaskForge',
    'intro.subtitle': 'TaskForge - Gestion de Proyectos con Flask, React y Supabase',
    'intro.description1': 'TaskForge es una aplicacion completa de gestion de proyectos full-stack que demuestra el patron arquitectonico Modelo-Vista-Controlador (MVC) usando tecnologias web modernas. Esta aplicacion sirve tanto como una herramienta funcional de gestion de proyectos como una demostracion de prácticas profesionales de desarrollo de software.',
    'intro.description2': 'La aplicacion permite a los usuarios crear proyectos, organizarlos en etapas usando un tablero estilo Kanban y gestionar subtareas detalladas. Todos los datos se almacenan de forma segura en una base de datos PostgreSQL con seguridad a nivel de fila, garantizando la privacidad e integridad de los datos.',
    'intro.keyFeatures': 'Caracteristicas Principales',
    'intro.highlights': 'Destacados del Proyecto',
    'intro.highlight.1': 'Aplicacion full-stack con backend Flask y frontend React',
    'intro.highlight.2': 'Gestion de base de datos PostgreSQL con Supabase',
    'intro.highlight.3': 'Desarrollo con TypeScript en todo el proyecto',
    'intro.highlight.4': 'Diseno responsivo con soporte para modo oscuro',
    'intro.highlight.5': 'Arquitectura de API RESTful siguiendo mejores practicas',
    'intro.highlight.6': 'Arquitectura basada en componentes de React con hooks',
    'intro.cta': 'Explora la seccion de Documentacion Tecnica para entender la arquitectura y detalles de implementacion, o consulta la Guia de Usuario para comenzar a usar la aplicacion.',
    
    // Features
    'features.projectManagement': 'Gestion de Proyectos',
    'features.projectManagement.desc': 'Crea y organiza multiples proyectos con categorias personalizadas, descripciones y fechas. Operaciones CRUD completas con validacion en tiempo real.',
    'features.kanbanBoards': 'Tableros Kanban',
    'features.kanbanBoards.desc': 'Visualiza tu flujo de trabajo con etapas arrastrables. Organiza tareas en columnas como Por Hacer, En Progreso y Completado.',
    'features.taskManagement': 'Gestion de Tareas',
    'features.taskManagement.desc': 'Divide el trabajo complejo en subtareas manejables. Rastrea el estado de completacion y gestiona prioridades efectivamente.',
    'features.secureAuth': 'Autenticacion Segura',
    'features.secureAuth.desc': 'Autenticacion basada en JWT con Supabase. Gestion segura de tokens con actualizacion automatica y rutas protegidas.',
    
    // User Guide
    'userGuide.title': 'Guia de Usuario',
    'userGuide.platformGuide': 'Guia de la Plataforma',
    'userGuide.devGuide': 'Guia para Desarrolladores',
    'userGuide.gettingStarted': 'Primeros Pasos',
    'userGuide.features': 'Caracteristicas',
    'userGuide.faq': 'FAQ',
    'userGuide.prerequisites': 'Requisitos Previos',
    'userGuide.installationSteps': 'Pasos de Instalacion',
    'userGuide.cloneBackend': 'Clonar y Configurar Backend',
    'userGuide.setupBackend': 'Navega al directorio del backend y crea un entorno virtual:',
    'userGuide.configureEnv': 'Configurar Variables de Entorno',
    'userGuide.createEnv': 'Crea un archivo .env en la carpeta del backend con tus credenciales de Supabase:',
    'userGuide.setupFrontend': 'Configurar Frontend',
    'userGuide.installDeps': 'Instala las dependencias e inicia el servidor de desarrollo:',
    'userGuide.accessApp': 'Acceder a la Aplicacion',
    'userGuide.openBrowser': 'Abre tu navegador y navega a:',
    'userGuide.testCredentials': 'Deberias ver la pagina de inicio de sesion donde puedes registrar una nueva cuenta o usar credenciales de prueba.',
    'userGuide.tip': 'Puedes obtener estas credenciales desde el panel de tu proyecto de Supabase.',
    
    // Features List
    'userGuide.features.subtitle': 'TaskForge proporciona un conjunto completo de funciones para gestionar tus proyectos y tareas. A continuacion encontraras una descripcion detallada de cada funcion.',
    'userGuide.features.projectCreation': 'Creacion de Proyectos',
    'userGuide.features.projectCreation.desc': 'Crea nuevos proyectos con nombres personalizados, descripciones y asignales categorias para una mejor organizacion.',
    'userGuide.features.categoryManagement': 'Gestion de Categorias',
    'userGuide.features.categoryManagement.desc': 'Organiza proyectos en categorias como Trabajo, Personal o Aprendizaje para mantener una estructura clara.',
    'userGuide.features.stageManagement': 'Gestion de Etapas',
    'userGuide.features.stageManagement.desc': 'Crea etapas personalizadas para cada proyecto. Las etapas por defecto incluyen Por Hacer, En Progreso y Completado.',
    'userGuide.features.subtaskTracking': 'Seguimiento de Subtareas',
    'userGuide.features.subtaskTracking.desc': 'Divide las tareas en elementos mas pequeños y accionables. Rastrea el estado de completacion de cada subtarea.',
    'userGuide.features.inlineEditing': 'Edicion en Linea',
    'userGuide.features.inlineEditing.desc': 'Edita proyectos, etapas y subtareas directamente desde la vista principal con edicion en linea.',
    'userGuide.features.deleteOperations': 'Operaciones de Eliminacion',
    'userGuide.features.deleteOperations.desc': 'Elimina proyectos, etapas y subtareas con dialogos de confirmacion para evitar eliminaciones accidentales.',
    
    // FAQ
    'userGuide.faq.subtitle': 'Encuentra respuestas a preguntas frecuentes sobre el uso de TaskForge.',
    'userGuide.faq.q1': 'Como creo un nuevo proyecto?',
    'userGuide.faq.q1.answer': 'Haz clic en el boton Nuevo Proyecto en la pagina de Proyectos. Llena el nombre del proyecto, descripcion y selecciona una categoria del menu desplegable. Haz clic en Crear para guardar el proyecto.',
    'userGuide.faq.q2': 'Puedo personalizar las etapas de un proyecto?',
    'userGuide.faq.q2.answer': 'Si! Aunque cada nuevo proyecto viene con etapas por defecto (Por Hacer, En Progreso, Completado), puedes agregar, editar, reordenar y eliminar etapas haciendo clic en el menu de opciones de la etapa.',
    'userGuide.faq.q3': 'Como agrego subtareas a una tarea?',
    'userGuide.faq.q3.answer': 'Haz clic en cualquier tarea dentro de una etapa para abrir sus detalles. Luego puedes usar el boton Agregar Subtarea para crear nuevas subtareas. Cada subtarea se puede marcar como completada haciendo clic en la casilla.',
    'userGuide.faq.q4': 'Mis datos son seguros?',
    'userGuide.faq.q4.answer': 'Si! Todos los datos estan protegidos con autenticacion JWT. Cada usuario solo puede acceder a sus propios proyectos y datos. Las politicas de Seguridad a Nivel de Fila (RLS) de Supabase garantizan el aislamiento de datos entre usuarios.',
    'userGuide.faq.q5': 'Puedo usar esta aplicacion en mi telefono?',
    'userGuide.faq.q5.answer': 'Claro que si! La aplicacion es completamente responsiva y funciona en dispositivos de escritorio, tablet y moviles. La interfaz se adapta automaticamente a diferentes tamanos de pantalla.',
    'userGuide.faq.q6': 'Como cambio entre modo claro y oscuro?',
    'userGuide.faq.q6.answer': 'Haz clic en tu avatar de perfil en la esquina superior derecha y selecciona la opcion de cambio de tema. Tu preferencia se guarda y persiste entre sesiones.',
    
    // Technical Docs
    'tech.title': 'Documentacion Tecnica',
    'tech.architecture': 'Arquitectura',
    'tech.stack': 'Stack Tecnologico',
    'tech.api': 'API',
    'tech.patterns': 'Patrones',
    'tech.systemArchitecture': 'Arquitectura del Sistema',
    'tech.systemArchitecture.desc': 'TaskForge sigue una arquitectura cliente-servidor con una clara separacion de responsabilidades. La aplicacion se divide en tres capas principales, cada una responsable de una funcionalidad especifica. Esta separacion garantiza mantenibilidad, escalabilidad y testabilidad del codigo.',
    'tech.frontend': 'Frontend (React)',
    'tech.backend': 'Backend (Flask)',
    'tech.database': 'Base de Datos (Supabase)',
    'tech.projectStructure': 'Estructura del Proyecto',
    'tech.projectStructure.desc': 'El proyecto sigue una estructura de directorio full-stack estandar con separacion clara entre el codigo del backend y frontend. Cada directorio tiene un proposito especifico y sigue las mejores practicas.',
    'tech.dataFlow': 'Flujo de Datos',
    'tech.dataFlow.desc': 'El flujo de datos tipico en la aplicacion sigue este patron: El usuario interactua con el frontend de React, que realiza llamadas API al backend de Flask. El backend procesa la solicitud, interactua con Supabase (PostgreSQL) y devuelve la respuesta apropiada. Todas las operaciones sensibles estan protegidas por autenticacion JWT.',
    'tech.techStack': 'Stack Tecnologico',
    'tech.techStack.desc': 'TaskForge aprovecha tecnologias modernas y probadas para entregar una aplicacion robusta, escalable y mantenible. A continuacion encontraras un desglose detallado de cada tecnologia utilizada en el proyecto.',
    'tech.authentication': 'Autenticacion',
    'tech.authentication.desc': 'La mayoria de los endpoints requieren un token JWT en el encabezado de Autorizacion. Incluye el token en el siguiente formato:',
    'tech.endpoints': 'Endpoints',
    
    // Design Patterns
    'patterns.title': 'Patrones de Diseno',
    'patterns.desc': 'Esta seccion documenta los patrones de diseno y decisiones arquitectonicas utilizados en el proyecto. Entender estos patrones te ayudara a extender y mantener el codigo.',
    'patterns.mvc': 'MVC (Modelo-Vista-Controlador)',
    'patterns.mvc.desc': 'El backend sigue el patron arquitectonico MVC tradicional:',
    'patterns.repository': 'Patron Repository',
    'patterns.repository.desc': 'Las llamadas API se abstraen en modulos de servicio separados para una organizacion del codigo mas limpia:',
    'patterns.context': 'Context API (Gestion de Estado)',
    'patterns.context.desc': 'Gestion de estado global en el frontend usando Context de React:',
    'patterns.routes': 'Rutas Protegidas (Guardias de Ruta)',
    'patterns.routes.desc': 'Patrones de seguridad para el flujo de autenticacion:',
    'patterns.jwt': 'Middleware JWT',
    'patterns.jwt.desc': 'Validacion de tokens del lado del servidor y enriquecimiento de solicitudes:',
    
    // About
    'about.title': 'Acerca del Desarrollador',
    'about.intro': 'Este proyecto fue construido como un ejercicio integral de aprendizaje para dominar el desarrollo web full-stack con tecnologias modernas. Demuestra la capacidad de crear aplicaciones web completas y listas para produccion con autenticacion, gestion de bases de datos e interfaces de usuario responsivas.',
    'about.intro2': 'La aplicacion muestra competencia en desarrollo frontend y backend, diseno de bases de datos, desarrollo de API y consideraciones de despliegue.',
    'about.skills': 'Habilidades',
    'about.learned': 'Lo que Aprendi',
    'about.learned.desc': 'A traves de construir este proyecto, obtuve experiencia practica con los siguientes conceptos y tecnologias:',
    'about.future': 'Mejoras Futuras',
    'about.future.desc': 'Aunque la version actual proporciona una base solida, hay varias funciones y mejoras planificadas para versiones futuras:',
    'about.connect': 'Conectemos',
    'about.connect.desc': 'Sientete libre de explorar el codigo, usar este proyecto como referencia, o contactarte si te gustaria colaborar!',
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language')
    return (saved as Language) || 'es'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
