import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, get_db
from sqlalchemy.orm import sessionmaker

# Use an isolated test DB (e.g. in-memory SQLite or a dedicated test schema)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)  # reset state after each test

@pytest.fixture
def registered_user(client):
    resp = client.post("/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpass123"
    })
    return resp

def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_register(client):
    response = client.post("/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpass123"
    })
    assert response.status_code == 201
    assert "access_token" in response.json()

def test_login(client, registered_user):
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_wrong_password(client, registered_user):
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_get_me_without_token(client):
    response = client.get("/auth/me")
    assert response.status_code in (401, 403)  # confirm which your scheme uses

def test_get_me_with_token(client, registered_user):
    login = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123"
    })
    token = login.json()["access_token"]
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"