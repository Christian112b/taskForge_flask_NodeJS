import { useState, type JSX } from 'react'
import './JwtDemoPage.css'

export default function JwtDemoPage(): JSX.Element {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  // Pasos del flujo JWT
  const steps = [
    { id: 1, title: 'Login', description: 'Usuario envia email y contrasena' },
    { id: 2, title: 'Servidor', description: 'Flask verifica credenciales' },
    { id: 3, title: 'JWT Token', description: 'Servidor genera token firmado' },
    { id: 4, title: 'Cliente', description: 'Token se guarda en localStorage' },
    { id: 5, title: 'Solicitud', description: 'Cliente envia token en header' },
    { id: 6, title: 'Verificacion', description: 'Middleware valida el token' },
    { id: 7, title: 'Respuesta', description: 'Datos protegidos se devuelven' },
  ]

  return (
    <main className="jwt-demo-page">
      {/* Card 1: Explicacion de JWT - ocupa toda la altura */}
      <div className="jwt-demo-page__card jwt-demo-page__card--flow">
        <h1 className="jwt-demo-page__title">Como funciona JWT?</h1>
        <p className="jwt-demo-page__subtitle">Haz clic en cada paso para ver el proceso</p>
        
        <div className="jwt-demo-page__flow">
          {steps.map((step, index) => (
            <div key={step.id}>
              <button
                className={`jwt-demo-page__step ${activeStep === step.id ? 'jwt-demo-page__step--active' : ''}`}
                onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
              >
                <span className="jwt-demo-page__step-number">{step.id}</span>
                <span className="jwt-demo-page__step-title">{step.title}</span>
              </button>
              {index < steps.length - 1 && (
                <div className="jwt-demo-page__step-arrow">↓</div>
              )}
            </div>
          ))}
        </div>

        {activeStep && (
          <div className="jwt-demo-page__step-description">
            <strong>{steps[activeStep - 1].title}:</strong> {steps[activeStep - 1].description}
          </div>
        )}
      </div>

      {/* Card 2: Estructura del token */}
      <div className="jwt-demo-page__card jwt-demo-page__card--structure">
        <h2 className="jwt-demo-page__card-title">Estructura del Token JWT</h2>
        
        <div className="jwt-demo-page__token-demo">
          <code className="jwt-demo-page__token-code">
            <span className="jwt-demo-page__token-part">header</span>.<span className="jwt-demo-page__token-part">payload</span>.<span className="jwt-demo-page__token-part">signature</span>
          </code>
        </div>

        <div className="jwt-demo-page__token-info">
          <div className="jwt-demo-page__token-section">
            <span className="jwt-demo-page__token-label jwt-demo-page__token-label--header">Header</span>
            <p className="jwt-demo-page__token-text">Tipo de token y algoritmo de firma</p>
          </div>
          <div className="jwt-demo-page__token-section">
            <span className="jwt-demo-page__token-label jwt-demo-page__token-label--payload">Payload</span>
            <p className="jwt-demo-page__token-text">Datos del usuario (claims)</p>
          </div>
          <div className="jwt-demo-page__token-section">
            <span className="jwt-demo-page__token-label jwt-demo-page__token-label--signature">Signature</span>
            <p className="jwt-demo-page__token-text">Firma para verificar autenticidad</p>
          </div>
        </div>
      </div>

      {/* Card 3: Codigo ejemplo */}
      <div className="jwt-demo-page__card jwt-demo-page__card--code">
        <h2 className="jwt-demo-page__card-title">Proteger rutas en Flask</h2>
        
        <pre className="jwt-demo-page__code-block">{'# 1. Usar el decorador @jwt_required\nfrom middleware.auth_middleware import jwt_required\n\n@app.route(\'/api/datos\')\n@jwt_required\ndef get_data():\n    # Obtener ID del usuario desde el token\n    user_id = request.user_id\n    return jsonify({\'user_id\': user_id})\n\n# 2. El token se envia en el header:\n# Authorization: Bearer <token>'}</pre>
      </div>
    </main>
  )
}
