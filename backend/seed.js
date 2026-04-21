const mongoose = require('mongoose');
const Route = require('./models/Route');
const Location = require('./models/Location');
require('dotenv').config();

const baseLocations = [
  // Major Nodes
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.0060, description: "Global finance hub.", isHub: true },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278, description: "European cultural center.", isHub: true },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522, description: "City of Light.", isHub: true },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, description: "Megalopolis.", isHub: true },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, description: "Oceanic transit.", isHub: true },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, description: "International junction.", isHub: true },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, description: "Asia transit core.", isHub: true },
  { name: "Frankfurt", country: "Germany", lat: 50.1109, lng: 8.6821, description: "Central EU hub.", isHub: true },
  
  // Indian Hubs
  { name: "Delhi", country: "India", lat: 28.6139, lng: 77.2090, description: "Northern India Transit.", isHub: true },
  { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777, description: "Financial capital.", isHub: true },
  { name: "Bangalore", country: "India", lat: 12.9716, lng: 77.5946, description: "Tech corridor.", isHub: true },
  { name: "Chennai", country: "India", lat: 13.0827, lng: 80.2707, description: "Southern Hub.", isHub: true },
  { name: "Kolkata", country: "India", lat: 22.5726, lng: 88.3639, description: "Eastern Hub.", isHub: true },
  { name: "Hyderabad", country: "India", lat: 17.3850, lng: 78.4867, description: "Pearl City.", isHub: true }
];

const generateLargeLocations = () => {
  let finalLocs = [...baseLocations];
  const hubs = baseLocations.map(h => h.name);
  
  // Generate ~400 Indian district/regional nodes to make massive graphs
  const states = ["MH", "KA", "DL", "TN", "WB", "AP", "UP", "GJ", "RJ", "PB", "KL", "OD"];
  
  for(let i=1; i<=450; i++) {
     let rHub = hubs[Math.floor(Math.random() * hubs.length)];
     let rState = states[Math.floor(Math.random() * states.length)];
     
     // Minor variance in lat/lng based on a hub to 'group' them locally
     let baseHub = baseLocations.find(l => l.name === rHub);
     let dLat = (Math.random() - 0.5) * 5;
     let dLng = (Math.random() - 0.5) * 5;
     
     finalLocs.push({
        name: `Station-${i} ${rState}`,
        country: "India", // localizing mass generation
        lat: baseHub.lat + dLat,
        lng: baseHub.lng + dLng,
        description: `Local routing hub in ${rState} zone. Connected to ${rHub} system.`,
        isHub: false,
        parentHub: rHub // tracking for route generation
     });
  }
  return finalLocs;
}

const generateTime = () => {
    const hours = Math.floor(Math.random() * 12) + 1;
    const mins = ['00', '15', '30', '45'][Math.floor(Math.random() * 4)];
    const ampm = Math.random() > 0.5 ? 'AM' : 'PM';
    return `${hours}:${mins} ${ampm}`;
};

const companies = ["Emirates", "Air India", "British Airways", "Lufthansa", "Japan Airlines", "Delta", "IndiGo", "Vistara", "Indian Railways (Rajdhani)", "Vande Bharat"];

const generateRoutes = (allLocs) => {
  const routes = [];
  const hubs = allLocs.filter(l => l.isHub);
  const locals = allLocs.filter(l => !l.isHub);

  // 1. Hub to Hub fully connected (Global Flights)
  for(let i=0; i<hubs.length; i++) {
    for(let j=0; j<hubs.length; j++) {
      if(i !== j && Math.random() > 0.3) {
         routes.push({
            source: hubs[i].name,
            destination: hubs[j].name,
            transportType: 'flight',
            price: Math.floor(Math.random() * 800) + 300,
            duration: Math.floor(Math.random() * 600) + 120,
            company: companies[Math.floor(Math.random() * 8)],
            departureTime: generateTime(), arrivalTime: generateTime()
         });
      }
    }
  }

  // 2. Local node to its parent Hub (Trains/Local Flights)
  for(let i=0; i<locals.length; i++) {
     let local = locals[i];
     // Connect to its parent hub (both ways)
     routes.push({
         source: local.name, destination: local.parentHub, transportType: 'train',
         price: Math.floor(Math.random() * 60) + 10, duration: Math.floor(Math.random() * 300) + 30,
         company: companies[8], departureTime: generateTime(), arrivalTime: generateTime()
     });
     routes.push({
         source: local.parentHub, destination: local.name, transportType: 'train',
         price: Math.floor(Math.random() * 60) + 10, duration: Math.floor(Math.random() * 300) + 30,
         company: companies[9], departureTime: generateTime(), arrivalTime: generateTime()
     });

     // Maybe connect to a random nearby local (Train path)
     if (Math.random() > 0.5 && i > 0) {
       let nearby = locals[i-1];
       routes.push({
           source: local.name, destination: nearby.name, transportType: 'train',
           price: Math.floor(Math.random() * 30) + 5, duration: Math.floor(Math.random() * 120) + 20,
           company: "Local Transit", departureTime: generateTime(), arrivalTime: generateTime()
       });
       routes.push({
           source: nearby.name, destination: local.name, transportType: 'train',
           price: Math.floor(Math.random() * 30) + 5, duration: Math.floor(Math.random() * 120) + 20,
           company: "Local Transit", departureTime: generateTime(), arrivalTime: generateTime()
       });
     }
  }

  return routes;
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/routeplanner')
  .then(async () => {
    console.log('MongoDB Connected for Massive Graph Seeding...');
    
    await Route.deleteMany({});
    await Location.deleteMany({});
    console.log('Database Cleared.');

    const comprehensiveLocs = generateLargeLocations();
    await Location.insertMany(comprehensiveLocs);
    console.log(`Successfully mapped ${comprehensiveLocs.length} Location Nodes.`);

    const comprehensiveRoutes = generateRoutes(comprehensiveLocs);
    
    // Batch insert routes to not blow memory buffer
    const batchSize = 1000;
    for(let i=0; i<comprehensiveRoutes.length; i+=batchSize) {
       await Route.insertMany(comprehensiveRoutes.slice(i, i+batchSize));
    }
    console.log(`Successfully compiled ${comprehensiveRoutes.length} specific Inter-Routes.`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
