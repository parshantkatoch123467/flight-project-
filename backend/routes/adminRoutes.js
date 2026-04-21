const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Route = require('../models/Route');
const SearchHistory = require('../models/SearchHistory');
const Booking = require('../models/Booking');
const algorithms = require('../utils/algorithms');

// Middleware to Check Admin Auth
const jwt = require('jsonwebtoken');

const protectAdmin = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = await User.findById(decoded.id).select('-password');
      if (req.user && req.user.role === 'admin') {
        next();
      } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
      }
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Getting Network Graph for Kruskal and Warshall
router.get('/network', protectAdmin, async (req, res) => {
  try {
    const allRoutes = await Route.find({});

    // Prep nodes and edges for Kruskal/Warshall
    const nodesSet = new Set();
    const edges = [];
    allRoutes.forEach(r => {
      nodesSet.add(r.source);
      nodesSet.add(r.destination);
      edges.push({ src: r.source, dest: r.destination, weight: r.price });
    });

    const nodes = Array.from(nodesSet);

    // 1. Kruskal's MST
    const mstResult = algorithms.kruskal(edges, nodes);

    // 2. Warshall's Connectivity
    const warshallResult = algorithms.warshall(nodes, edges);

    res.json({
      mst: mstResult,
      reachabilityMatrix: warshallResult
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin Analytics
router.get('/analytics', protectAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const usersList = await User.find({}).select('-password');
    const totalRoutes = await Route.countDocuments();
    const popularSearches = await SearchHistory.find().sort({ searchCount: -1 }).limit(5);
    
    const bookings = await Booking.find({});
    const totalBookings = bookings.length;
    const totalSales = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

    res.json({
      totalUsers,
      usersList,
      totalRoutes,
      popularSearches,
      totalBookings,
      totalSales,
      allFlights: await Route.find({})
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new Flight (Admin)
router.post('/add-flight', protectAdmin, async (req, res) => {
  try {
    const { source, destination, transportType, price, duration, company, departureTime, arrivalTime } = req.body;
    if (!source || !destination || !transportType || price == null || duration == null) {
      return res.status(400).json({ message: 'Missing required flight fields' });
    }
    const newRoute = await Route.create(req.body);
    res.status(201).json(newRoute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Flight (Admin)
router.delete('/flight/:id', protectAdmin, async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Flight not found' });
    }
    res.json({ message: 'Flight successfully removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
