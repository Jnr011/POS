# POS System

Welcome to the **POS System**! This system is designed to streamline the operations of your pharmacy, including inventory management, sales processing, reporting, and user role management.

## Features

### Admin Features
- Add/update/delete products in inventory
- View detailed sales and inventory reports
- Monitor low-stock products
- Generate daily, weekly, and monthly reports

### Sales Representative Features
- Process sales transactions
- Search and view products
- Check stock availability
- Complete checkout process

### Inventory Management
- Track stock levels in real time
- Manage product categories and pricing
- Monitor expiry dates
- Low-stock alerts

### Reporting
- Daily sales reports
- Weekly and monthly analytics
- Top products analysis
- Inventory status reports

## Project Structure

```
POS/
├── client/              # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service
│   │   └── styles/      # CSS files
│   └── package.json
│
└── server/              # Node.js/Express Backend
    ├── src/
    │   ├── config/      # Database configuration
    │   ├── controllers/ # Route controllers
    │   ├── middleware/  # Custom middleware
    │   ├── models/      # Database models
    │   ├── routes/      # API routes
    │   └── server.js    # Main server file
    ├── .env
    └── package.json
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MySQL database

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your `.env` file with database credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=pharmacy_pos
   PORT=5000
   JWT_SECRET=your_jwt_secret
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will open at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Inventory
- `GET /api/inventory` - Get all products
- `GET /api/inventory/:id` - Get product by ID
- `POST /api/inventory` - Create new product
- `PUT /api/inventory/:id` - Update product
- `DELETE /api/inventory/:id` - Delete product
- `GET /api/inventory/stock/low` - Get low stock products

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get sale by ID
- `POST /api/sales` - Create new sale
- `GET /api/sales/daily/summary` - Get daily sales

### Reports
- `GET /api/reports/sales/daily` - Daily sales report
- `GET /api/reports/sales/weekly` - Weekly sales report
- `GET /api/reports/sales/monthly` - Monthly sales report
- `GET /api/reports/inventory/status` - Inventory status report
- `GET /api/reports/top-products` - Top 10 products

## Database Schema

### Users Table
- id (Primary Key)
- name
- email (Unique)
- password (hashed)
- role (admin/sales)
- createdAt
- updatedAt

### Products Table
- id (Primary Key)
- name
- category
- price
- stock_quantity
- expiry_date
- createdAt
- updatedAt

### Sales Table
- id (Primary Key)
- product_id (Foreign Key)
- quantity
- total_price
- date
- createdAt
- updatedAt

## Technologies Used

### Frontend
- React.js
- React Router
- Axios
- CSS3

### Backend
- Node.js
- Express.js
- Sequelize ORM
- MySQL
- JWT Authentication
- bcryptjs

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Dashboard**: View key metrics and summaries
3. **Inventory**: Manage products (add, edit, delete)
4. **Sales**: Process customer transactions
5. **Reports**: View detailed sales and inventory reports

## Future Enhancements

- Receipt printing functionality
- Barcode scanning
- Multi-language support
- Advanced analytics
- Email notifications
- Mobile app version
- Payment gateway integration

## Support

For issues or questions, please contact the development team.

## License

ISC
- View inventory reports (expired drugs, low-stock items).
- Export reports in PDF/Excel format.

---

## System Requirements

### **Hardware**
- Processor: Intel i3 or above.
- RAM: Minimum 4GB.
- Storage: At least 10GB free space.

### **Software**
- Operating System: Windows 10/11, macOS, or Linux.
- Database: MySQL or PostgreSQL.
- Server: Node.js or Python-based backend (depending on implementation).
- Browser: Chrome, Firefox, or Edge (for web-based systems).

---

## Installation

Follow these steps to install and set up the Pharmacy POS System:

### **1. Clone the Repository**
```bash
git clone https://github.com/your-repo/pharmacy-pos-system.git
cd pharmacy-pos-system
```

### **2. Install Dependencies**
- For a Node.js-based backend:
  ```bash
  npm install
  ```
- For Python (Django/Flask):
  ```bash
  pip install -r requirements.txt
  ```

### **3. Configure the Database**
- Create a database in MySQL/PostgreSQL.
- Update the database credentials in the `.env` file:
  ```env
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=yourpassword
  DB_NAME=pharmacy_pos
  ```

### **4. Run Migrations**
- For Node.js (using Sequelize):
  ```bash
  npx sequelize-cli db:migrate
  ```
- For Python (using Django):
  ```bash
  python manage.py migrate
  ```

### **5. Start the Server**
- For Node.js:
  ```bash
  npm start
  ```
- For Python:
  ```bash
  python manage.py runserver
  ```

### **6. Access the POS System**
Open your browser and navigate to:
```
http://localhost:3000
```
or
```
http://127.0.0.1:8000
```

---

## Usage

### **Admin Guide**

Admins have full control over the system. Below are the main actions they can perform:

1. **Login**
   - Use the admin credentials provided during setup to log in.

2. **Manage Inventory**
   - Navigate to the "Inventory" section.
   - Add new products (name, category, price, stock quantity, expiry date).
   - Update or delete existing products.

3. **Manage Users**
   - Go to the "User Management" section.
   - Add new users (admins or sales reps) with specific roles.
   - Reset passwords for users if needed.

4. **View Reports**
   - Access the "Reports" section to generate:
     - Sales reports (filter by date range).
     - Inventory reports (view low-stock or expired items).

5. **System Settings**
   - Configure tax rates, discounts, and receipt templates.

---

### **Sales Representative Guide**

Sales Representatives have limited access to the system. Below are the key actions they can perform:

1. **Login**
   - Use the credentials provided by the admin to log in.

2. **Process Sales**
   - Search for products by name, category, or barcode.
   - Add products to the cart.
   - Apply discounts or taxes (if allowed by the admin).
   - Complete the sale and print the receipt.

3. **View Stock**
   - Check stock availability before processing a sale.

---

## API Documentation

The Pharmacy POS System includes a RESTful API for backend operations. Below are the key endpoints:

### **Authentication**
- `POST /api/auth/login`: Login for admins and sales reps.
- `POST /api/auth/logout`: Logout.

### **Inventory Management**
- `GET /api/inventory`: Fetch all products.
- `POST /api/inventory`: Add a new product.
- `PUT /api/inventory/:id`: Update a product.
- `DELETE /api/inventory/:id`: Delete a product.

### **Sales**
- `POST /api/sales`: Process a new sale.
- `GET /api/sales`: Fetch all sales.
- `GET /api/sales/:id`: Fetch a specific sale.

### **Reports**
- `GET /api/reports/sales`: Generate sales reports.
- `GET /api/reports/inventory`: Generate inventory reports.

---

## Database Schema

Below is a simplified view of the database schema:

### **Tables**
1. **Users**
   - `id`: Primary Key
   - `name`: User's full name
   - `email`: Login email
   - `password`: Hashed password
   - `role`: `admin` or `sales_rep`

2. **Products**
   - `id`: Primary Key
   - `name`: Product name
   - `category`: Product category
   - `price`: Selling price
   - `stock_quantity`: Available stock
   - `expiry_date`: Expiration date

3. **Sales**
   - `id`: Primary Key
   - `product_id`: Foreign Key (Products table)
   - `quantity`: Quantity sold
   - `total_price`: Total sale amount
   - `date`: Sale date

4. **Reports**
   - `id`: Primary Key
   - `type`: Report type (`sales`, `inventory`)
   - `content`: JSON data

---

## Support

For any issues or inquiries, please contact our support team at:
- Email: support@pharmacy-pos.com
- Phone: +123-456-7890

Alternatively, create an issue in the [GitHub repository](https://github.com/your-repo/pharmacy-pos-system/issues).

---

Thank you for using the **Pharmacy POS System**!
```

This `README.md` file covers all critical aspects of your pharmacy POS system, including user roles, installation, usage, features, API documentation, and database schema. Adjust the file as your project evolves.