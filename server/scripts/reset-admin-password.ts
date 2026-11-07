import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { connectDB } from "../src/config/database.js";
import { User } from "../src/models/user.model.js";

const resetAdminPassword = async (): Promise<void> => {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
    }

    if (password.length < 8 || password.length > 72) {
        throw new Error("Password must contain 8 to 72 characters");
    }

    await connectDB();

    const admin = await User.findOne({ email });

    if (!admin || admin.role !== "admin") {
        throw new Error("Admin account not found");
    }

    admin.password = await bcrypt.hash(password, 12);
    await admin.save();

    console.log("Admin password updated successfully");
};

try {
    await resetAdminPassword();
} catch (error) {
    console.error("Password reset failed:", error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}