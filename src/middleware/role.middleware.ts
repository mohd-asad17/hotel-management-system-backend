import {Request, Response, NextFunction } from "express";
import { Role } from '../generated/prisma/client'

export function roleMiddleware(role: Role) {
    return (req: Request, res: Response, next: NextFunction) => {
        if(!req.user) {
            return res.status(401).json({
                success: false,
                data: null,
                error: "UNAUTHORIZED"
            });
        }
        if(req.user.role !== role) {
            return res.status(403).json({
                success: false,
                data: null,
                error: "FORBIDDEN"
            });
        }

        next();
    }

}