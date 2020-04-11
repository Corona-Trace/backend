WITH users AS (
  SELECT
    *,
    (illness_informed_at IS NOT NULL) as is_sick
  FROM `${ userTableName }`
),
partitioned AS (select
  user_id,
  ts,
  geopoint,
  LEAD(geopoint,1) OVER (PARTITION BY user_id ORDER BY ts) as next_geopoint,
  LEAD(ts,1) OVER (PARTITION BY user_id ORDER BY ts) as next_ts
from `${ locationTableName }`),
segments AS (SELECT user_id, ts, ST_MAKELINE(geopoint, next_geopoint) as segment FROM partitioned
  WHERE ST_DISTANCE(geopoint, next_geopoint) < ${ segmentMaximumDistance }
    AND DATETIME_DIFF(next_ts, ts, MINUTE) < ${ segmentMaximumTimeDifference }),
trails AS (
  SELECT segments.*, users.is_sick, users.push_notification_token
  FROM segments
  INNER JOIN users ON segments.user_id = users.user_id
),
healthy_trails AS (
  SELECT * FROM trails WHERE is_sick = FALSE
),
sick_trails AS (
  SELECT * FROM trails WHERE is_sick = TRUE
)
SELECT
      healthy_trails.user_id,
      healthy_trails.ts,
      ANY_VALUE(healthy_trails.push_notification_token) as push_notification_token,
      ANY_VALUE(sick_trails.user_id) as infecting_user,
      ANY_VALUE(sick_trails.segment) as infecting_segment,
      ANY_VALUE(healthy_trails.segment) AS segment
FROM healthy_trails, sick_trails 
WHERE ST_DISTANCE(healthy_trails.segment, sick_trails.segment) <= ${ maxInfectDistance }
  AND healthy_trails.ts >= sick_trails.ts
  AND healthy_trails.ts >= DATETIME(TIMESTAMP "${ runSince }")
  AND healthy_trails.ts <= DATETIME_ADD(sick_trails.ts, INTERVAL ${ maxInfectTime } MINUTE)
GROUP BY 1, 2
