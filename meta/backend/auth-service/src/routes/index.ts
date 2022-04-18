import { Application } from "express";
import TestRoutes from "./Test.routes";
import UsersRoutes from "./Users.routes";

export default class Routes {
    constructor(app: Application) {
        app.use("/api/auth", TestRoutes);
        app.use("/api/users", UsersRoutes);
    }
}
