import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import axios from 'axios';
import type { LocationData, PredictionRequest, PredictionResponse } from '../types';
import { MapPin, Calendar, Loader2, Navigation, CarTaxiFront } from 'lucide-react';

const BANGALORE_CENTER = { lat: 12.9716, lng: 77.5946 };
const GOOGLE_MAPS_API_KEY = 'AIzaSyBrNpO_PFxu9KXyQvjuXSE2MzHXZSPvaug'; // Replace with your API key

interface LocationWithDemand extends LocationData {
  prediction: number;
}

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topLocations, setTopLocations] = useState<LocationWithDemand[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<google.maps.Marker | null>(null);
  const [activeInfoWindow, setActiveInfoWindow] = useState<google.maps.InfoWindow | null>(null);

  const createMarkerIcon = (prediction: number, isSelected: boolean = false) => {
    const scale = Math.max(0.8, Math.min(1.5, prediction / 5)); // Scale based on demand
    return {
      path: google.maps.SymbolPath.MARKER,
      fillColor: isSelected ? '#EF4444' : '#4F46E5',
      fillOpacity: 0.9,
      strokeColor: isSelected ? '#991B1B' : '#312E81',
      strokeWeight: 2,
      scale: 30 * scale,
      labelOrigin: new google.maps.Point(0, -15)
    };
  };

  const updateMarkers = async (locations: LocationData[]) => {
    if (!map) return;
    
    setLoading(true);
    setError(null);
    const dateTime = new Date(selectedDateTime);
    
    const requests: PredictionRequest[] = locations.map(loc => ({
      latitude: loc.start_lat,
      longitude: loc.start_lng,
      day_of_week: dateTime.getDay(),
      is_weekend: dateTime.getDay() === 0 || dateTime.getDay() === 6,
      hour: dateTime.getHours(),
      minutes: dateTime.getMinutes()
    }));

    try {
      const predictionsResponse = await axios.post<PredictionResponse[]>(
        'http://127.0.0.1:5000/predict',
        requests
      );

      // Clear existing markers and info windows
      markers.forEach(marker => marker.setMap(null));
      if (activeInfoWindow) {
        activeInfoWindow.close();
        setActiveInfoWindow(null);
      }
      setSelectedMarker(null);

      const locationsWithDemand: LocationWithDemand[] = locations.map((loc, index) => ({
        ...loc,
        prediction: Math.abs(predictionsResponse.data[index].prediction)
      }));

      // Sort locations by demand and get top 10
      const sortedLocations = [...locationsWithDemand].sort((a, b) => b.prediction - a.prediction);
      const topLocations = sortedLocations.slice(0, 10);

      console.log(topLocations)

      const loc = await axios.post('http://127.0.0.1:5000/get_location', { topLocations });
      setTopLocations(loc.data.topLocations);

      // Create new markers
      const newMarkers = locationsWithDemand.map(loc => {
        const marker = new google.maps.Marker({
          position: { lat: loc.start_lat, lng: loc.start_lng },
          map: map,
          icon: createMarkerIcon(loc.prediction),
          animation: google.maps.Animation.DROP,
          label: {
            text: loc.prediction.toFixed(1),
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        });

        // Add click listener to marker
        marker.addListener('click', () => {
          if (activeInfoWindow) {
            activeInfoWindow.close();
          }
          
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-3">
                <h3 class="font-semibold text-lg mb-2">Location Details</h3>
                <div class="space-y-1">
                  <p><span class="font-medium">Cluster:</span> ${loc.location_cluster}</p>
                  <p><span class="font-medium">Demand:</span> ${Math.abs(parseFloat(loc.prediction.toFixed(2)))}</p>
                  <p><span class="font-medium">Coordinates:</span><br>${loc.start_lat.toFixed(6)}, ${loc.start_lng.toFixed(6)}</p>
                </div>
              </div>
            `
          });

          infoWindow.open(map, marker);
          setActiveInfoWindow(infoWindow);

          // Update marker appearance
          if (selectedMarker) {
            selectedMarker.setIcon(createMarkerIcon(
              Math.abs(locationsWithDemand.find(l => 
                l.start_lat === selectedMarker.getPosition()?.lat() && 
                l.start_lng === selectedMarker.getPosition()?.lng()
              )?.prediction || 0)
            ));
          }
          marker.setIcon(createMarkerIcon(Math.abs(parseFloat(loc.prediction.toFixed(2))), true));
          setSelectedMarker(marker);
        });

        return marker;
      });

      setMarkers(newMarkers);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setError('Failed to fetch predictions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
    });

    loader.load().then(async () => {
      if (!mapRef.current) return;

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: BANGALORE_CENTER,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6c7079" }]
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#e9e9e9" }]
          },
          {
            featureType: "landscape",
            elementType: "geometry",
            stylers: [{ color: "#f5f5f5" }]
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }]
          }
        ]
      });

      setMap(mapInstance);

      try {
        const response = await fetch('/cluster_centroids.csv');
        const csvText = await response.text();
        const locations = parseCSV(csvText);
        await updateMarkers(locations);
      } catch (error) {
        console.error('Error loading CSV:', error);
        setError('Failed to load location data. Please refresh the page.');
      }
    });

    return () => {
      markers.forEach(marker => marker.setMap(null));
      if (activeInfoWindow) {
        activeInfoWindow.close();
      }
    };
  }, []);

  const parseCSV = (csv: string): LocationData[] => {
    const lines = csv.split('\n');
    return lines
      .slice(1)
      .map(line => {
        const [location_cluster, start_lat, start_lng] = line.split(',');
        return {
          location_cluster: parseInt(location_cluster),
          start_lat: parseFloat(start_lat),
          start_lng: parseFloat(start_lng)
        };
      })
      .filter(loc => !isNaN(loc.start_lat) && !isNaN(loc.start_lng));
  };

  const handleDateTimeChange = async (newDateTime: string) => {
    setSelectedDateTime(newDateTime);
    try {
      const response = await fetch('/cluster_centroids.csv');
      const csvText = await response.text();
      const locations = parseCSV(csvText);
      await updateMarkers(locations);
    } catch (error) {
      console.error('Error updating markers:', error);
      setError('Failed to update predictions. Please try again.');
    }
  };

  const handleLocationClick = (location: LocationWithDemand) => {
    if (!map) return;
    
    // Find the corresponding marker
    const marker = markers.find(m => 
      m.getPosition()?.lat() === location.start_lat && 
      m.getPosition()?.lng() === location.start_lng
    );

    if (marker) {
      // Reset previous selected marker
      if (selectedMarker && selectedMarker !== marker) {
        selectedMarker.setIcon(createMarkerIcon(
  Math.abs(topLocations.find(l => 
    l.start_lat === selectedMarker.getPosition()?.lat() && 
    l.start_lng === selectedMarker.getPosition()?.lng()
  )?.prediction || 0)
));
      }

      // Update new selected marker
      marker.setIcon(createMarkerIcon(Math.abs(parseFloat(location.prediction.toFixed(2))), true));
      setSelectedMarker(marker);

      // Close previous info window and open new one
      if (activeInfoWindow) {
        activeInfoWindow.close();
      }

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-3">
            <h3 class="font-semibold text-lg mb-2">Location Details</h3>
            <div class="space-y-1">
              <p><span class="font-medium">Cluster:</span> ${location.location_cluster}</p>
              <p><span class="font-medium">Demand:</span> ${Math.abs(parseFloat(location.prediction.toFixed(2)))}</p>
              <p><span class="font-medium">Coordinates:</span><br>${location.start_lat.toFixed(6)}, ${location.start_lng.toFixed(6)}</p>
            </div>
          </div>
        `
      });

      infoWindow.open(map, marker);
      setActiveInfoWindow(infoWindow);

      // Pan and zoom to the location
      map.panTo({ lat: location.start_lat, lng: location.start_lng });
      map.setZoom(15);
    }
  };

  return (
    <div className="relative w-full h-full flex">
      <div ref={mapRef} className="flex-1 h-full rounded-lg shadow-lg" />
      
      {/* Left Control Panel */}
      <div className="absolute top-4 left-4 bg-white p-6 rounded-lg shadow-lg max-w-md z-10">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <CarTaxiFront className="w-7 h-7 text-blue-600" />
          Bangalore Taxi Demand
        </h1>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          Interactive map showing predicted taxi demand across Bangalore.
          Click on markers to see detailed information.
        </p>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <input
              type="datetime-local"
              value={selectedDateTime}
              onChange={e => setSelectedDateTime(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
            <button
              onClick={() => handleDateTimeChange(selectedDateTime)}
              className={`w-full px-4 py-2 rounded-md transition-colors ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
              disabled={loading}
            >
              Predict Demand
            </button>
          {loading && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Updating predictions...</span>
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Top Locations */}
      <div className="absolute top-4 right-4 bg-white p-6 rounded-lg shadow-lg w-80 max-h-[calc(100vh-2rem)] overflow-y-auto z-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600" />
          Top Demanded Areas
        </h2>
        <div className="space-y-3">
          {topLocations.map((location, index) => (
            <button
              key={location.location_cluster}
              onClick={() => handleLocationClick(location)}
              className="w-full p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left rounded-lg group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs   text-gray-900">
                  {location.location_name}
                </span>
                <span className="text-sm text-blue-600 font-semibold">
                  #{index + 1}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Demand: {Math.abs(parseFloat(location.prediction.toFixed(2)))}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {location.start_lat.toFixed(6)}, {location.start_lng.toFixed(6)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}