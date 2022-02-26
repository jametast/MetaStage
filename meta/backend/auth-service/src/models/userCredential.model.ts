import AWS from "aws-sdk";
import { client, docClient } from "../db/dbConfig";


let tableName = "user_credentials";

let params = {
    TableName: tableName,
    KeySchema: [
        { AttributeName: "publicKey", KeyType: "Hash"}  //Partition key; TODO - check type of partition key
    ],
    AttributeDefinitions: [
        { AttributeName: "publicKey", AttributeType: "S" },
        { AttributeName: "nonce", AttributeType: "N" },
        { AttributeName: "lastLogIn", AttributeType: "S" },
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
    }
};


client.createTable(params, function(tableErr: AWS.AWSError) {
    if (tableErr) {
        console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
    } else {
        console.log("Created table successfully!");
    }
});
