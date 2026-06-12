
require('dotenv').config();

const express = require('express');
const sequelize = require('./config/database');
const User = require('./models/user');
const Product = require('./models/product');
const Sale = require('./models/sale');
const Device = require('./models/device');
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.log('❌ Database Error: ' + err));

sequelize.sync({ alter: true })
  .then(() => console.log('✅ Models synced'))
  .catch(err => console.log('❌ Sync error: ' + err));

app.use('/api/sync', require('./routes/sync'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

app.post('/api/log', express.json({ limit: '100kb' }), (req, res) => {
  const { error, stack, componentStack, url, timestamp } = req.body || {};
  console.error(`[Client Error] ${url} @ ${new Date(timestamp || Date.now()).toISOString()}`);
  console.error(`  ${error}`);
  if (stack) console.error(`  Stack: ${stack.split('\n').slice(0, 3).join('\n    ')}`);
  if (componentStack) console.error(`  Component: ${componentStack.split('\n').slice(0, 3).join('\n    ')}`);
  res.status(200).json({ logged: true });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
