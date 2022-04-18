import {Router} from "express";
import jwt from "express-jwt";
import UsersCtrl from "../controllers/Users.controller";
import multer from "multer";
interface config {
    algorithms: [string];
    secret: string;
}

class User {
    router: Router = Router();
    userCtrl: UsersCtrl = new UsersCtrl();
    upload:any;
    /**
     * JWT validator
     */
    jwtConfig: config = {
        algorithms: ['HS256' as const],
        secret: 'abcdefgh123456789posteurnfmkckkskslwjs'
    }
    constructor() {

        this.intializeRoutes(); 
        const storage = multer.diskStorage({
            destination: function(req, file, cb) {
                cb(null, '../public/uploads/')
            },
            filename: function(req, file, cb) {
                cb(null, file.originalname);
            }
        });

        const fileFilter = (req: any, file: any, cb: any) => {
            if(file.mimetype === "image/jpg"  || file.mimetype ==="image/jpeg"  || file.mimetype ===  "image/png"){
                cb(null, true);
            } else {
                cb(new Error("Image uploaded is not of type jpg/jpeg or png"),false);
            }
        }

        this.upload = multer({storage: storage, fileFilter: fileFilter});   
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
        this.router.route("/:userId").patch(jwt(this.jwtConfig), this.upload.single('file'),this.userCtrl.updateUser);
    }
}

export default new User().router;