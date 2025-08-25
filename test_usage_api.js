const mysql = require('mysql2');

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'inventory_system'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
  
  // Test 1: Check stock_movements table
  console.log('\n=== Test 1: Checking stock_movements table ===');
  db.query('SELECT COUNT(*) as total FROM stock_movements', (err, results) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      console.log('Total stock movements:', results[0].total);
    }
  });
  
  // Test 2: Check stock_movements with 'out' type
  console.log('\n=== Test 2: Checking stock_movements with out type ===');
  db.query('SELECT COUNT(*) as total FROM stock_movements WHERE movement_type = "out"', (err, results) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      console.log('Total out movements:', results[0].total);
    }
  });
  
  // Test 3: Check sample data
  console.log('\n=== Test 3: Sample stock_movements data ===');
  db.query('SELECT * FROM stock_movements WHERE movement_type = "out" LIMIT 5', (err, results) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      console.log('Sample out movements:', results);
    }
  });
  
  // Test 4: Check items table
  console.log('\n=== Test 4: Checking items table ===');
  db.query('SELECT COUNT(*) as total FROM items WHERE status = "active"', (err, results) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      console.log('Total active items:', results[0].total);
    }
  });
  
  // Test 5: Test the main usage query
  console.log('\n=== Test 5: Testing main usage query ===');
  const query = `
    SELECT 
      i.id,
      i.code as itemCode,
      i.name as itemName,
      c.name as category,
      COALESCE(SUM(CASE WHEN sm.movement_type = 'out' THEN ABS(sm.quantity) ELSE 0 END), 0) as totalUsage,
      ROUND(COALESCE(SUM(CASE WHEN sm.movement_type = 'out' THEN ABS(sm.quantity) ELSE 0 END), 0) / 30, 1) as averageDaily,
      MAX(sm.created_at) as lastUsage
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN stock_movements sm ON i.id = sm.item_id
    WHERE i.status = 'active'
    GROUP BY i.id, i.code, i.name, c.name
    ORDER BY totalUsage DESC
    LIMIT 5
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      console.log('Main usage query results:', results);
    }
    
    // Close connection after all tests
    db.end();
  });
});
