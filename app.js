const AWS = require('aws-sdk');

const credentials = new AWS.SharedIniFileCredentials({ profile: 'roar-coders-torey' });
AWS.config.credentials = credentials;

AWS.config.update({ region: 'ap-southeast-2' });

const docClient = new AWS.DynamoDB.DocumentClient();

/**
 * @type {AWS.DynamoDB.DocumentClient.QueryInput}
 */
const params = {
  KeyConditionExpression: 'BoardId = :BoardId',
  ExpressionAttributeValues: {
    ':BoardId': 'f992080c-e2b1-4959-a617-267b3686497f',
  },
  TableName: 'BoardTable_WSConnections_Test',
  ProjectionExpression: 'active_ws_connections',
};

docClient
  .query(params)
  .promise()
  .then((res) => {
    console.log(JSON.stringify(res, null, 2));
  })
  .catch((err) => {
    console.log(err.message);
  });
