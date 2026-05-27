from fastapi import APIRouter, Request, Response, Depends, HTTPException
from controllers.auth_controller import AuthController

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)

TOKEN_COOKIE_NAME = "auth_token"


@router.post("/register")
def register(request: Request, response: Response):
    """
    Registrar un nuevo usuario
    """
    data = request.json()  # ⚠️ en FastAPI mejor usar Pydantic, aquí simplificado
    response_data, status_code = AuthController.register(data)

    if status_code == 201:
        token = response_data.get("token")
        if token:
            # Configurar cookie HttpOnly
            response.set_cookie(
                key=TOKEN_COOKIE_NAME,
                value=token,
                httponly=True,
                secure=False,  # True en producción con HTTPS
                samesite="lax",
                max_age=60 * 60 * 24 * 7
            )
        return response_data

    raise HTTPException(status_code=status_code, detail=response_data)


@router.post("/login")
def login(request: Request, response: Response):
    """
    Iniciar sesión
    """
    data = request.json()
    response_data, status_code = AuthController.login(data)

    if status_code == 200:
        token = response_data.get("token")
        if token:
            response.set_cookie(
                key=TOKEN_COOKIE_NAME,
                value=token,
                httponly=True,
                secure=False,
                samesite="lax",
                max_age=60 * 60 * 24 * 7
            )
        return {"user": response_data.get("user"), "message": "Login exitoso"}

    raise HTTPException(status_code=status_code, detail=response_data)


@router.get("/me")
def get_current_user(request: Request):
    """
    Obtener usuario actual
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="No se proporcionó token")

    try:
        token = auth_header.split(" ")[1]
    except IndexError:
        raise HTTPException(status_code=401, detail="Formato de token inválido")

    is_valid, payload = AuthController.verify_token(token)
    if not is_valid:
        raise HTTPException(status_code=401, detail=payload)

    user_id = payload.get("user_id")
    response_data, status_code = AuthController.get_current_user(user_id)

    if status_code != 200:
        raise HTTPException(status_code=status_code, detail=response_data)

    return response_data


@router.post("/logout")
def logout(response: Response):
    """
    Cerrar sesión
    """
    response.delete_cookie(TOKEN_COOKIE_NAME)
    return {"message": "Sesión cerrada exitosamente"}
