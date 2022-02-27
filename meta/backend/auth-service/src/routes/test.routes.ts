import { Request, Response, NextFunction, Router } from "express";
import Test from "../services/Test.service";

class TestRoutes {
    router: Router = Router();
    constructor() {

    }

    TestTable(req: Request, res: Response, next: NextFunction): void {
        this.router.route("./Test/").post(Test.TestTest(req, res));
    }
}