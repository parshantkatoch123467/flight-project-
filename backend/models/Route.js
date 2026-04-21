const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  source: { type: String, required: true }, // referencing Location name
  destination: { type: String, required: true },
  transportType: { type: String, enum: ['flight', 'train'], required: true },
  price: { type: Number, required: true }, 
  duration: { type: Number, required: true }, // minutes
  company: { type: String },
  departureTime: { type: String, default: '08:00 AM' }, // newly added for rich details
  arrivalTime: { type: String, default: '10:00 AM' },
}, { timestamps: true });

routeSchema.index({ source: 1, destination: 1 });

module.exports = mongoose.model('Route', routeSchema);
