import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_root_redirect():
    response = client.get("/")
    # Should redirect to /static/index.html
    assert response.status_code in (200, 307, 302)
    assert "text/html" in response.headers.get("content-type", "")

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]

def test_signup_and_unregister():
    # Use a unique email for test
    test_email = "pytestuser@mergington.edu"
    activity = "Chess Club"
    # Unregister if present
    client.delete(f"/activities/{activity}/unregister?email={test_email}")
    # Signup
    resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")
    # Duplicate signup should fail
    resp2 = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp2.status_code == 400
    # Unregister
    resp3 = client.delete(f"/activities/{activity}/unregister?email={test_email}")
    assert resp3.status_code == 200
    assert "Unregistered" in resp3.json().get("message", "")
    # Unregister again should fail
    resp4 = client.delete(f"/activities/{activity}/unregister?email={test_email}")
    assert resp4.status_code == 400
