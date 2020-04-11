import express from "express";
import bodyParser from "body-parser";
import bunyan from "bunyan";
import { Bigtable } from "@google-cloud/bigtable";
import { BigQuery } from "@google-cloud/bigquery";
import * as admin from "firebase-admin";

import { TraceRequestBody, MatchRow } from "./types";
import { mkUsers } from "./controllers/users";

const BIGTABLE_INSTANCE = process.env.BIGTABLE_INSTANCE || "localhost:8086";
const PROJECT_ID = process.env.PROJECT_ID;
const MATCHING_TOKEN = process.env.MATCHING_TOKEN; // used to verify the origin of the request that triggers heavy bq queries

const bigtable = new Bigtable({ projectId: PROJECT_ID });
const bigquery = new BigQuery({ projectId: PROJECT_ID });

const log = bunyan.createLogger({ name: "api" });

// TODO
// admin.initializeApp({
//   projectId: PROJECT_ID,
// });

async function main(): Promise<void> {
  const bg = bigtable.instance(BIGTABLE_INSTANCE);

  const Traces = bg.table("traces");
  const Users = bg.table("users");

  const app = express();
  app.use(bodyParser.json({ limit: "10mb" }));

  app.post("/usersLocationHistory", (req, res) => {
    const body: TraceRequestBody = req.body;

    if (!body.location) {
      res.status(404);
      res.end("Bad request");
      return;
    }

    const trace = body;

    const tz = new Date(
      new Date(trace.location.timestamp).getTime() +
        ((trace.extras && trace.extras.offset) || 0)
    );

    Traces.insert(
      {
        key: `${tz}#${trace.extras.userId}`,
        data: {
          location: {
            lat: String(trace.coords.latitude),
            lon: String(trace.coords.longitude),
            speed: trace.coords.speed && String(trace.coords.speed),
            heading: trace.coords.heading && String(trace.coords.heading),
            altitude: trace.coords.altitude && String(trace.coords.altitude),
          },
        },
      },
      null,
      (err: Error | undefined, _resp: any) => {
        if (err) {
          log.error(err);
          res.status(500);
          res.end("Internal server error");
          return;
        }

        res.status(200);
        res.end("OK");
      }
    );
  });

  app.post("/users", mkUsers({ Users, log }));
  app.patch("/users", mkUsers({ Users, log }));
  app
    .use(bodyParser.text({ limit: "1kb", type: "*/*" }))
    .post("/matches", (req, res) => {
      const token = req.body;
      log.info("Finding new potentially infected users");
      if (MATCHING_TOKEN && token !== MATCHING_TOKEN) {
        log.error("Mismatching token", token);
        res.status(403);
        res.end("OK");
        return;
      }

      const query = `
      SELECT * FROM coronatrace_prod.infected_trails_last_30m_v1;
    `;

      const bqOpts = {
        query,
        location: "US",
      };

      res.status(200);
      res.end("OK");

      bigquery
        .createQueryJob(bqOpts)
        .then(([job]) => {
          return job.getQueryResults();
        })
        .then(([rows]) => {
          rows.forEach((row: MatchRow) => {
            // structure:
            // row.ts (string ISO format)
            // row.user_id (string)
            // row.push_notification_token (string)
            // row.segment (geo type: { value: 'Polygon(...)' })
            // row.infecting_user (a user_id)
            // row.infecting_segment (geo type: { value: 'Polygon(...)' })
            // TODO: send push notification for user
            // TODO: we can also log the ts, segment, infecting_user and infecting_segment for later improvements somewhere else?
            console.log("row", row);
          });
        })
        .catch((e) => {
          log.error(e);
          // res.status(500);
          // res.end("Internal Server Error");
        });
    });

  app.get("/hello", (req, res) => {
    log.info("hello world!");
    res.status(200).send("hello world!");
  });

  const port = Number(process.env.PORT) || 8080;

  await new Promise((resolve, reject) =>
    app.listen(port, "0.0.0.0", (err) => (err ? reject(err) : resolve()))
  );

  log.info(`server online at 0.0.0.0:${port}!`);
}

main().catch((err) => {
  log.error(err.message || "an unknown error occured while starting up");
  process.exit(1);
});
