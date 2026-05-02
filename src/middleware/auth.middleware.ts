import {Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from "../config";


export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if(!header || !header.startsWith('Bearer')){
        return res.status(400).json({ success: false, data: null, error: "UNAUTHORIZED" });
    }
    const token = header.split(' ')[1];

    try {
        const  payload = jwt.verify(token, JWT_SECRET) as {
            id: string;
            role: string;
            email: string;

        };

        // Attach auth context without requiring global Express type augmentation.
        (req as any).user = { id: payload.id, role: payload.role, email: payload.email };
        next();
    } 
    catch {
        return res.status(400).json({
            success: false, data: null, error: "UNAUTHORIZED"
        })
    }
}