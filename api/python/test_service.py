import requests

BASE = 'http://localhost:5000'

def test_status():
    resp = requests.get(f'{BASE}/status', timeout=5)
    assert resp.status_code == 200
    assert resp.json().get('status') == 'python up'


def test_echo_bad():
    login = requests.post(f'{BASE}/auth/login', json={'username': 'admin', 'password': 'admin'}, timeout=5)
    assert login.status_code == 200
    token = login.json().get('token')
    resp = requests.post(f'{BASE}/echo', json={'message': ''}, headers={'Authorization': f'Bearer {token}'}, timeout=5)
    assert resp.status_code == 400


def test_quote():
    resp = requests.get(f'{BASE}/quote', timeout=5)
    assert resp.status_code == 200
    assert 'quote' in resp.json()
