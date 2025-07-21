# Inventory System Backend

Backend API server for the Inventory Management System built with Node.js, Express, and MySQL.

## Features

- RESTful API endpoints for inventory management
- MySQL database integration
- CORS enabled for frontend integration
- Dashboard statistics and analytics
- CRUD operations for categories, suppliers, units, and items
- Stock movement tracking
- Notification system

## Prerequisites

- Node.js (>= 16.0.0)
- MySQL database
- npm or yarn package manager

## Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your MySQL database:
   - Create a database named `inventory_system`
   - Update database connection settings in `server.js` if needed

## Database Configuration

Update the database connection settings in `server.js`:

```javascript
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'inventory_system'
});
```

## Running the Server

### Development Mode
```bash
npm run dev
```
This will start the server with nodemon for automatic restarts on file changes.

### Production Mode
```bash
npm start
```

The server will run on port 5000 by default (or the port specified in the PORT environment variable).

## API Endpoints

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-movements` - Get recent stock movements
- `GET /api/dashboard/monthly-stats` - Get monthly statistics

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create new supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Units
- `GET /api/units` - Get all units
- `POST /api/units` - Create new unit
- `PUT /api/units/:id` - Update unit
- `DELETE /api/units/:id` - Delete unit

### Items
- `GET /api/items` - Get all items with related data
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with nodemon
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Run ESLint and automatically fix issues

## Dependencies

### Production Dependencies
- `express` - Web framework for Node.js
- `mysql2` - MySQL client for Node.js
- `cors` - Cross-Origin Resource Sharing middleware

### Development Dependencies
- `nodemon` - Automatic server restart on file changes
- `eslint` - Code linting and formatting

## Environment Variables

- `PORT` - Server port (default: 5000)

## License

ISC 