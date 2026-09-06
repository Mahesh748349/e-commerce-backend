type LogMeta = unknown;

function write(level: "info" | "warn" | "error", message: string, meta?: LogMeta) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    meta: serializeMeta(meta)
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

function serializeMeta(meta: LogMeta): LogMeta {
  if (meta instanceof Error) {
    return {
      name: meta.name,
      message: meta.message,
      stack: meta.stack
    };
  }

  if (!meta || typeof meta !== "object") {
    return meta;
  }

  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => [
      key,
      value instanceof Error
        ? {
            name: value.name,
            message: value.message,
            stack: value.stack
          }
        : value
    ])
  );
}

export const logger = {
  info: (message: string, meta?: LogMeta) => write("info", message, meta),
  warn: (message: string, meta?: LogMeta) => write("warn", message, meta),
  error: (message: string, meta?: LogMeta) => write("error", message, meta)
};
