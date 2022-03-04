import { Request, Response, NextFunction } from "express";

export const apiErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    message: string
) => {
    const error: { Message: string, req: Request, stack: any } = {
        Message: message,
        req: req,
        stack: err
    };

    res.json({ Error: error })
}