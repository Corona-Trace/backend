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
