const mongoose = require('mongoose');
const validator = require('validator');


const chauffeurSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Chauffeur name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Chauffeur', chauffeurSchema);
