######################### Builder
FROM node:12 as builder

WORKDIR /usr/src/app
COPY package.json .
COPY yarn.lock .

# Don't allow adjustments to the lockfile
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn compile
# Trim dependencies
RUN yarn install --production


######################### Runner
FROM node:12-slim as runner
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/dist dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
# Make sure to use source-map-support in order to see proper
# stack traces in Stackdriver errors and logs
CMD [ "node", "-r", "source-map-support/register", "dist" ]