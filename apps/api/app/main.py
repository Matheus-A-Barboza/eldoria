from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from .characters_api import router as characters_router
from .campaigns_api import router as campaigns_router
from pydantic import BaseModel

app = FastAPI(title="Eldoria API", version="0.1.0")
origins = [origin.strip() for origin in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"])
app.include_router(characters_router)
app.include_router(campaigns_router)


class HealthResponse(BaseModel):
    status: str
    service: str


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="eldoria-api")
