const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pino = require('pino');
const pinoHttp = require('pino-http');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({ origin: ['http://localhost', 'http://localhost:8080'] }));
app.use(express.json());

const quotes = [
  'Simplicity is the soul of efficiency. - Austin Freeman',
  'Code is like humor. When you have to explain it, its bad. - Cory House',
  'Fix the cause, not the symptom. - Steve Maguire',
  'Small teams, clear mission, faster momentum.',
];

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/status', (req, res) => {
  req.log.info({ route: '/status' }, 'Status check');
  res.json({ status: 'node up', pid: process.pid, env: process.env.NODE_ENV || 'development' });
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username/password required' });

  db.get('SELECT * FROM users WHERE username=? AND password=?', [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: 'db error' });
    if (!row) return res.status(401).json({ error: 'invalid login' });

    const token = jwt.sign({ userId: row.id, username: row.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
});

app.post('/echo', authMiddleware, (req, res) => {
  const { message } = req.body || {};
  req.log.info({ route: '/echo', user: req.user?.username, message }, 'Echo called');

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message must be a non-empty string' });
  }

  db.run('INSERT INTO notes (text, created_at) VALUES (?, ?)', [message, new Date().toISOString()]);
  return res.json({ engine: 'node', message, timestamp: new Date().toISOString() });
});

app.get('/notes', authMiddleware, (req, res) => {
  db.all('SELECT id, text, created_at FROM notes ORDER BY created_at DESC LIMIT 20', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'db error' });
    res.json({ notes: rows });
  });
});

app.get('/quote', (req, res) => {
  const choice = quotes[Math.floor(Math.random() * quotes.length)];
  req.log.info({ route: '/quote', quote: choice }, 'Quote returned');
  res.json({ engine: 'node', quote: choice });
});

app.get('/metrics', (req, res) => {
  res.type('text/plain');
  res.send('# HELP app_uptime_seconds Application uptime in seconds\napp_uptime_seconds ' + (process.uptime()));
});

app.use((err, req, res, next) => {
  req.log.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
