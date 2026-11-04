import type { Request, Response } from "express";
import {
  registerUser,
  loginUser,
} from "../services/auth.service.js";

export const registerController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({
        message: "Name, email, password and role are required",
      });
      return;
    }

    if (!["manager", "driver"].includes(role)) {
      res.status(400).json({
        message: "Invalid registration role",
      });
      return;
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      res.status(400).json({
        message: "Invalid input types",
      });
      return;
    }

    if (name.trim().length < 2 || name.trim().length > 100) {
      res.status(400).json({
        message: "Name must contain 2 to 100 characters",
      });
      return;
    }

    if (
      password.length < 8 ||
      password.length > 72
    ) {
      res.status(400).json({
        message: "Password must contain 8 to 72 characters",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      res.status(400).json({
        message: "Invalid email address",
      });
      return;
    }

    const result = await registerUser({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
    });

    res.status(201).json({
      message: "User registered successfully",
      ...result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      res.status(409).json({
        message: "Email already registered",
      });
      return;
    }

    if (
      error instanceof Error &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        message: "Email already registered",
      });
      return;
    }

    console.error("Registration error:", error);

    res.status(500).json({
      message: "Failed to register user",
    });
  }
};

export const loginController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      res.status(400).json({
        message: "Email and password are required",
      });
      return;
    }

    const result = await loginUser(email, password);

    res.status(200).json({
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_CREDENTIALS") {
        res.status(401).json({
          message: "Invalid email or password",
        });
        return;
      }

      if (error.message === "ACCOUNT_DISABLED") {
        res.status(403).json({
          message: "Your account has been disabled",
        });
        return;
      }
    }

    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed",
    });
  }
};
