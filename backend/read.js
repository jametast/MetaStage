var AWS = require("aws-sdk");
let awsConfig = {
    "region": "us-east-2",
    "endpoint": "http://dynamodb.us-east-2.amazonaws.com",
    "accessKeyId": "AKIASV4U6AJV6IORSV4L",
    "secretAccessKey": "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"
}
AWS.config.update(awsConfig);

let docClient = new AWS.DynamoDB.DocumentClient();
let fetchOneByKey = function() {
    var params = {
        TableName: "users",
        Key: {
            "email_id": "bob@example.com"
        }
    };

        docClient.get(params, function(err, data) {
            if (err) {
                console.log("users::fetchOneByKey::error - " + JSON.stringify(err, null, 2));
            } else {
                console.log("users::fetchOneByKey::success - " + JSON.stringify(data, null, 2));
            }
        })
}

fetchOneByKey();