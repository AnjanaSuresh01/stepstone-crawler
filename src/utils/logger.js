const levels = { debug: 10, info: 20, warn: 30, error: 40 };
const CURRENT = (process.env.LOG_LEVEL || "info").toLowerCase();

function ok(level) {
  return levels[level] >= levels[CURRENT];
}

export const logger = {
  debug: (...args) => { if (ok("debug")) console.debug("[DEBUG]", ...args); },
  info:  (...args) => { if (ok("info"))  console.info("[INFO]",  ...args); },
  warn:  (...args) => { if (ok("warn"))  console.warn("[WARN]",  ...args); },
  error: (...args) => { if (ok("error")) console.error("[ERROR]", ...args); },
};
