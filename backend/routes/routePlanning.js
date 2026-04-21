const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const Location = require('../models/Location');
const SearchHistory = require('../models/SearchHistory');
const Booking = require('../models/Booking');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const algorithms = require('../utils/algorithms');

const protectUser = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = await User.findById(decoded.id).select('-password');
      if (req.user) next();
      else res.status(401).json({ message: 'Not authorized' });
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// GET /api/routes/locations
router.get('/locations', async (req, res) => {
   try {
     const locs = await Location.find({});
     res.json(locs);
   } catch (err) {
     res.status(500).json({ message: err.message });
   }
});

// Helper builder to map segments and cost given a returned path list
const buildPathDetails = (pathNodes, graph, locMap) => {
  if (!pathNodes) return null;
  const segments = [];
  let totalCost = 0;
  let totalDuration = 0;
  for (let i = 0; i < pathNodes.length - 1; i++) {
    const u = pathNodes[i];
    const v = pathNodes[i+1];
    const edgeData = graph[u][v];
    totalCost += edgeData.price;
    totalDuration += edgeData.duration;
    segments.push({
      ...edgeData,
      sourceCoord: { lat: locMap[u]?.lat, lng: locMap[u]?.lng },
      destCoord: { lat: locMap[v]?.lat, lng: locMap[v]?.lng }
    });
  }
  return { pathNodes, totalCost, totalDuration, segments };
};

