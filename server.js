const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple file-based DB
const DB_FILE = path.join(__dirname, 'data', 'orders.json');
const CONTACT_FILE = path.join(__dirname, 'data', 'contacts.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));
if (!fs.existsSync(CONTACT_FILE)) fs.writeFileSync(CONTACT_FILE, JSON.stringify([]));

// Helper: read/write JSON
const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// ─── ROUTES ───────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Chile Energy API running', timestamp: new Date().toISOString() });
});

// Products (static catalog)
app.get('/api/products', (req, res) => {
  const products = [
    {
      id: 1,
      name: 'Premium Hardwood Briquettes',
      description: 'Made from 100% natural hardwood. Long-burning, high-heat output ideal for BBQ, grilling, and industrial use.',
      price: 4500,
      unit: '25kg bag',
      category: 'Premium',
      stock: 150,
      image: 'hardwood',
      features: ['Burns 3–4 hours', 'Low ash residue', 'Consistent heat', 'No chemical additives'],
    },
    {
      id: 2,
      name: 'Coconut Shell Briquettes',
      description: 'Eco-friendly briquettes crafted from coconut shell waste. Smokeless, odorless, and extremely efficient.',
      price: 5200,
      unit: '20kg bag',
      category: 'Eco',
      stock: 80,
      image: 'coconut',
      features: ['Smokeless burn', 'Eco-certified', 'High carbon content', '5–6 hour burn time'],
    },
    {
      id: 3,
      name: 'Industrial Bulk Briquettes',
      description: 'Heavy-duty briquettes designed for furnaces, kilns, and large-scale energy applications.',
      price: 38000,
      unit: '250kg sack',
      category: 'Industrial',
      stock: 30,
      image: 'industrial',
      features: ['Bulk pricing', 'Consistent sizing', 'High calorific value', 'Ideal for furnaces'],
    },
    {
      id: 4,
      name: 'Household Cooking Briquettes',
      description: 'Affordable, clean-burning briquettes for everyday household cooking. Safe to use indoors with ventilation.',
      price: 1800,
      unit: '10kg bag',
      category: 'Household',
      stock: 300,
      image: 'household',
      features: ['Affordable', 'Easy to light', 'Suitable for jiko stove', 'Consistent flame'],
    },
    {
      id: 5,
      name: 'Restaurant & Catering Pack',
      description: 'Professional-grade briquettes for restaurants. Uniform size and shape for predictable cooking results.',
      price: 12500,
      unit: '50kg pack',
      category: 'Commercial',
      stock: 60,
      image: 'restaurant',
      features: ['Uniform shape', 'Professional grade', 'Long lasting', 'Clean burn'],
    },
    {
      id: 6,
      name: 'Shisha / Hookah Briquettes',
      description: 'Natural quick-light briquettes perfect for shisha and hookah use. Tasteless and odorless.',
      price: 3200,
      unit: '1kg box (72 pcs)',
      category: 'Specialty',
      stock: 120,
      image: 'shisha',
      features: ['Quick-light', 'Tasteless & odorless', 'Consistent heat', 'Natural ingredients'],
    },
  ];
  res.json({ success: true, products });
});

// Submit order
app.post('/api/orders', (req, res) => {
  const { name, email, phone, address, items, totalAmount, paymentMethod, notes } = req.body;

  // Validate
  if (!name || !email || !phone || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const orders = readJSON(DB_FILE);
  const orderId = `CE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newOrder = {
    id: orderId,
    name,
    email,
    phone,
    address,
    items,
    totalAmount,
    paymentMethod,
    notes,
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };

  orders.push(newOrder);
  writeJSON(DB_FILE, orders);

  res.json({
    success: true,
    message: 'Order placed successfully!',
    orderId,
    order: newOrder,
  });
});

// Get single order
app.get('/api/orders/:id', (req, res) => {
  const orders = readJSON(DB_FILE);
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, order });
});

// Get all orders (admin)
app.get('/api/admin/orders', (req, res) => {
  const { secret } = req.query;
  if (secret !== 'chileadmin2024') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const orders = readJSON(DB_FILE);
  res.json({ success: true, orders, total: orders.length });
});

// Update order status (admin)
app.patch('/api/admin/orders/:id', (req, res) => {
  const { secret } = req.query;
  if (secret !== 'chileadmin2024') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const orders = readJSON(DB_FILE);
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Order not found' });
  orders[idx].status = req.body.status || orders[idx].status;
  writeJSON(DB_FILE, orders);
  res.json({ success: true, order: orders[idx] });
});

// Contact form
app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
  }
  const contacts = readJSON(CONTACT_FILE);
  const contact = {
    id: `MSG-${Date.now()}`,
    name, email, phone, subject, message,
    createdAt: new Date().toISOString(),
    read: false,
  };
  contacts.push(contact);
  writeJSON(CONTACT_FILE, contacts);
  res.json({ success: true, message: 'Message received! We will get back to you shortly.' });
});

// Subscribe to newsletter
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });
  const subFile = path.join(__dirname, 'data', 'subscribers.json');
  if (!fs.existsSync(subFile)) fs.writeFileSync(subFile, JSON.stringify([]));
  const subs = readJSON(subFile);
  if (subs.includes(email)) {
    return res.json({ success: true, message: 'Already subscribed!' });
  }
  subs.push(email);
  writeJSON(subFile, subs);
  res.json({ success: true, message: 'Subscribed successfully! Welcome to Chile Energy.' });
});

app.listen(PORT, () => {
  console.log(`\n🔥 Chile Energy Server running on http://localhost:${PORT}\n`);
});
