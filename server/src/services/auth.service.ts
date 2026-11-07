import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import type { IUser, UserRole } from "../types/user.types.js";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role: Extract<UserRole, "manager" | "driver">;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_ACCESS_SECRET must be configured with at least 32 characters"
    );
  }

  return secret;
};

const toSafeUser = (user: IUser & { _id: { toString(): string } }): SafeUser => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
});

const generateAccessToken = (user: SafeUser): string => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: "15m",
    }
  );
};

export const registerUser = async (
  data: RegisterUserInput
): Promise<AuthResponse> => {
  const existingUser = await User.findOne({
    email: data.email.toLowerCase().trim(),
  });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase().trim(),
    password: hashedPassword,
    role: data.role,
  });

  const safeUser = toSafeUser(user);

  return {
    user: safeUser,
    accessToken: generateAccessToken(safeUser),
  };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select("+password");

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (!user.isActive) {
    throw new Error("ACCOUNT_DISABLED");
  }

  const safeUser = toSafeUser(user);

  return {
    user: safeUser,
    accessToken: generateAccessToken(safeUser),
  };
};