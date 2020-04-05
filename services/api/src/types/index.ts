export type TraceRequestBody = Trace[];
export type UserRequestBody = User;

export type Trace = {
  userId: string;
  timestamp: string; // ISO format?;
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
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
  uuid: string;
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
