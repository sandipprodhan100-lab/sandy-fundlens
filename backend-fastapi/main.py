import os
from dotenv import load_dotenv

# Load .env before any app modules so DATABASE_URL / S3 creds are picked up at import time.
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router

app = FastAPI(
    title="Fund Navigator API",
    description="Enterprise-grade mutual fund analytics and agentic engine.",
    version="1.0.0"
)

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
