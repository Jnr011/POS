
require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database');
const User = require('./models/user');
const Product = require('./models/product');
const Sale = require('./models/sale');
const bcrypt = require('bcryptjs');
const app = express();
const port = process.env.PORT || 5000;

// Setup model associations
const models = { User, Product, Sale };
Object.values(models).forEach(model => {
  if (model.associate) model.associate(models);
});

// Middleware
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

// Database connection
sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.log('❌ Database Error: ' + err));

// Sync models with database
sequelize.sync({ alter: false })
  .then(async () => {
    console.log('✅ Models synced');
    
    // Create initial admin if doesn't exist
    try {
      const adminExists = await User.findOne({ where: { email: 'admin@pharmacy.com' } });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin@123', 10);
        await User.create({
          name: 'System Admin',
          email: 'admin@pharmacy.com',
          password: hashedPassword,
          role: 'admin'
        });
        console.log('✅ Initial admin created (email: admin@pharmacy.com, password: admin@123)');
      }
    } catch (err) {
      console.log('⚠️  Could not create admin: ' + err.message);
    }
  })
  .catch(err => console.log('❌ Sync error: ' + err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
