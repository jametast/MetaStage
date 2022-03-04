import { Application, urlencoded, json, Request, Response, NextFunction } from "express";
import Routes from "./routes";

export default class Server {
    constructor(app: Application) {
        this.config(app);
        new Routes(app);
    }

    public config(app: Application): void {
        app.use(urlencoded({ extended: true }));
        app.use(json());

        // Set response headers
        app.use((req: Request, res: Response, next: NextFunction) => {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, PATCH, DELETE"
            );
            res.setHeader(
                "Access-Control-Allow-Headers", "X-Requested-With, Content-Type, x-access-token"
            );
            res.setHeader("Access-Control-Allow-Credentials", "true");
            next();
        });
    }
}

process.on("beforeExit", (err) => {
    console.log("error", err);
})