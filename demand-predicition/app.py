from flask import Flask, request, jsonify
import numpy as np
import joblib
import pandas as pd  
from scipy.spatial import KDTree
from flask_cors import CORS
from geopy.geocoders import Nominatim

app = Flask(__name__)

CORS(app)

# Load models
model = joblib.load("xgb_regressor.pkl")
scaler = joblib.load("scaler.pkl")

df = pd.read_csv("cluster_centroids.csv")

# Build KDTree for fast nearest-neighbor search
tree = KDTree(df[['start_lat', 'start_lng']].values)

def assign_location_cluster(lat, lng):
    dist, idx = tree.query([lat, lng])
    return df.iloc[idx]['location_cluster']

def encode_cyclic(value, max_value):
    """Apply cyclic encoding using sine and cosine transformation."""
    sin_val = np.sin(2 * np.pi * value / max_value)
    cos_val = np.cos(2 * np.pi * value / max_value)
    return sin_val, cos_val

@app.route('/get_location', methods=['POST'])
def get_location():
    data = request.json  # Expecting a JSON list of objects
    geolocator = Nominatim(user_agent="geoapi", timeout=20)

    for item in data["topLocations"]:
        lat, lng = item.get("start_lat"), item.get("start_lng")
        if lat is not None and lng is not None:
            location = geolocator.reverse((lat, lng), exactly_one=True)
            item["location_name"] = location.address if location else "Unknown"

    return jsonify(data)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get JSON data
        data_list = request.get_json()

        if not isinstance(data_list, list):
            return jsonify({"error": "Input should be a list of records"}), 400

        processed_data = []
        
        for data in data_list:
            latitude = data["latitude"]
            longitude = data["longitude"]
            day_of_week = data["day_of_week"]
            is_weekend = int(data["is_weekend"])  
            hour = data["hour"]
            minutes = data["minutes"]

            # Apply cyclic encoding
            day_of_week_sin, day_of_week_cos = encode_cyclic(day_of_week, 7)
            start_time_hour_sin, start_time_hour_cos = encode_cyclic(hour, 24)
            # convert minutes to 0 15 or 45 
            minutes = round(minutes/15)*15
            time_window_sin, time_window_cos = encode_cyclic(minutes, 60)

            # Get location cluster
            location_cluster = assign_location_cluster(latitude, longitude)

            # Append processed data
            processed_data.append({
                "location_cluster": location_cluster,
                "is_weekend": is_weekend,
                "time_window_sin": time_window_sin,
                "time_window_cos": time_window_cos,
                "day_of_week_sin": day_of_week_sin,
                "day_of_week_cos": day_of_week_cos,
                "start_time_hour_sin": start_time_hour_sin,
                "start_time_hour_cos": start_time_hour_cos
            })

        # Convert to DataFrame
        input_df = pd.DataFrame(processed_data)

        # Transform input
        transformed_input = scaler.transform(input_df)

        # Make predictions
        predictions = model.predict(transformed_input)

        # Format response
        response = []
        for i, pred in enumerate(predictions):
            response.append({
                "input_transformed": processed_data[i],
                "prediction": float(pred)  
            })

        return jsonify(response)

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
