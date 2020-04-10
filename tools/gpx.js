const fs = require("fs").promises;
const { promisify } = require("util");
const parseString = promisify(require("xml2js").parseString);
const fetch = require("node-fetch");

const BASE_URL = "http://localhost:8080";
// const BASE_URL = "https://api-yp2tme3siq-uc.a.run.app";

const filePath = process.argv[2];

if (!filePath) {
  console.error(".gpx file path not provided");
  process.exit(1);
}

const uuid = "3CC75729-19FA-4F6C-99D1-22DF01AED2F9";

async function run() {
  const content = await fs.readFile(filePath, "utf8");
  const parsed = await parseString(content);
  const points = parsed.gpx.trk[0].trkseg[0].trkpt.map((point) => {
    return {
      location: {
        uuid,
        extras: {
          userId: uuid,
        },
        coords: {
          latitude: Number(point.$.lat),
          longitude: Number(point.$.lon),
        },
        timestamp: point.time[0],
      },
    };
  });

  console.log(points);

  console.log("SUBMITTING TO API");
  for (const p of points) {
    await fetch(BASE_URL + "/usersLocationHistory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(p),
    });
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
