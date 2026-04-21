import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapView({ routeData }) {
  const defaultCenter = [20, 77]; // Center roughly above India globally
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(3);
  const [allLocations, setAllLocations] = useState([]);

  // Fetch true coordinates centrally from the DB for standalone map view
  useEffect(() => {
    fetch('http://localhost:5000/api/routes/locations')
       .then(res => res.json())
       .then(data => setAllLocations(data))
       .catch(err => console.log(err));
  }, []);

  useEffect(() => {
    if (routeData && routeData.length > 0) {
      if (routeData[0].sourceCoord) {
         setMapCenter([routeData[0].sourceCoord.lat, routeData[0].sourceCoord.lng]);
         setZoom(4);
      }
    }
  }, [routeData]);

  const polylines = [];
  const markers = new Set();
  const markerData = [];

  if (routeData && routeData.length > 0) {
    routeData.forEach(seg => {
      // Consume exact source/dest coords passed down from backend mapping
      if (seg.sourceCoord && seg.destCoord) {
        polylines.push({
           positions: [
             [seg.sourceCoord.lat, seg.sourceCoord.lng], 
             [seg.destCoord.lat, seg.destCoord.lng]
           ],
           color: seg.transportType === 'flight' ? '#38bdf8' : '#10b981',
           weight: 4,
           dashArray: seg.transportType === 'flight' ? '5, 5' : ''
        });
        
        if (!markers.has(seg.source)) {
          markers.add(seg.source);
          markerData.push({ name: seg.source, coord: [seg.sourceCoord.lat, seg.sourceCoord.lng] });
        }
        if (!markers.has(seg.destination)) {
          markers.add(seg.destination);
          markerData.push({ name: seg.destination, coord: [seg.destCoord.lat, seg.destCoord.lng] });
        }
      }
    });
  } else {
     // Show all world cities natively from API
     allLocations.forEach(c => {
         markerData.push({ name: c.name, coord: [c.lat, c.lng], desc: c.description });
     });
  }

  return (
    <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; CARTO'
      />
      
      {markerData.map((m, i) => (
        <Marker key={i} position={m.coord}>
          <Popup>
            <strong style={{ color: '#000' }}>{m.name}</strong><br/>
            {m.desc && <span style={{ color: '#555', fontSize: '0.8rem' }}>{m.desc}</span>}
          </Popup>
        </Marker>
      ))}

       {polylines.map((line, i) => (
        <Polyline 
           key={i} 
           positions={line.positions} 
           pathOptions={{ className: 'animated-path', color: line.color, weight: line.weight, dashArray: line.dashArray }} 
        />
      ))}
    </MapContainer>
  );
}

export default MapView;