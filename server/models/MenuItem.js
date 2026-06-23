const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, default: 'Principal', trim: true },
  price: { type: Number, default: 0 },
  color: { type: String, default: '#2563eb' },
  active: { type: Boolean, default: true },
  availableDays: {
    type: [String],
    default: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
