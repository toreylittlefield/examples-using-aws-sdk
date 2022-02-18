require('dotenv').config();
const AWS = require('aws-sdk');

const credentials = new AWS.SharedIniFileCredentials({ profile: process.env.AWS_CLI_PROFILE });
AWS.config.credentials = credentials;

AWS.config.update({ region: 'ap-southeast-2' });

const docClient = new AWS.DynamoDB.DocumentClient();

const apiGateway = new AWS.ApiGatewayManagementApi({ endpoint: process.env.WS_ENDPOINT });

/**
 * @typedef {AWS.DynamoDB.DocumentClient.QueryInput} QueryInput
 * @type {QueryInput}
 */
const params = {
  KeyConditionExpression: 'BoardId = :BoardId',
  ExpressionAttributeValues: {
    ':BoardId': 'f992080c-e2b1-4959-a617-267b3686497f',
  },
  TableName: 'BoardTable_WSConnections_Test',
  ProjectionExpression: 'active_ws_connections',
};

/**
 * @param {QueryInput} params valid aws query input parameters
 * @param {string} attrName the attribute name for the connectionIds
 * @returns {string[]} - the connectionIds in the board
 */
async function getConnectionIds(params, attrName) {
  return await docClient
    .query(params)
    .promise()
    .then((res) => {
      const [items] = res.Items;
      /**
       * @type {Set}
       */
      const { values: connectionIds } = items[attrName];
      return connectionIds;
    })
    .catch((err) => {
      console.error(err.message);
      return [];
    });
}

/**
 * @param {string[]} connectionIds
 * @param {object} message
 */
async function broadMessageToConnections(connectionIds, message) {
  return await Promise.allSettled(
    connectionIds.map(async (connectionId) =>
      apiGateway.postToConnection({ ConnectionId: connectionId, data: message }).promise()
    )
  );
}

(async () => {
  const connectionIds = await getConnectionIds(params, 'active_ws_connections');
  console.log({ connectionIds });
  const res = await broadMessageToConnections(connectionIds, '');
  console.log(JSON.stringify(res, null, 2));
})();
