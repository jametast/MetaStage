import { Application } from "express";
import TestRoutes from "./Test.routes";

export default class Routes {
    constructor(app: Application) {
        app.use("/api/test", TestRoutes);
    }
}
