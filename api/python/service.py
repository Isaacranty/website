from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost", "http://localhost:8080"]}})

quotes = [
    'Python makes it easy to write prototypes quickly.',
    'Readability counts.',
    'Pythonic is better than non-pythonic.'
]

TOKEN = 'PYTHON_SECRET_TOKEN'

notes = []

@app.route('/status')
def status():
    logging.info('status hit')
    return jsonify({'status': 'python up', 'time': datetime.utcnow().isoformat() + 'Z', 'env': 'production'})

@app.route('/auth/login', methods=['POST'])
def auth_login():
    payload = request.get_json(force=True, silent=True) or {}
    if payload.get('username') == 'admin' and payload.get('password') == 'admin':
        return jsonify({'token': TOKEN})
    return jsonify({'error': 'invalid credentials'}), 401


def require_auth():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return False
    return auth.split(' ')[1] == TOKEN

@app.route('/echo', methods=['POST'])
def echo():
    if not require_auth():
        return jsonify({'error': 'unauthorized'}), 401
    payload = request.get_json(force=True, silent=True) or {}
    message = payload.get('message')
    if not message or not isinstance(message, str):
        logging.warning('echo bad request: %s', payload)
        return jsonify({'error': 'message is required and must be a string'}), 400

    note = {'message': message, 'ts': datetime.utcnow().isoformat() + 'Z'}
    notes.append(note)
    response = {'engine': 'python', 'message': message, 'received': datetime.utcnow().isoformat() + 'Z'}
    logging.info('echo response: %s', response)
    return jsonify(response)

@app.route('/notes')
def list_notes():
    if not require_auth():
        return jsonify({'error': 'unauthorized'}), 401
    return jsonify({'notes': notes})

@app.route('/quote')
def quote():
    q = quotes[datetime.utcnow().second % len(quotes)]
    logging.info('quote hit: %s', q)
    return jsonify({'engine': 'python', 'quote': q})

@app.route('/metrics')
def metrics():
    return 'python_uptime_seconds %s\n' % (datetime.utcnow() - datetime(1970,1,1)).total_seconds(), 200, {'Content-Type': 'text/plain'}

@app.errorhandler(Exception)
def handle_error(e):
    logging.exception('Unhandled exception')
    return jsonify({'error': 'internal server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
