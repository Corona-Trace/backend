import bunyan from "bunyan";
import { BigQuery, BigQueryDatetime } from "@google-cloud/bigquery";
import { PubSub } from "@google-cloud/pubsub";
import template from "lodash.template";
import fs from "fs";
import config from "../config";
const Bigtable = require("@google-cloud/bigtable");
const BIGTABLE_INSTANCE =
  process.env.BIGTABLE_INSTANCE || config.bigtableInstance || "localhost:8086";
const PROJECT_ID = process.env.PROJECT_ID || config.projectId;

const log = bunyan.createLogger({ name: "matcher" });
console.log("Loading SQL-query");
const queryRaw = fs.readFileSync("sql/query.sql", "utf8");
console.log("Compiling SQL-query");
const queryCompiled = template(queryRaw, {});
console.log("SQL-query compiled");

type GeoEntry = {
  value: string; // Polygon(...) or similar string used that can be used to insert to bigquery -- default query result fmt
};

export type MatchRow = {
  ts: BigQueryDatetime; // ISO fmt string timestamp
  // eslint-disable-next-line @typescript-eslint/camelcase
  user_id: string;
  // eslint-disable-next-line @typescript-eslint/camelcase
  push_notification_token: string;
  segment: GeoEntry;
  // eslint-disable-next-line @typescript-eslint/camelcase
  infecting_user: string; // uuid string
  // eslint-disable-next-line @typescript-eslint/camelcase
  infecting_segment: GeoEntry;
};

function generateQuery(runSince: Date): string {
  return queryCompiled(
    Object.assign(config, {
      runSince: runSince.toISOString(),
    })
  );
}

// console.log(generateQuery(new Date()))

const bigtable = Bigtable({ projectId: PROJECT_ID });
const bigquery = new BigQuery({ projectId: PROJECT_ID });
const pubsub = new PubSub({ projectId: PROJECT_ID });
const notificationTopic = pubsub.topic(config.pushNotificationTopic);
const btInstance = bigtable.instance(BIGTABLE_INSTANCE);

const filter = [
  {
    column: {
      cellLimit: 1, // Only retrieve the most recent version
    },
  },
];

export async function matcher(): Promise<void> {
  console.log("Starting matcher");
  let runAt: null | string = null;

  const checkpointsTable = btInstance.table("checkpoints");
  const [row] = await checkpointsTable.row("last_matcher_run").get({ filter });
  console.log("checkpoints table result", row);

  const lastRunAt = row
    ? new Date(row.data.payload.run_ts[0].value)
    : new Date(0);

  console.log(`Last run at ${lastRunAt}`);
  console.log(`Query infected since ${lastRunAt}`);

  const query = generateQuery(lastRunAt);
  const [job] = await bigquery.createQueryJob(query);
  const [rows] = await job.getQueryResults();

  runAt = new Date().toISOString();
  console.log(`Pushing ${rows.length} infections into push notification queue`);
  const notifications = await Promise.all(
    rows.map(
      (row: MatchRow) => {
        return notificationTopic.publish(Buffer.from(JSON.stringify(row)));
      },
      { concurrency: 100 }
    )
  );

  console.log(`${notifications.length} notifications sent!`);
  console.log("Saving checkpoint...");
  await checkpointsTable.row("last_matcher_run").save({
    payload: { run_ts: runAt },
  });
  console.log("Done!");
}

if (require.main === module) {
  matcher()
    .then(() => {
      console.log("run() completed");
    })
    .catch((e) => {
      console.error("error", e);
      process.exit(1);
    });
}
