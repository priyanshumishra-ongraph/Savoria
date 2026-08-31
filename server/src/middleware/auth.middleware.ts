import  jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';


export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: 'user' | 'admin';
    };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; role: 'user' | 'admin' };
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
}