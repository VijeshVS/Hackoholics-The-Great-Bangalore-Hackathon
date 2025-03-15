export interface LocationData {
  location_cluster: number;
  start_lat: number;
  start_lng: number;
}

export interface PredictionRequest {
  latitude: number;
  longitude: number;
  day_of_week: number;
  is_weekend: boolean;
  hour: number;
  minutes: number;
}

export interface PredictionResponse {
  input_transformed: {
    day_of_week_cos: number;
    day_of_week_sin: number;
    is_weekend: number;
    location_cluster: number;
    start_time_hour_cos: number;
    start_time_hour_sin: number;
    time_window_cos: number;
    time_window_sin: number;
  };
  prediction: number;
}