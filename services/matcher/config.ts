
export default {
    "projectId": "encoded-copilot-272701",
    "pushNotificationTopic": "push-notifications-prod",
    "userTableName": "encoded-copilot-272701.coronatrace_prod.user_profiles",
    "locationTableName": "encoded-copilot-272701.coronatrace_prod.trace_points",
    // How many meters there should be maximum between two consecutive points to be considered
    // travelled segment (2km = 2000)
    // if distance between points is bigger then the matching algorithm doesn't take it into account
    "segmentMaximumDistance": 2000,
    // How many minutes is allowed between two consecutive points to be considered as segment
    "segmentMaximumTimeDifference": 10,
    // Maximum distance between healthy and sick segment for infection
    "maxInfectDistance": 15,
    // Maximum time after creation of sick segment and healthy segment intersection in minutes
    "maxInfectTime": 120,
    // BigTable instance name
    "bigtableInstance": null
}



