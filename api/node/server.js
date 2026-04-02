const app = require('./app');
const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => logger.info(`Node API running at http://0.0.0.0:${PORT}`));
