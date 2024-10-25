const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: [true, 'Sale reference is required']
  },
  chauffeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chauffeur',
    required: [true, 'Chauffeur reference is required']
  },
  license: {
    type: String,
    required: [true, 'Vehicle license is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  deliveryDate: {
    type: Date,
    required: [true, 'Delivery date is required']
  },
  completionDate: Date,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
