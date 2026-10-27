import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI?.trim();
const rawPort = process.env.PORT?.trim();

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
};

export default config;
