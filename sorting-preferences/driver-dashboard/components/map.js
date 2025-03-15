import React, { useEffect, useState, useRef } from "react";

const HERE_API_KEY = "YOUR_HERE_API_KEY"; // Replace with your HERE API key

const HereMap = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [locations, setLocations] = useState([]);
  const [polyline, setPolyline] = useState(null);

  useEffect(() => {
    const loadMap = () => {
      const H = window.H;
      const platformInstance = new H.service.Platform({
        apikey: HERE_API_KEY,
      });
      setPlatform(platformInstance);

      const defaultLayers = platformInstance.createDefaultLayers();
      const mapInstance = new H.Map(
        mapRef.current,
        defaultLayers.vector.normal.map,
        {
          center: { lat: 12.9716, lng: 77.5946 }, // Default: Bangalore
          zoom: 10,
        }
      );

      new H.mapevents.Behavior(new H.mapevents.MapEvents(mapInstance));
      H.ui.UI.createDefault(mapInstance, defaultLayers);

      setMap(mapInstance);
    };

    loadMap();
  }, []);

  const addMarker = (lat, lng) => {
    if (map && locations.length < 2) {
      const marker = new window.H.map.Marker({ lat, lng });
      map.addObject(marker);
      setLocations((prev) => [...prev, { lat, lng }]);
    }
  };

  useEffect(() => {
    if (map) {
      map.addEventListener("tap", (evt) => {
        const { lat, lng } = map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);
        addMarker(lat, lng);
      });
    }
  }, [map, locations]);

  useEffect(() => {
    if (locations.length === 2) {
      drawPath(locations);
    }
  }, [locations]);

  const drawPath = (points) => {
    if (map) {
      if (polyline) {
        map.removeObject(polyline);
      }

      const lineString = new window.H.geo.LineString();
      points.forEach(({ lat, lng }) => lineString.pushLatLngAlt(lat, lng, 0));

      const newPolyline = new window.H.map.Polyline(lineString, {
        style: { lineWidth: 4, strokeColor: "blue" },
      });

      map.addObject(newPolyline);
      setPolyline(newPolyline);
    }
  };

  const calculateDistance = () => {
    if (locations.length === 2) {
      const [loc1, loc2] = locations;
      const R = 6371; // Radius of Earth in km
      const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
      const dLon = ((loc2.lng - loc1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((loc1.lat * Math.PI) / 180) * Math.cos((loc2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return (R * c).toFixed(2);
    }
    return "Click to select two locations.";
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">HERE Maps - Distance & Path</h2>
      <div ref={mapRef} className="w-full h-[500px] border rounded-lg shadow-md" />
      <div className="mt-4 text-lg">
        Distance: <strong>{calculateDistance()} km</strong>
      </div>
    </div>
  );
};

export default HereMap;
