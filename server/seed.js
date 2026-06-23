require('dotenv').config();

const { connectDb } = require('./lib/db');
const MenuItem = require('./models/MenuItem');
const Order = require('./models/Order');

const items = [
  ['Milanesa con pure', 'Principal', 3800, '#2563eb', ['lunes', 'miercoles', 'viernes']],
  ['Suprema con ensalada', 'Principal', 3900, '#0f766e', ['martes', 'jueves']],
  ['Tarta de jamon y queso', 'Tarta', 3000, '#7c3aed', ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']],
  ['Tarta de verdura', 'Tarta', 2900, '#16a34a', ['lunes', 'miercoles', 'viernes']],
  ['Pastel de papa', 'Principal', 3600, '#f97316', ['martes', 'jueves']],
  ['Ravioles con salsa', 'Pasta', 3700, '#dc2626', ['viernes']],
  ['Ensalada completa', 'Liviano', 3200, '#0891b2', ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']]
];

async function seed() {
  await connectDb();

  const count = await MenuItem.countDocuments();
  if (count === 0) {
    await MenuItem.insertMany(items.map(([name, category, price, color, availableDays]) => ({
      name,
      category,
      price,
      color,
      availableDays
    })));
  }

  const orderCount = await Order.countDocuments();
  if (orderCount === 0) {
    const first = await MenuItem.findOne({ name: 'Milanesa con pure' });
    const second = await MenuItem.findOne({ name: 'Tarta de jamon y queso' });
    const today = new Date().toISOString().slice(0, 10);

    await Order.create({
      customerName: 'Pedido de prueba',
      phone: '3487 000000',
      source: 'whatsapp',
      socialUser: '3487000000',
      deliveryDate: today,
      status: 'confirmado',
      notes: 'Sin sal',
      items: [
        { menuItem: first._id, itemName: first.name, quantity: 2, unitPrice: first.price },
        { menuItem: second._id, itemName: second.name, quantity: 1, unitPrice: second.price }
      ]
    });
  }

  console.log('Seed Mongo completo.');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
