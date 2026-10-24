import httpx
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from uuid import UUID
from .characters_api import settings, authenticated_user

router = APIRouter(prefix="/v1/campaigns", tags=["campaigns"])

class CampaignStart(BaseModel):
    character_id: UUID

def prologue(character: dict) -> str:
    name = character["name"]
    origins = {
        "soldado": "O som dos tambores de guerra ainda ecoa em sua memória.",
        "erudito": "Um manuscrito proibido trouxe à luz um símbolo esquecido.",
        "forasteiro": "As estradas trouxeram rumores sobre o desaparecimento de viajantes.",
        "artesao": "Uma encomenda marcada com um selo antigo mudou sua rotina.",
        "criminoso": "Um antigo contato deixou uma mensagem que não deveria existir.",
    }
    opening = origins.get(character["background"], "O passado chama por você.")
    history = character.get("personal_history", "").strip()
    personal = f" Você se recorda de um detalhe da própria história: {history[:350]}." if history else ""
    return (f"{name}, em Eldoria, a paz entre os reinos começa a ruir. {opening}{personal} "
            "Na noite do eclipse, uma mensageira ferida chega à vila de Valebruma trazendo um medalhão "
            "com o brasão de um reino apagado dos mapas. Antes de desmaiar, ela murmura: "
            "'Não deixem que abram o Portão de Cinzas.' "
            "A praça silencia. Você está diante dela. O que faz?")

def headers(key: str, token: str):
    return {"apikey": key, "Authorization": f"Bearer {token}", "Prefer": "return=representation"}

@router.post("", status_code=201)
async def start_campaign(body: CampaignStart, authorization: str | None = Header(default=None)):
    url, key = settings()
    async with httpx.AsyncClient(timeout=15) as client:
        owner, token = await authenticated_user(client, url, key, authorization)
        h = headers(key, token)
        try:
            character_response = await client.get(f"{url}/rest/v1/characters", params={"id": f"eq.{body.character_id}", "owner_id": f"eq.{owner}", "select": "*", "limit": "1"}, headers=h)
            if character_response.status_code != 200:
                raise HTTPException(status_code=502, detail="Erro ao consultar personagem")
            matches = character_response.json()
            if not matches:
                raise HTTPException(status_code=404, detail="Personagem nao encontrado")
            character = matches[0]
            existing = await client.get(f"{url}/rest/v1/campaigns", params={"character_id": f"eq.{body.character_id}", "owner_id": f"eq.{owner}", "select": "*", "limit": "1"}, headers=h)
            if existing.status_code != 200:
                raise HTTPException(status_code=502, detail="Erro ao consultar campanha")
            if existing.json():
                return existing.json()[0]
            state = {"chapter": 1, "location": "Valebruma", "prologue": prologue(character), "turn": 0, "mode": "scripted_prologue", "character_name": character["name"]}
            result = await client.post(f"{url}/rest/v1/campaigns", params={"select": "*"}, headers=h, json={"owner_id": owner, "character_id": str(body.character_id), "status": "active", "world_state": state})
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Supabase indisponivel")
    if result.status_code not in (200, 201):
        raise HTTPException(status_code=400, detail="Nao foi possivel iniciar campanha")
    return result.json()[0]

@router.get("")
async def list_campaigns(authorization: str | None = Header(default=None)):
    url, key = settings()
    async with httpx.AsyncClient(timeout=15) as client:
        owner, token = await authenticated_user(client, url, key, authorization)
        try:
            result = await client.get(f"{url}/rest/v1/campaigns", params={"owner_id": f"eq.{owner}", "select": "*", "order": "created_at.desc"}, headers=headers(key, token))
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Supabase indisponivel")
    if result.status_code != 200:
        raise HTTPException(status_code=502, detail="Erro ao consultar campanhas")
    return result.json()
