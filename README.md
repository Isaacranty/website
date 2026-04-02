# Multi-Language Website Demo

This project is a self-contained full-stack demo combining multiple languages:

- Frontend: HTML, CSS, JavaScript
- Backend services: Node.js (Express), Python (Flask), Go (net/http)
- Optional: PHP endpoint
- Orchestration: Docker Compose

## Run locally

### Node API

1. `cd api/node`
2. `npm install`
3. `node server.js`

### Python API

1. `cd api/python`
2. `python -m venv venv`
3. `venv\\Scripts\\activate` (Windows) / `source venv/bin/activate`
4. `pip install -r requirements.txt`
5. `python service.py`

### Go API

1. `cd api/go`
2. `go run service.go`

### PHP API

1. `cd api/php`
2. `php -S 0.0.0.0:8082 index.php`

### Tests

- Node: `cd api/node && npm test`
- Python: `cd api/python && pytest -q`
- Go: `cd api/go && go test ./...`

### Frontend

Open `frontend/index.html` in browser or run with any static server.

### Docker Compose (recommended)

`docker-compose up --build`

Then visit `http://localhost:8080`.
