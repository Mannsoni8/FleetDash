import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import type { UserRole } from "../types/user.types.js";
import { User } from "../models/user.model.js";

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: UserRole;
    };
}

const getJwtSecret = (): string => {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error("JWT_ACCESS_SECRET is not configured correctly");
    }

    return secret;
};

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      res.status(401).json({
        message: "Authentication token is missing",
      });
      return;
    }

    const decoded = jwt.verify(token, getJwtSecret());

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string"
    ) {
      res.status(401).json({
        message: "Invalid access token",
      });
      return;
    }

    const user = await User.findById(decoded.sub)
      .select("_id role isActive");

    if (!user || !user.isActive) {
      res.status(401).json({
        message: "User account is invalid or disabled",
      });
      return;
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
    };

    next();
  } catch {
    res.status(401).json({
      message: "Invalid or expired access token",
    });
  }
};