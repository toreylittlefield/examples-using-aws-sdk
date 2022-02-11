require('dotenv').config();

const AWS = require('aws-sdk');

const ENDPOINT = process.env.WS_ENDPOINT;
const TABLE_NAME = process.env.TABLE_NAME;

const credentials = new AWS.SharedIniFileCredentials({ profile: 'roar-coders-torey' });
AWS.config.credentials = credentials;

AWS.config.update({ region: 'ap-southeast-2' });

const docClient = new AWS.DynamoDB.DocumentClient();

const apiGateway = new AWS.ApiGatewayManagementApi({ endpoint: ENDPOINT });

/**
 * @typedef {AWS.DynamoDB.DocumentClient.ScanInput} ScanInput
 * @type {ScanInput}
 */
const params = {
  // KeyConditionExpression: 'BoardId = :BoardId',
  // ExpressionAttributeValues: {
  //   ':BoardId': 'f992080c-e2b1-4959-a617-267b3686497f',
  // },
  TableName: TABLE_NAME,
  // ProjectionExpression: '',
};

/**
 * @param {ScanInput} params valid aws query input parameters
 * @param {string} attrName the attribute name for the connectionIds
 * @returns {string[]} - the connectionIds in the board
 */
async function getConnectionIds(params, attrName) {
  return await docClient
    .scan(params)
    .promise()
    .then((res) => {
      /**
       * @typedef {{ConnectionId: string}} Item
       * @type {Item[]}
       */
      const items = res.Items;
      const connectionIds = items.map((item) => item.ConnectionId);
      console.log(JSON.stringify(connectionIds, null, 2));
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
      apiGateway.postToConnection({ ConnectionId: connectionId, Data: message }).promise()
    )
  );
}

(async () => {
  const connectionIds = await getConnectionIds(params, 'active_ws_connections');
  console.log({ connectionIds });

  const res = await broadMessageToConnections(connectionIds, 'hello from node.js');
  console.log(JSON.stringify(res, null, 2));
})();
