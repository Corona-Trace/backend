import { Table } from "@google-cloud/bigtable/build/src/table";
import bunyan from "bunyan";
import { Request, Response } from "express";

export function mkUsers({
  Users,
  log,
}: {
  Users: Table;
  log: bunyan;
}): (req: Request, res: Response) => void {
  return (req: Request, res: Response) => {
    const { userId } = req.body;
    if (!userId) {
      res.status(400);
      res.end();
      return;
    }

    const updateBody: Record<string, any> = {};
    if (req.body.token) {
      // eslint-disable-next-line @typescript-eslint/camelcase
      updateBody.push_notification_token = { token: req.body.token };
    }

    if (req.body.severity !== undefined) {
      updateBody.status = {
        confirmed: String(req.body.severity === 1),
        // eslint-disable-next-line @typescript-eslint/camelcase
        informed_time: new Date().toISOString(),
      };
    }

    Users.insert(
      [
        {
          key: userId,
          data: updateBody,
        },
      ],
      null,
      (err: Error | undefined, payload: any) => {
        if (err) {
          log.error(err);
          res.status(500);
          res.end();
          return;
        }

        console.log(payload);
        res.status(200);
        res.end("OK");
      }
    );
  };
}
