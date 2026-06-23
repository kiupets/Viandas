const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, default: 0 }
}, {
  timestamps: true
});

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true, trim: true },
  phone: { type: String, default: '', trim: true },
  source: {
    type: String,
    enum: ['whatsapp', 'instagram', 'telefono', 'local', 'otro'],
    default: 'whatsapp'
  },
  socialUser: { type: String, default: '', trim: true },
  deliveryDate: { type: String, required: true },
  status: {
    type: String,
    enum: ['pendiente', 'confirmado', 'listo', 'entregado', 'cancelado'],
    default: 'pendiente'
  },
  notes: { type: String, default: '' },
  items: { type: [orderItemSchema], default: [] }
}, {
  timestamps: true
});

orderSchema.virtual('total').get(function total() {
  return this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
