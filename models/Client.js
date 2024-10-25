const mongoose = require('mongoose');
const validator = require('validator');

const clientSchema = new mongoose.Schema({
  codeClient: {
    type: String,
    required: true,
    unique: true
  },
  intitule: {
    type: String,
    required: true
  },
  tel1: {
    type: String,
    validate: {
      validator: function (v) {
        return v === '' || /\d{8,}/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  tel2: {
    type: String,
    validate: {
      validator: function (v) {
        return v === '' || /\d{8,}/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  profession: String,
  societe: String,
  mail: {
    type: String,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        return v === '' || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  adresse: String
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
