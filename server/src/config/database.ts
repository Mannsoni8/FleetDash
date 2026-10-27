import mongoose from "mongoose";
import config from "./env.js";

export const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
    }
};
