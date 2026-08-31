"""Samdarshi Backend — main FastAPI application.

Production-grade prototype for the SIH 2026 Digital Heritage Archive.
Demonstrates a working kiosk app with real infrastructure and
keyword-matched AI responses.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Logging — structured JSON-friendly output
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-7s | %(name)s | %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger('samdarshi')


# ---------------------------------------------------------------------------
# FastAPI app factory
# ---------------------------------------------------------------------------

def create_app() -> FastAPI:
    app = FastAPI(
        title='Samdarshi — Digital Heritage Archive API',
        description='AI-Powered Institutional Archive for Dr. B.R. Ambedkar',
        version='0.1.0-prototype',
        docs_url='/api/docs',
        redoc_url='/api/redoc',
    )

    # ── CORS ──────────────────────────────────────────────────────────────
    origins = os.environ.get(
        'CORS_ORIGINS',
        'http://localhost:3000,http://localhost:5173,http://localhost:8080',
    ).split(',')

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    # ── Routes ────────────────────────────────────────────────────────────
    from routers.documents import router as documents_router
    from routers.timeline import router as timeline_router
    from routers.chat import router as chat_router
    from routers.ocr import router as ocr_router

    app.include_router(documents_router, prefix='/api')
    app.include_router(timeline_router, prefix='/api')
    app.include_router(chat_router, prefix='/api')
    app.include_router(ocr_router, prefix='/api')

    # ── Startup / shutdown hooks ──────────────────────────────────────────
    @app.on_event('startup')
    async def on_startup() -> None:
        from database import init_db
        from seed_data import seed_if_empty
        init_db()
        seed_if_empty()
        logger.info('Samdarshi backend ready — prototype mode')

    @app.on_event('shutdown')
    async def on_shutdown() -> None:
        logger.info('Samdarshi backend shutting down')

    return app


# ---------------------------------------------------------------------------
# Entrypoint (both `uvicorn main:app` and `python main.py` work)
# ---------------------------------------------------------------------------

app = create_app()


@app.get('/api/health', tags=['health'])
def health_check() -> JSONResponse:
    """Health-check endpoint used by Docker and the frontend."""
    return JSONResponse({
        'status': 'ok',
        'version': '0.1.0-prototype',
        'mode': 'prototype',
        'docs': '/api/docs',
    })


@app.get('/', tags=['root'])
def root() -> JSONResponse:
    """Root endpoint with API information."""
    return JSONResponse({
        'name': 'Samdarshi API',
        'version': '0.1.0-prototype',
        'description': 'AI-Powered Digital Heritage Archive for Dr. B.R. Ambedkar',
        'endpoints': {
            'health': '/api/health',
            'documents': '/api/documents',
            'timeline': '/api/timeline',
            'chat': '/api/chat',
            'ocr': '/api/ocr/scan',
            'docs': '/api/docs',
        },
    })


if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get('PORT', 8000))
    uvicorn.run('main:app', host='0.0.0.0', port=port, reload=True)
