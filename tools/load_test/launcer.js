
const scenes = require('./scenes.json').scenes;
const { PubSub } = require("@google-cloud/pubsub");



const config = {
    CLOUD_FUNCTION_MAX_RUNTIME: 1000*60*8*0.99, // 8 minutes
    TEST_RUNTIME: 1000*60*20, // 20 minutes
    RAMP_UP_TIME: 1000*60*10, // 10 minutes to get to highest point
    MAX_CONCURRENT_USERS: 100000, // 10k concurrent users
    START_USERS: 10000,
    JOB_CONCURRENCY: 100, // How many users per process
    INTERVAL: 1000*10 // Interval between location requests
}

const PROJECT_ID = process.env.PROJECT_ID || 'encoded-copilot-272701';
const TOPIC_NAME = process.env.TOPIC_NAME || 'loadtest-scenarios';

const pubsub = new PubSub({ projectId: PROJECT_ID });
const launchJobTopic = pubsub.topic(TOPIC_NAME);

function getRandomScene(scenes) {
    return scenes[Math.floor(Math.random() * scenes.length)];
}
// y = kx + b
function linearRampingF(rampUpTime, startUsers, maxUsers) {
    const k = (maxUsers - startUsers)/rampUpTime;
    const b = startUsers
    return function(time) {
        return Math.floor(k * time + b);
    }
}


const usersByTime = linearRampingF(config.RAMP_UP_TIME, config.START_USERS, config.MAX_CONCURRENT_USERS);

const t0 = new Date().getTime();
let countOfRunningJobs = 0;


function launchJob(config) {
    console.log("JOB LAUNCH")
    countOfRunningJobs++;
    setTimeout(() => {
        console.log("JOB EXIT")
        countOfRunningJobs--;
    }, config.CLOUD_FUNCTION_MAX_RUNTIME)

    const sceneFile = getRandomScene(scenes);
    // HERE code for running cloud function with parameters:
    // run(params)
    launchJobTopic.publish(Buffer.from(JSON.stringify({
        "users": config.JOB_CONCURRENCY,
        "interval": config.INTERVAL,
        "path": sceneFile
    })));
}

const runLoop = setInterval(() => {
    const time = new Date().getTime() - t0;
    const users = usersByTime(time);
    const countOfUsers = countOfRunningJobs * config.JOB_CONCURRENCY;
    const userDelta = users - countOfUsers;

    if (userDelta > config.JOB_CONCURRENCY) {
        const jobsToLaunch = Math.floor(userDelta / config.JOB_CONCURRENCY);
        for(var i = 0; i < jobsToLaunch; i++) {
            launchJob(config);
        }
    }

    console.log("target_users =", users, "users =", countOfUsers, "running_jobs =", countOfRunningJobs)
    if (time > config.TEST_RUNTIME) {
        console.log("Ready! Stop...")
        clearInterval(runLoop);
    }
}, 1000);