import { Router } from "express";
import TestCtrl from "../controllers/Test.controller";

class Test {
    router: Router = Router();
    testCtrl: TestCtrl = new TestCtrl();
    constructor() {
        this.intializeRoutes();
    }

    intializeRoutes(): void {
        this.router.route("/").post(this.testCtrl.saveTestData);
    }

}
export default new Test().router;