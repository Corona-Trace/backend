import express from "express";
import bodyParser from "body-parser";
import bunyan from "bunyan";
import { Bigtable } from "@google-cloud/bigtable";
import { TraceRequestBody } from "./types";

import { mkUsers } from "./controllers/users";

const BIGTABLE_INSTANCE = process.env.BIGTABLE_INSTANCE || "localhost:8086";
const PROJECT_ID = process.env.PROJECT_ID;

const bigtable = new Bigtable({ projectId: PROJECT_ID });

const log = bunyan.createLogger({ name: "api" });

async function main(): Promise<void> {
  const bg = bigtable.instance(BIGTABLE_INSTANCE);
  const Traces = bg.table("traces");
  const Users = bg.table("users");

  const app = express();
  app.use(bodyParser.json({ limit: "10mb" }));

  app.post("/usersLocationHistory", (req, res) => {
    const body: TraceRequestBody = req.body;

    // TODO: inserts are capped at 4MB, ensure we don't go over this limit
    Traces.insert(
      body.map((trace) => {
        return {
          key: `${trace.timestamp}#${trace.uuid}`,
          data: {
            location: {
              lat: trace.lat,
              lon: trace.lng,
            },
          },
        };
      }),
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
