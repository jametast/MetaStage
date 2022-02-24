import express, { Application } from "express";
import Server from "./src/index";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + '/.env' });
import docClient from "./src/db/dbConfig";

const app: Application = express();
const server: Server = new Server(app);
const port = process.env.PORT;

const fetchData = () => {
    let params = {
        TableName: "example",
        Key: {
            "name": "Jay",
            "id": 1
        }
    };

    docClient.get(params, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            console.log(data);
        }
    })
}


app.listen(port, () => {
    console.log(`Server listening at ${port}`);
    fetchData();
}).on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
        console.log("Port is already in use.");
    } else {
        console.log("Error: ", err);
    }
});