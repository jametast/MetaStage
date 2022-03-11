import { Request, Response, NextFunction } from "express";
import UsersService from "../services/Users.service";
import { apiErrorHandler } from "../handlers/error.handler";

export default class UsersCtrl {
    constructor() {}

    // Find all users, or one user if public Address provided
    async findUser(req: Request, res: Response, next: NextFunction): Promise<any> {
        // If query string has publicAddress, then filter result
        const { publicAddress } = req.query || ""; 
        try {
            const users = await UsersService.findUser(publicAddress);
            res.json(users);
        } catch (error) {
            apiErrorHandler(error, req, res, `Reqeust failed`);
        }
    }

    // Find user by userId
    async findByUserId(req: Request, res: Response, next: NextFunction): Promise<any> {
        /**
         * JWT payload in req.user.payload
         * UserId in /users/:userId
         * 
         * Require payload.id == userId
         */

        if ((req as any).user?.payload.id !== +req.params.userId) {
            return res
			.status(401)
			.send({ error: 'You can can only access yourself' });
        }

        let { userId } = req.params;

        try {
            const user = await UsersService.findByUserId(userId);
            res.json(user);
        } catch (error) {
            apiErrorHandler(error, req, res, `Reqeust failed`);
        }
    }

    // Create a new user
    async createUser(req: Request, res: Response, next: NextFunction): Promise<any> {
        let { user } = req.body;

        try {
            const createdUser = await UsersService.createUser(user);
            res.json(createdUser);
        } catch (error) {
            apiErrorHandler(error, req, res, `Reqeust failed`);
        }
    }

    async updateUser(req: Request, res: Response, next: NextFunction): Promise<any> {

        if ((req as any).user?.payload.id !== +req.params.userId) {
            return res
			.status(401)
			.send({ error: 'You can can only update yourself' });
        }

        let {userData} = req.body;

        try {
            const updatedUser = await UsersService.updateUser(userData);
            res.json(updatedUser);
        } catch (error) {
            apiErrorHandler(error, req, res, `Reqeust failed`);
        }
    }
}