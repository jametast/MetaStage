import AWS from "aws-sdk";
import { client, docClient } from "../db/dbConfig";


const createDB = () => {
    let tableName: string = "user_credentials";

    let params: any = {
        TableName: tableName,
        KeySchema: [
            { AttributeName: "publicKey", KeyType: "HASH" },
        ],
        AttributeDefinitions: [
            { AttributeName: "publicKey", AttributeType: "S" },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10
        }
    };


    client.createTable(params, function (tableErr: AWS.AWSError) {
        if (tableErr) {
            console.error("Error JSON:", JSON.stringify(tableErr, null, 2));
        } else {
            console.log("Created table successfully!");
        }
    });

    // client.createTable(params).promise().catch(err => { console.log("-------"); console.log(err) });
    // client.deleteTable({ TableName: tableName }).promise().catch(err => { console.log("--------"); console.log(err)});
}

export default createDB;