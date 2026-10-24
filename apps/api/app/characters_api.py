import os
from uuid import UUID
import httpx
from fastapi import APIRouter, Header, HTTPException, status
from .character_rules import CharacterCreate

router = APIRouter(prefix="/v1/characters", tags=["characters"])


def settings():
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")
    if not url or not key:
        raise HTTPException(status_code=503, detail="Supabase nao configurado")
    return url, key


async def authenticated_user(client: httpx.AsyncClient, url: str, key: str, authorization: str | None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Autenticacao obrigatoria")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Token ausente")
    try:
        response = await client.get(f"{url}/auth/v1/user", headers={"apikey": key, "Authorization": f"Bearer {token}"})
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Servico de autenticacao indisponivel")
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Sessao invalida")
    return response.json()["id"], token


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_character(payload: CharacterCreate, authorization: str | None = Header(default=None)):
    url, key = settings()
    async with httpx.AsyncClient(timeout=12) as client:
        owner_id, token = await authenticated_user(client, url, key, authorization)
        body = payload.model_dump(by_alias=True)
        body["owner_id"] = owner_id
        try:
            result = await client.post(f"{url}/rest/v1/characters", params={"select": "*"}, headers={"apikey": key, "Authorization": f"Bearer {token}", "Prefer": "return=representation"}, json=body)
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Banco indisponivel")
    if result.status_code not in (200, 201):
        raise HTTPException(status_code=400, detail="Nao foi possivel salvar a ficha")
    return result.json()[0]


@router.get("")
async def list_characters(authorization: str | None = Header(default=None)):
    url, key = settings()
    async with httpx.AsyncClient(timeout=12) as client:
        owner_id, token = await authenticated_user(client, url, key, authorization)
        try:
            result = await client.get(f"{url}/rest/v1/characters", params={"owner_id": f"eq.{owner_id}", "select": "*", "order": "created_at.desc"}, headers={"apikey": key, "Authorization": f"Bearer {token}"})
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Banco indisponivel")
    if result.status_code != 200:
        raise HTTPException(status_code=502, detail="Falha ao carregar personagens")
    return result.json()
