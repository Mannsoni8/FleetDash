import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./auth.middleware.js";
import type { UserRole } from "../types/user.types.js";

export const authorize = (...allowedRoles: UserRole[]) => {
    return (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): void => {
        if (!req.user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                message: "You do not have permission to perform this action",
            });
            return;
        }

        next();
    };
};