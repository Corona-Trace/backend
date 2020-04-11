import bunyan from "bunyan";
import Promise from "bluebird";
import { BigQuery, BigQueryDatetime } from "@google-cloud/bigquery";
import { PubSub } from "@google-cloud/pubsub";
import template from "lodash.template";
import fs from "fs";
import config from "../config";
const Bigtable = require("@google-cloud/bigtable");
const BIGTABLE_INSTANCE = process.env.BIGTABLE_INSTANCE || config.bigtableInstance || "localhost:8086";
const PROJECT_ID = process.env.PROJECT_ID || config.projectId;

const log = bunyan.createLogger({ name: "matcher" });
log.info("Loading SQL-query");
const queryRaw = fs.readFileSync('sql/query.sql', 'utf8');
log.info("Compiling SQL-query");
const queryCompiled = template(queryRaw, {});
log.info("SQL-query compiled");

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
    return queryCompiled(Object.assign(config, {
      runSince: runSince.toISOString()
    }));
}


// console.log(generateQuery(new Date()))

const bigtable = Bigtable({ projectId: PROJECT_ID });
const bigquery = new BigQuery({ projectId: PROJECT_ID });
const pubsub = new PubSub({ projectId: PROJECT_ID });
const notificationTopic = pubsub.topic(config.pushNotificationTopic);
const btInstance = bigtable.instance(BIGTABLE_INSTANCE)

const filter = [
    {
      column: {
        cellLimit: 1, // Only retrieve the most recent version
      },
    },
  ];

const checkpointsTable = btInstance.table('checkpoints');
const lastMatcherRun = checkpointsTable.row('last_matcher_run').get({filter});
let runAt: null | string = null;
lastMatcherRun.then(([row]: any) => row.data.payload)
.then((payload: any) => new Date(payload.run_ts[0].value))
.then((lastRunAt: Date) => {
    log.info(`Last run at ${lastRunAt}`);
    log.info(`Query infected since ${lastRunAt}`);
    // Generate query taking all results since last run
    const query = generateQuery(lastRunAt);
    return bigquery.createQueryJob(query)
})
.then(([job]: any) => job.getQueryResults())
.then(([rows]: any) => {
    // Mark checkpoint
    runAt = new Date().toISOString();
    log.info(`Pushing ${rows.length} infections into push notification queue`)
    return Promise.all(rows.map((row: MatchRow) => {
        return notificationTopic.publish(Buffer.from(JSON.stringify(row)))
    }, {concurrency: 100}))
}).then((notifications: any) => {
    log.info(`${notifications.length} notifications sent!`);
    log.info("Saving checkpoint...");
    return checkpointsTable.row('last_matcher_run').save({
        payload: {run_ts: runAt}
    })
}).then((_: any) => {
    log.info("Done!");
})
.catch((error:any) => {
    log.error(error)
})