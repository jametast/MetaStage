import express, { Application } from "express";
import Server from "./src/index";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + '/.env' });
import { client, docClient } from "./src/db/dbConfig";
import createDB from "./src/models/userCredential.model"
import { create } from "domain";

const app: Application = express();
const server: Server = new Server(app);
const port = process.env.PORT;

const fetchData = async () => {
    let params: any = {
        TableName: "user_credentials",
        Item: {
            "publicKey": "dsbbskbkskbskbgsbkgbskbks",
            "nonce": 1,
            "lastLogIn": "23:03:00",
        }
    };

    docClient.put(params, function(err, data) {
        if (err) {
            console.log("Error: ", err);
        } else {
            console.log("Success", data);
        }
    })
}


app.listen(port, () => {
    console.log(`Server listening at ${port}`);
    createDB();
    fetchData();
}).on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
        console.log("Port is already in use.");
    } else {
        console.log("Error: ", err);
    }
});
