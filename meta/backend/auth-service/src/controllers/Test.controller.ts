import { Request, Response, NextFunction } from "express";
import TestData from "../services/Test.service";
import { apiErrorHandler } from "../handlers/error.handler";

export default class TestCtrl {
    constructor() { }

    async saveTestData(req: Request, res: Response, next: NextFunction): Promise<any> {

        const { signature, publicAddress } = req.body;

        try {
            const testSaved = await TestData.saveTest({ signature, publicAddress });
            if (testSaved) {
                res.json(testSaved);
            } else {
                throw new Error("Request failed");
            }
        } catch (error) {
            apiErrorHandler(error, req, res, `Request failed`);
        }
    }
}