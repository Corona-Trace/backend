// Imports the Google Cloud client library. v1 is for the lower level
// proto access.
import admin from 'firebase-admin';
import bunyan from "bunyan";
import { v1 } from "@google-cloud/pubsub";
import config from "../config";

const projectId = config.projectId;
const subscriptionName = config.pushNotificationTopic;

const log = bunyan.createLogger({ name: "push_notification_consumer" });

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

// Creates a client; cache this for further use.
const subClient = new v1.SubscriberClient();

async function synchronousPull() {
  const formattedSubscription = subClient.subscriptionPath(
    projectId,
    subscriptionName
  );

  // The maximum number of messages returned for this request.
  // Pub/Sub may return fewer than the number specified.
  const request = {
    subscription: formattedSubscription,
    maxMessages: 500,
  };

  // The subscriber pulls a specified number of messages.
  const [response] = await subClient.pull(request);

  // Process the messages.
  const ackIds = [];
  // Create a list containing up to 500 messages.
  const messages = [];
  for (const message of response.receivedMessages) {
    log.info(`Received message: ${message.message.data}`);
    // This registration token comes from the client FCM SDKs.
    var registrationToken = message.message.data.push_notification_token;

    messages.push({
      notification: {title: 'Corona Trace Alert', body: 'Main copy here'},
      token: registrationToken,
    });
    ackIds.push(message.ackId);
  }
  const sendResponse = await admin.messaging().sendAll(messages);

  log.info(sendResponse.successCount + ' messages were sent successfully');
  // Acknowledge all of the messages. You could also ackknowledge
  // these individually, but this is more efficient.
  const ackRequest = {
    subscription: formattedSubscription,
    ackIds: ackIds,
  };
  await subClient.acknowledge(ackRequest);

  log.info('Done.');
}

export function processNotificationQueue() {
  synchronousPull().catch(log.error);
}
