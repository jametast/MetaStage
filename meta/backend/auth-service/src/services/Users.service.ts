import { docClient } from "../db/dbConfig";

interface IQueryParams {
    TableName: string;
    KeyConditionExpression?: string;
    ExpressionAttributeValues?: {
        [key:string]: string
    }
}


class Users {
    constructor() {}

    async findUser(publicAddress?: any): Promise<any> {

        const { KeyConditionExpression, ExpressionAttributeValues } = this.getQueryConditions(publicAddress);

        
        const queryParams: IQueryParams = {
            TableName: "user_credentials",
            KeyConditionExpression,
            ExpressionAttributeValues,
        };

        try {
            const user = await docClient.query(queryParams).promise();
            return user;
        } catch (error) {
            throw new Error("Failed to fetch data");
        }
    }


    async findByUserId(userId: string): Promise<any> {
        const queryParams: IQueryParams = {
            TableName: "user_credentials",
            KeyConditionExpression: "publicKey = :publicKey",
            ExpressionAttributeValues: {
                ':publicKey': userId
            }
        }

        try {
            const user = await docClient.query(queryParams).promise();
            return user;
        } catch (error) {
            throw new Error("Failed to fetch data");
        }
    }

    async createUser(publicAddress: any): Promise<any> {
        let queryParams = {
            TableName: "user_credentials",
            Item: {
                "publicKey": publicAddress
            },
            
        };

        try {
            const result = await docClient.put(queryParams).promise();
            return result;
        } catch (error) {
            throw new Error("Failed to fetch data");
        }
    }

    async updateUser(userData: any): Promise<any> {
        let user = await this.findUser(userData.publicAddress);
        if (!user) {
            throw new Error("User not exist");
        }

        let {name, profileImageUrl, twitter, fb, linkedIn, youTube, portfolioSite} = userData;

        let queryParams = {
            Item: {
                name: name,
                profileImage: profileImageUrl,
                twitterId: twitter,
                facebookId: fb,
                linkedInId: linkedIn,
                youTubeId: youTube,
                portfolioWebsite: portfolioSite
            },
            TableName: "users",
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ':userId': userData.userId
            }
        }

        try {
            const result = await docClient.put(queryParams).promise();
            return result;
        } catch (error) {
            throw new Error("Failed to fetch data");
        }
    }


    private getQueryConditions(publicAddress: string | undefined): {KeyConditionExpression : string, ExpressionAttributeValues :any} {
        let KeyConditionExpression: string =  publicAddress ?  'publicKey =:publicKey' : "";

        let ExpressionAttributeValues: any = {
            ':publicKey' : publicAddress, 
        }

        return {KeyConditionExpression, ExpressionAttributeValues};
    }

}

export default new Users();