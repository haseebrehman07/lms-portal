import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import SessionLocal
from app.core.startup import create_first_admin
from app.routers import auth
from app.routers import categories
from app.routers import courses
from app.routers import lessons
from app.routers import Module
from app.routers import enrollments
from app.routers import dashboard
from app.routers import users
from app.routers import reports
from app.routers import announcements
from app.routers import quizzes
from app.routers import assignment
from app.routers import certificates
from app.routers import uploads

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting HR LMS API...")
    db = SessionLocal()
    try:
        create_first_admin(db)
    finally:
        db.close()
    yield
    logger.info("Shutting down HR LMS API...")


limiter = Limiter(key_func=get_remote_address)
security = HTTPBearer()

app = FastAPI(
    title="HR LMS API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url="/redoc" if settings.environment == "development" else None,
    swagger_ui_parameters={"persistAuthorization": True}
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

allowed_origins = (
    ["http://localhost:5173", "http://localhost:3000"]
    if settings.environment == "development"
    else ["https://yourdomain.com"]
)

app.mount("/media", StaticFiles(directory="uploads"), name="media")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled error on {request.method} {request.url}: {exc}",
        exc_info=True
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )


app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(courses.router)
app.include_router(lessons.router)
app.include_router(Module.router)
app.include_router(enrollments.router)
app.include_router(dashboard.router)
app.include_router(users.router)
app.include_router(reports.router)
app.include_router(announcements.router)
app.include_router(quizzes.router)
app.include_router(assignment.router)
app.include_router(certificates.router)
app.include_router(uploads.router)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "environment": settings.environment
    }