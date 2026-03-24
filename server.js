const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Route for handling orders
app.post('/order', (req, res) => {
  const { name, phone, email, product, quantity, address } = req.body;

  // Simple backend logic: log order (replace with database in production)
  console.log('New Order:', { name, phone, email, product, quantity, address });

  // Respond to frontend
  res.json({ success: true });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
