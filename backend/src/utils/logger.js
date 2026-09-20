const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.INFO;

function formatTimestamp() {
  return new Date().toISOString();
}

function log(level, context, message, data = null) {
  if (LOG_LEVELS[level] < currentLevel) return;
  const entry = {
    timestamp: formatTimestamp(),
    level,
    context,
    message,
    ...(data && { data }),
  };
  const prefix = `[${entry.timestamp}] [${level}] [${context}]`;
  if (level === 'ERROR') {
    console.error(`${prefix} ${message}`, data || '');
  } else if (level === 'WARN') {
    console.warn(`${prefix} ${message}`, data || '');
  } else {
    console.log(`${prefix} ${message}`, data || '');
  }
}

module.exports = {
  debug: (ctx, msg, data) => log('DEBUG', ctx, msg, data),
  info: (ctx, msg, data) => log('INFO', ctx, msg, data),
  warn: (ctx, msg, data) => log('WARN', ctx, msg, data),
  error: (ctx, msg, data) => log('ERROR', ctx, msg, data),
};
