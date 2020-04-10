export type UserRequestBody = User;

export type TraceRequestBody = {
  location: {
    timestamp: string;
    uuid: string;
    geofence?: string;
    activity?: {
      type:
        | "still"
        | "on_foot"
        | "walking"
        | "running"
        | "in_vehicle"
        | "on_bicycle"
        | "unknown";
      confidence: number;
    };
    is_moving?: boolean;
    extras: {
      userId: string;
      offset?: number;
    };
    coords: {
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
      altitude?: number;
    };
  };
};

export type User = {
  severity?: number;
  userId: string;
  token: string;
};

type GeoEntry = {
  value: string; // Polygon(...) or similar string used that can be used to insert to bigquery -- default query result fmt
};

export type MatchRow = {
  ts: string; // ISO fmt string timestamp
  // eslint-disable-next-line @typescript-eslint/camelcase
  user_id: string;
  // eslint-disable-next-line @typescript-eslint/camelcase
  push_notification_token: string;
  segment: GeoEntry;
  // eslint-disable-next-line @typescript-eslint/camelcase
  infecting_user: string; // uuid string
  // eslint-disable-next-line @typescript-eslint/camelcase
  infecting_segment: GeoEntry;
};
