export const SALT_ROUNDS = 10;

export const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

export const DEFAULT_SPEED_MULTIPLIER = 6;
export const DEFAULT_TICK_MS = 1000;

// Origens do front end liberadas no CORS (HTTP e socket.io), separadas por
// vírgula em CORS_ORIGIN. Não use "*": não funciona com credentials.
const DEFAULT_CORS_ORIGIN = "http://localhost:3000";

const parseOrigins = (value = "") => {
  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : [DEFAULT_CORS_ORIGIN];
};

export const CORS_ORIGIN = parseOrigins(process.env.CORS_ORIGIN);
