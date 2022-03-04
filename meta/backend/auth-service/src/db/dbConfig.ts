import AWS from "aws-sdk";

const CONFIG = process.env;
console.log("-------Config", CONFIG.ENDPOINT)
const awsConfig = {
    "region": "us-east-1",
    "endpoint": "dynamodb.us-east-1.amazonaws.com",
    "accessKeyId": "AKIARTTEXZSSDHR7SGCY",
    "secretAccessKey": "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"
};

AWS.config.update(awsConfig);

const client = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

export { client, docClient };
