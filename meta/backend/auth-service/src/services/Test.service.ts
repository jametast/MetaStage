// @ts-nocheck
import { recoverPersonalSignature } from "@metamask/eth-sig-util";
import { bufferToHex } from "ethereumjs-util";
import { docClient } from "../db/dbConfig";
import jwt from "jsonwebtoken";
import { apiErrorHandler } from "../handlers/error.handler";

interface saveUserRequest {
    signature?: string,
    publicAddress?: string
}
class TestData {

    jwt_secret: string = "abcdefgh123456789posteurnfmkckkskslwjs";
    constructor() {
    }

    async saveTest({ signature, publicAddress }: saveUserRequest): Promise<any | string> {

        if (!signature || !publicAddress) {
            throw new Error("Request should have signature and publicAddress");
        }

        const checkUSer = await this.checkUser({signature, publicAddress});

        // Verify digital signature

        const signatureVerification = await this.verifySignature(checkUSer, signature, publicAddress); 

        // Generate a new nonce for the user

        const generatedNonce = await this.generateNewNonce(signatureVerification);

        // Create JWT

        const accessToken = await this.getAccessToken(generatedNonce, publicAddress);
        
        return accessToken;
    }

    private async checkUser ({signature, publicAddress}: saveUserRequest): Promise<any | string> {

        const params: any = {
            TableName: "user_credentials",
            KeyConditionExpression: 'publicKey = :publicKey',
            ExpressionAttributeValues: {
                ':publicKey': publicAddress
            }
        }

        try {
            const user = await docClient.query(params).promise();
            console.log("--------Response",user);

            
            return user;
        } catch (error) {
            return error;
        }
    }

    private verifySignature(user: any, signature: string, publicAddress: any) {

        const msg = `I am signing my one-time nonce: ${user.nonce}`;

        const msgBufferHex = bufferToHex(Buffer.from(msg, 'utf8'));
				const address = recoverPersonalSignature({
					data: msgBufferHex,
					sig: signature,
				});

        if (address.toLowerCase() === publicAddress.toLowerCase()) {
			return user;
		} else {
            apiErrorHandler("error", signature, publicAddress, `Signature verification failed`);
        }

        return null;
    }

    private async generateNewNonce(user) {
        user.nonce = Math.floor(Math.random() * 10000);
        let params: any = {
            TableName: "user_credentials",
            Item: {
                "publicKey": "dsbbskbkskbskbgsbkgbskbks",
                "nonce": 1,
                "lastLogIn": "23:03:00",
            }
        };

        await docClient.put(params, (err: any, data: any) => {
            if (data) {
                return data;
            } else {
                apiErrorHandler(err, data.publicKey, data.nonce, `Nonce generation failed`);
            }
        })
    }

    private async getAccessToken(user, publicAddress) {
        const token = await jwt.sign({
            payload: {
                id: user.id,
                publicAddress,
            },
        },
        this.jwt_secret,
        {
            algorithm: "HS256",
        },
        (err, token) => {
            if (err) {
                return err;
            }
            if (!token) {
                return new Error('Empty token');
            }
            return token;
        }
    );

    return token;
    }
}

export default new TestData();