// GET /api/routes/search?source=Paris&destination=Tokyo
router.get('/search', async (req, res) => {
  try {
    const { source, destination, limit = 10 } = req.query;

    if (!source || !destination) {
      return res.status(400).json({ message: 'Source and destination required.' });
    }

    const existingSearch = await SearchHistory.findOne({ source, destination });
    if (existingSearch) {
      existingSearch.searchCount++;
      await existingSearch.save();
    } else {
      await SearchHistory.create({ source, destination });
    }

    const allRoutes = await Route.find({});
    const locations = await Location.find({});
    const locMap = {};
    locations.forEach(l => locMap[l.name] = l);
    
    // Graph based on Cost (Cheapest)
    const graphCost = {};
    // Graph based on Duration (Fastest)
    const graphTime = {};
    // Full Graph mapping for A* shortest physical distance fallback
    const graphFull = {};

    allRoutes.forEach(r => {
      if (!graphCost[r.source]) graphCost[r.source] = {};
      if (!graphTime[r.source]) graphTime[r.source] = {};
      if (!graphFull[r.source]) graphFull[r.source] = {};

      if (!graphCost[r.source][r.destination] || r.price < graphCost[r.source][r.destination].price) {
        graphCost[r.source][r.destination] = r.toObject();
      }
      if (!graphTime[r.source][r.destination] || r.duration < graphTime[r.source][r.destination].duration) {
        graphTime[r.source][r.destination] = r.toObject();
      }
      graphFull[r.source][r.destination] = r.toObject(); // just store whatever edge
    });

    if (!graphCost[source]) graphCost[source] = {};
    if (!graphCost[destination]) graphCost[destination] = {};
    if (!graphTime[source]) graphTime[source] = {};
    if (!graphTime[destination]) graphTime[destination] = {};
    if (!graphFull[source]) graphFull[source] = {};
    if (!graphFull[destination]) graphFull[destination] = {};

    // 1. Cheapest Path (Dijkstra mapped to price)
    const resCost = algorithms.dijkstra(graphCost, source, destination, 'price');
    const cheapestPath = buildPathDetails(resCost.path, graphCost, locMap);

    // 2. Fastest Path (Dijkstra mapped to duration)
    const resTime = algorithms.dijkstra(graphTime, source, destination, 'duration');
    const fastestPath = buildPathDetails(resTime.path, graphTime, locMap);

    // 3. Shortest Distance Path (A* mapped using geographic heuristic)
    const resDist = algorithms.aStar(graphFull, source, destination, locMap);
    const shortestPath = buildPathDetails(resDist.path, graphFull, locMap);

    if (!cheapestPath) {
      return res.status(404).json({ message: 'No route found between these cities.' });
    }

    // Include basic direct alternatives if any
    let directMatches = allRoutes.filter(r => r.source === source && r.destination === destination);
    directMatches = algorithms.mergeSort(directMatches.map(dm => dm.toObject()), 'price');

    res.json({
      cheapestPath,
      fastestPath,
      shortestPath: { ...shortestPath, actualKmCost: resDist.cost },
      directAlternatives: directMatches.slice(0, Number(limit))
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/routes/ai-suggestion (MOCK)
router.get('/ai-suggestion', async (req, res) => {
  res.json({
    message: "Based on traveler trends and temporal analysis, we suggest scheduling your trip via Dubai. Fares drop 14% on this hub routing next week, alongside major duty-free events.",
    hub: "Dubai",
    confidence: "87%"
  });
});

// GET /api/routes/weather-impact (MOCK)
router.get('/weather-impact', async (req, res) => {
  res.json({
    globalDisruptions: [
      { location: "London", severity: "High", delayFactor: 1.5, type: "Heavy Fog" },
      { location: "New York", severity: "Medium", delayFactor: 1.2, type: "Snowstorm" }
    ],
    timestamp: new Date().toISOString()
  });
});

router.get('/budget-optimizer', async (req, res) => {
  try {
    const { source, budget } = req.query;
    if (!source || !budget) return res.status(400).json({ message: 'source and budget required' });

    const connections = await Route.find({ source });
    
    const items = connections.map(r => ({
      id: r.destination,
      value: 10,
      cost: r.price
    }));

    const uniqueDest = {};
    items.forEach(item => {
      if (!uniqueDest[item.id] || item.cost < uniqueDest[item.id].cost) {
        uniqueDest[item.id] = item;
      }
    });

    const uniqueItemsList = Object.values(uniqueDest);

    const result = algorithms.knapsack(uniqueItemsList, Number(budget));
    
    res.json({
      budget: Number(budget),
      citiesVisitedVal: result.maxValue,
      canVisit: result.selected
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/book', protectUser, async (req, res) => {
  try {
    const { path, totalPrice } = req.body;
    if (!path || !path.length || totalPrice == null) {
      return res.status(400).json({ message: 'Path and totalPrice are required' });
    }
    const booking = await Booking.create({
      user: req.user._id,
      path: path,
      totalPrice: totalPrice,
      status: 'confirmed'
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/destination-info', async (req, res) => {
  try {
    const locs = await Location.find({});
    const routes = await Route.find({});
    
    const defaultImages = {
      "New York": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=800",
      "London": "https://images.unsplash.com/photo-1513635269975-59693e0cd156?auto=format&fit=crop&q=80&w=800",
      "Paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800",
      "Tokyo": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800",
      "Sydney": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80&w=800",
      "Dubai": "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&q=80&w=800",
      "Delhi": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=800",
      "Mumbai": "https://images.unsplash.com/photo-1522543949987-9bb1fdf178f8?auto=format&fit=crop&q=80&w=800",
      "Bangalore": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=800",
      "Chennai": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=800",
      "Kolkata": "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&q=80&w=800",
      "Hyderabad": "https://images.unsplash.com/photo-1587559070757-f72a388edbba?auto=format&fit=crop&q=80&w=800"
    };

    const destData = locs.map(l => {
      const incoming = routes.filter(r => r.destination === l.name);
      const flights = incoming.filter(r => r.transportType === 'flight').map(r => r.source);
      const trains = incoming.filter(r => r.transportType === 'train').map(r => r.source);
      const minCost = incoming.reduce((min, r) => (r.price < min ? r.price : min), Infinity);

      return {
        id: l._id,
        name: l.name,
        country: l.country,
        description: l.description,
        lat: l.lat,
        lng: l.lng,
        imageUrl: defaultImages[l.name] || "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=800",
        flightsAvailableFrom: [...new Set(flights)],
        trainsAvailableFrom: [...new Set(trains)],
        minKnownCost: minCost === Infinity ? null : minCost
      };
    });

    res.json(destData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
