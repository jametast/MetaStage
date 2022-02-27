import { resolve } from "path/posix";
import { Response } from "express";
import { docClient } from "../db/dbConfig";


class TestService {
    constructor() {

    }

    TestTest({ data }: any, res: Response): any {
        let params: any = {
            TableName: "user_credentials",
            Key: {
                "publicKey": "dsbbskbkskbskbgsbkgbskbks",
                "nonce": 1,
                "lastLogIn": "23:03:00",
            }
        };

        docClient.put(params, (errr, data) => {
            if (data) {
                res.json(data);
            } else {
                res.json(errr.toString());
            }
        })


    };
}

export default new TestService();