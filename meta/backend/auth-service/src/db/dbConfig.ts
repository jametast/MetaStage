import AWS from "aws-sdk";
const CONFIG = process.env;

const awsConfig = {
    "region": CONFIG.REGION,
    "endpoint": CONFIG.ENDPOINT,
    "accessKeyId": CONFIG.ACCESSKEYID,
    "secretAccessKey": CONFIG.SECRETACCESSKEY
};

AWS.config.update(awsConfig);

const docClient = new AWS.DynamoDB.DocumentClient();

export default docClient;