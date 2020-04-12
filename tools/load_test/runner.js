const lineReader = require("line-reader");
const faker = require("faker");
const axios = require("axios");
const Bottleneck = require("bottleneck/es5");
const { Storage } = require("@google-cloud/storage");
const storage = new Storage();
const bucket = storage.bucket("coronatrace-data-export");
const util = require("util");
var eachLine = util.promisify(lineReader.eachLine);
const API_ROOT = "https://api-yp2tme3siq-uc.a.run.app";

function createUser() {
  const userData = {
    userId: faker.random.uuid(),
    token: faker.internet.ipv6(),
    severity: faker.random.arrayElement([1, 0]),
  };
  return axios
    .post(API_ROOT + "/users", userData)
    .then((d) => d.data)
    .then((reply) => {
      if (reply === "OK") {
        return userData;
      } else {
        throw new Exception("failed to create user");
      }
    });
}

function prepareScenarios(interval, path) {
  const remoteFile = bucket.file(path);
  const f = remoteFile.createReadStream();
  const allScenarios = [];
  return eachLine(f, function (line) {
    const data = JSON.parse(line);
    const scenario = {
      interval: interval,
      data: data,
    };
    allScenarios.push(scenario);
  }).then((_) => {
    return allScenarios;
  });
}

function sendPoint(point, user) {
  const trace = {
    location: {
      timestamp: new Date().getTime(),
      uuid: faker.random.uuid(),
      extras: {
        userId: user.userId,
      },
      coords: {
        latitude: point.lat,
        longitude: point.lon,
      },
    },
  };
  return axios
    .post(API_ROOT + "/usersLocationHistory", trace)
    .then((k) => k.data);
}

function runScenario(scenario) {
  const trail = scenario.data.points;
  const interval = scenario.interval;
  const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: interval,
  });
  const sendPointLimited = limiter.wrap(sendPoint);
  return createUser().then((user) => {
    return Promise.all(
      trail.map((point) => {
        return sendPointLimited(point, user).then((k) => {
          console.log(k, point);
          return k;
        });
      })
    );
  });
}

function loadAndRun(s) {
  return prepareScenarios(s.interval, s.path).then((scenarios) => {
    const limiter = new Bottleneck({
      maxConcurrent: s.users,
    });
    const runScenarioLimited = limiter.wrap(runScenario);
    const results = scenarios.map((scenario) => runScenarioLimited(scenario));
    return Promise.all(results);
  });
}

const scenario = {
  users: 100,
  interval: 100, //ms,
  path:
    "2020-04-11/trackjobs2.json/part-00025-2476ec3d-2037-462e-bbe1-00fd21cd0192-c000.json",
};

if (require.main === module) {
  loadAndRun(scenario)
    .then((_r) => {
      console.log("ready!");
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
