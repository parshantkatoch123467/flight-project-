const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  country: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  description: { type: String },
  region: { type: String, enum: ['Worldwide', 'India'], default: 'Worldwide' }
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
