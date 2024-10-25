const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: [true, 'Article code is required'],
    unique: true,
    trim: true
  },
  codeABar: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  designation: {
    type: String,
    required: [true, 'Article designation is required'],
    trim: true
  },
  stock: { 
    type: Number, 
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  famille: String,
  marque: String,
  prixAchatHT: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Price cannot be negative']
  },
  mb: Number,
  tva: {
    type: Number,
    min: [0, 'TVA cannot be negative'],
    max: [100, 'TVA cannot exceed 100%']
  },
  pventeTTC: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Price cannot be negative']
  },
  pventePubHT: Number,
  codeFrs: String,
  intituleFrs: String,
  dateCreation: { 
    type: Date, 
    default: Date.now 
  },
  dateModification: { 
    type: Date, 
    default: Date.now 
  },
  ecrivain: String,
  collectionName: String,
  remiseFidelite: {
    type: Number,
    min: [0, 'Remise cannot be negative'],
    max: [100, 'Remise cannot exceed 100%']
  },
  dernierePUHT: Number,
  derniereRemise: Number,
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  }
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);
