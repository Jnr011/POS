
require('dotenv').config();

const express = require('express');
const sequelize = require('./config/database');
const User = require('./models/user');
const Product = require('./models/product');
const Sale = require('./models/sale');
const Device = require('./models/device');
const Return = require('./models/return');
const { SyncPushLog, SyncPullLog, CloudSyncMeta } = require('./models/syncLog');
const cloudSync = require('./services/cloudSync');
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

// Disable FK enforcement during schema sync (SQLite limitation)
sequelize.query('PRAGMA foreign_keys = OFF')
  .then(() => sequelize.sync({ alter: true }))
  .then(() => sequelize.query('PRAGMA foreign_keys = ON'))
  .then(() => {
    console.log('✅ Models synced');
    cloudSync.start();
  })
  .catch(err => {
    console.log('❌ Sync error: ' + err);
    sequelize.query('PRAGMA foreign_keys = ON').catch(() => {});
  });

// Routes
app.use('/api/sync', require('./routes/sync'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/users', require('./routes/users'));

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
