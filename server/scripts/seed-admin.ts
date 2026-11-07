import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { connectDB } from "../src/config/database.js";
import { User } from "../src/models/user.model.js";

const seedAdmin = async (): Promise<void> => {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be configured"
    );
  }

  if (name.length < 2 || name.length > 100) {
    throw new Error("Admin name must contain 2 to 100 characters");
  }

  if (password.length < 8 || password.length > 72) {
    throw new Error("Admin password must contain 8 to 72 characters");
  }

  await connectDB();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.role !== "admin") {
      throw new Error("This email already belongs to a non-admin user");
    }

    console.log("Admin already exists. No changes made.");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: "admin",
    isActive: true,
  });

  console.log(`Admin created successfully: ${email}`);
};

try {
  await seedAdmin();
} catch (error) {
  console.error("Admin seeding failed:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}