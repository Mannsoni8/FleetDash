import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI?.trim();
const rawPort = process.env.PORT?.trim();
const redisUrl = process.env.REDIS_URL?.trim();
const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
const clientUrl = process.env.CLIENT_URL?.trim() || "http://localhost:5173";

if (!redisUrl) {
    throw new Error("REDIS_URL is not defined");
}

if (!jwtAccessSecret || jwtAccessSecret.length < 32) {
    throw new Error("JWT_ACCESS_SECRET must be configured with at least 32 characters");
}

if (!mongoUri) {
    throw new Error("MONGO_URI is not defined");
}

if (!rawPort) {
    throw new Error("PORT is not defined");
}

const port = Number(rawPort);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port between 1 and 65535");
}

const config = {
    MONGO_URI: mongoUri,
    PORT: port,
    REDIS_URL: redisUrl,
    JWT_ACCESS_SECRET: jwtAccessSecret,
    CLIENT_URL: clientUrl,
};

export default config;
