// @ts-nocheck
import { recoverPersonalSignature } from "@metamask/eth-sig-util";
import { bufferToHex } from "ethereumjs-util";
import { docClient } from "../db/dbConfig";
import jwt from "jsonwebtoken";


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
        return {accessToken};
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
            return user;
        } catch (error) {
            throw new Error(error)
        }
    }

    private verifySignature(user: any, signature: string, publicAddress: any) {
        const msg = `I am signing my one-time nonce: ${user.Items[0].nonce}`;

        const msgBufferHex = bufferToHex(Buffer.from(msg, 'utf8'));
				const address = recoverPersonalSignature({
					data: msgBufferHex,
					signature: signature,
				});
        if (address.toLowerCase() === publicAddress.toLowerCase()) {
			return user;
		} else {
            throw new Error(`Signature verification failed`);
        }

        return null;
    }

    private async generateNewNonce(user) {
        
        let nonce = Math.floor(Math.random() * 10000);
        let params: any = {
            TableName: "user_credentials",
            Item: {
                "publicKey": `${user.Items[0].publicKey}`,
                "nonce": nonce,
                "lastLogIn": "23:00:00",
            }
        };

        try {
            let result = await docClient.put(params).promise();
            user.Items[0].nonce = nonce;
            user.Items[0].lastLogIn = "23:00:00";
            return user;
        } catch (error) {
            throw new Error(`Nonce generation failed`);
        }

        
    }

    private async getAccessToken(user, publicAddress) {
        const payload = {
            id: user.Items[0].publicKey,
            publicAddress: publicAddress,
        }
        const token = jwt.sign(payload,this.jwt_secret,
        {
            algorithm: "HS256",
            expiresIn: '12h'
        });
        return token;
    }
}

export default new TestData();