const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  source: { type: String, required: true },
  destination: { type: String, required: true },
  transportType: { type: String, default: 'any' },
  searchCount: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
