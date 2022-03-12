import {Router} from "express";
import jwt from "express-jwt";
import UsersCtrl from "../controllers/Users.controller";

interface config {
    algorithms: [string];
    secret: string;
}

class User {
    router: Router = Router();
    userCtrl: UsersCtrl = new UsersCtrl();
    /**
     * JWT validator
     */
    jwtConfig: config = {
        algorithms: ['HS256' as const],
        secret: 'abcdefgh123456789posteurnfmkckkskslwjs'
    }
    constructor() {
        this.intializeRoutes();    
    }

    intializeRoutes(): void {

        /**
         * GET /api/user
         * Get all users
        */

        this.router.route("/").get(this.userCtrl.findUser);

        /**
         * GET /api/user/:userId
         * Authenticated route
         */

        this.router.route("/:userId").get(jwt(this.jwtConfig), this.userCtrl.findByUserId);

        /**
         * POST /api/user
         */

        this.router.route("/").post(this.userCtrl.createUser);

        /**
         * UPDATE/PATCH /api/user/:userId
         * Authenticated route
         */
        this.router.route("/:userId").patch(jwt(this.jwtConfig), this.userCtrl.updateUser);
    }
}

export default new User().router;