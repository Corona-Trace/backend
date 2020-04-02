/**
 * This script is meant to load test the api by simulating an amount
 * of users walking around and interacting with certain hotspots.
 * 
 * Currently only supports GET requests
 * 
 * To run this script:
 *  1. open terminal to directory where this script is located
 *  2. run `node sim.js <amount_of_users> <url> <probability>`
 *
 */

 const validateArguments = (args) => {
    if (args.length != 3) {
      console.error("Please provide the amount of users, a url to test, and a probability of hitting the endpoint");
      console.error("Ex: node sim.js 1000 https://google.com .5");
      process.exit(1);
    }

    const numUsers = parseInt(args[0], 10);
    if (!numUsers) {
      console.error("amount of users must be a number");
      console.error("Ex: node sim.js 1000 https://google.com .5");
      process.exit(1);
    }

    const url = args[1];
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      console.error("url must be fully qualified");
      console.error("Ex: node sim.js 1000 https://google.com .5");
      process.exit(1);
    }

    const probability = parseFloar(args[2]);
    if (probability > 1 || probability < 0) {
      console.error("probability must be between 0 and 1");
      console.error("Ex: node sim.js 1000 https://google.com .5");
      process.exit(1);
    }

    return { numUsers, url, probability };
 }

const { numUsers, url, probability } = validateArguments(process.argv.slice(2));
for (let i = 0; i < numUsers; i++) {
    const num = Math.random();
    if (num < probability) {
        console.log(`requesting ${url}`);
        fetch(url);
    }
}