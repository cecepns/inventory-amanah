const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

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
});

// Routes

// Dashboard API
app.get('/dashboard/stats', (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total_items FROM items WHERE status = "active"',
    'SELECT COUNT(*) as low_stock_items FROM items WHERE current_stock <= min_stock AND status = "active"',
    'SELECT COUNT(*) as pending_orders FROM purchase_orders WHERE status = "pending"',
    'SELECT SUM(current_stock * price) as total_inventory_value FROM items WHERE status = "active"'
  ];

  Promise.all(queries.map(query => {
    return new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  })).then(results => {
    res.json({
      totalItems: results[0].total_items,
      lowStockItems: results[1].low_stock_items,
      pendingOrders: results[2].pending_orders,
      totalInventoryValue: results[3].total_inventory_value || 0
    });
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
});

app.get('/dashboard/recent-movements', (req, res) => {
  const query = `
    SELECT sm.*, i.name as item_name, u.full_name as user_name
    FROM stock_movements sm
    JOIN items i ON sm.item_id = i.id
    JOIN users u ON sm.created_by = u.id
    ORDER BY sm.created_at DESC
    LIMIT 10
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.get('/dashboard/monthly-stats', (req, res) => {
  const query = `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m') as month,
      COUNT(*) as total_movements,
      SUM(CASE WHEN movement_type = 'in' THEN quantity ELSE 0 END) as total_in,
      SUM(CASE WHEN movement_type = 'out' THEN quantity ELSE 0 END) as total_out
    FROM stock_movements
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY month DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Categories API
app.get('/categories', (req, res) => {
  db.query('SELECT * FROM categories ORDER BY name', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.post('/categories', (req, res) => {
  const { name, description } = req.body;
  db.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: results.insertId, name, description });
  });
});

app.put('/categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;
  db.query('UPDATE categories SET name = ?, description = ?, status = ? WHERE id = ?', 
    [name, description, status, id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Category updated successfully' });
  });
});

app.delete('/categories/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM categories WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Category deleted successfully' });
  });
});

// Suppliers API
app.get('/suppliers', (req, res) => {
  db.query('SELECT * FROM suppliers ORDER BY name', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.post('/suppliers', (req, res) => {
  const { name, contact_person, phone, email, address, city } = req.body;
  db.query('INSERT INTO suppliers (name, contact_person, phone, email, address, city) VALUES (?, ?, ?, ?, ?, ?)', 
    [name, contact_person, phone, email, address, city], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: results.insertId, ...req.body });
  });
});

app.put('/suppliers/:id', (req, res) => {
  const { id } = req.params;
  const { name, contact_person, phone, email, address, city, status } = req.body;
  db.query('UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, city = ?, status = ? WHERE id = ?', 
    [name, contact_person, phone, email, address, city, status, id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Supplier updated successfully' });
  });
});

app.delete('/suppliers/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM suppliers WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Supplier deleted successfully' });
  });
});

// Units API
app.get('/units', (req, res) => {
  db.query('SELECT * FROM units ORDER BY name', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.post('/units', (req, res) => {
  const { name, symbol, description } = req.body;
  db.query('INSERT INTO units (name, symbol, description) VALUES (?, ?, ?)', [name, symbol, description], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: results.insertId, name, symbol, description });
  });
});

app.put('/units/:id', (req, res) => {
  const { id } = req.params;
  const { name, symbol, description, status } = req.body;
  db.query('UPDATE units SET name = ?, symbol = ?, description = ?, status = ? WHERE id = ?', 
    [name, symbol, description, status, id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Unit updated successfully' });
  });
});

app.delete('/units/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM units WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Unit deleted successfully' });
  });
});

// Items API
app.get('/items', (req, res) => {
  const query = `
    SELECT i.*, c.name as category_name, u.symbol as unit_symbol, s.name as supplier_name
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN units u ON i.unit_id = u.id
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    ORDER BY i.name
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.post('/items', (req, res) => {
  const { code, name, description, category_id, unit_id, supplier_id, price, cost, current_stock, min_stock, max_stock, location } = req.body;
  
  db.query('INSERT INTO items (code, name, description, category_id, unit_id, supplier_id, price, cost, current_stock, min_stock, max_stock, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
    [code, name, description, category_id, unit_id, supplier_id, price, cost, current_stock, min_stock, max_stock, location], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: results.insertId, ...req.body });
  });
});

app.put('/items/:id', (req, res) => {
  const { id } = req.params;
  const { code, name, description, category_id, unit_id, supplier_id, price, cost, current_stock, min_stock, max_stock, location, status } = req.body;
  
  db.query('UPDATE items SET code = ?, name = ?, description = ?, category_id = ?, unit_id = ?, supplier_id = ?, price = ?, cost = ?, current_stock = ?, min_stock = ?, max_stock = ?, location = ?, status = ? WHERE id = ?', 
    [code, name, description, category_id, unit_id, supplier_id, price, cost, current_stock, min_stock, max_stock, location, status, id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Item updated successfully' });
  });
});

app.delete('/items/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM items WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Item deleted successfully' });
  });
});

// Notifications API
app.get('/notifications', (req, res) => {
  const query = `
    SELECT n.*, i.name as item_name
    FROM notifications n
    LEFT JOIN items i ON n.item_id = i.id
    ORDER BY n.created_at DESC
    LIMIT 20
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.put('/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  db.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Notification marked as read' });
  });
});

// Purchase Orders API
app.get('/purchase_orders', (req, res) => {
  const query = `
    SELECT po.*, s.name as supplier_name
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    ORDER BY po.order_date DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Monthly Purchase Orders Stats API - HARUS SEBELUM route :id
app.get('/purchase_orders/monthly-stats', (req, res) => {

  const query = `
    SELECT 
      DATE_FORMAT(order_date, '%Y-%m') as month,
      SUM(total_amount) as amount,
      COUNT(*) as orders
    FROM purchase_orders
    WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
    ORDER BY month ASC
  `;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.get('/purchase_orders/:id', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT po.*, s.name as supplier_name
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    WHERE po.id = ?
  `;
  db.query(query, [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ message: 'Purchase order not found' });
      return;
    }
    // Get items for this purchase order
    const itemsQuery = `
      SELECT poi.*, i.name as item_name
      FROM purchase_order_items poi
      LEFT JOIN items i ON poi.item_id = i.id
      WHERE poi.purchase_order_id = ?
    `;
    db.query(itemsQuery, [id], (err, items) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ ...results[0], items });
    });
  });
});

app.post('/purchase_orders', (req, res) => {
  const { order_number, supplier_id, order_date, expected_date, total_amount, status, notes, items } = req.body;
  db.query(
    'INSERT INTO purchase_orders (order_number, supplier_id, order_date, expected_date, total_amount, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [order_number, supplier_id, order_date, expected_date, total_amount, status, notes],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      const purchase_order_id = results.insertId;
      if (Array.isArray(items) && items.length > 0) {
        const values = items.map(item => [purchase_order_id, item.item_id, item.quantity, item.unit_price, item.total_price]);
        db.query(
          'INSERT INTO purchase_order_items (purchase_order_id, item_id, quantity, unit_price, total_price) VALUES ?',
          [values],
          (err2) => {
            if (err2) {
              res.status(500).json({ error: err2.message });
              return;
            }
            res.json({ id: purchase_order_id, order_number, supplier_id, order_date, expected_date, total_amount, status, notes, items });
          }
        );
      } else {
        res.json({ id: purchase_order_id, order_number, supplier_id, order_date, expected_date, total_amount, status, notes, items: [] });
      }
    }
  );
});

app.put('/purchase_orders/:id', (req, res) => {
  const { id } = req.params;
  const { order_number, supplier_id, order_date, expected_date, total_amount, status, notes, items } = req.body;
  db.query(
    'UPDATE purchase_orders SET order_number = ?, supplier_id = ?, order_date = ?, expected_date = ?, total_amount = ?, status = ?, notes = ? WHERE id = ?',
    [order_number, supplier_id, order_date, expected_date, total_amount, status, notes, id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      // Update items: delete old, insert new
      db.query('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [id], (err2) => {
        if (err2) {
          res.status(500).json({ error: err2.message });
          return;
        }
        if (Array.isArray(items) && items.length > 0) {
          const values = items.map(item => [id, item.item_id, item.quantity, item.unit_price, item.total_price]);
          db.query(
            'INSERT INTO purchase_order_items (purchase_order_id, item_id, quantity, unit_price, total_price) VALUES ?',
            [values],
            (err3) => {
              if (err3) {
                res.status(500).json({ error: err3.message });
                return;
              }
              res.json({ message: 'Purchase order updated successfully' });
            }
          );
        } else {
          res.json({ message: 'Purchase order updated successfully' });
        }
      });
    }
  );
});

app.delete('/purchase_orders/:id', (req, res) => {
  const { id } = req.params;
  // Only allow delete if status is pending
  db.query('SELECT status FROM purchase_orders WHERE id = ?', [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ message: 'Purchase order not found' });
      return;
    }
    if (results[0].status !== 'pending') {
      res.status(400).json({ message: 'Only pending orders can be deleted' });
      return;
    }
    db.query('DELETE FROM purchase_orders WHERE id = ?', [id], (err2) => {
      if (err2) {
        res.status(500).json({ error: err2.message });
        return;
      }
      res.json({ message: 'Purchase order deleted successfully' });
    });
  });
});

// Receipts API
app.get('/receipts', (req, res) => {
  const query = `
    SELECT r.*, po.order_number as purchase_order_number, s.name as supplier_name
    FROM receipts r
    LEFT JOIN purchase_orders po ON r.purchase_order_id = po.id
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    ORDER BY r.receipt_date DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.get('/receipts/:id', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT r.*, po.order_number as purchase_order_number, s.name as supplier_name
    FROM receipts r
    LEFT JOIN purchase_orders po ON r.purchase_order_id = po.id
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    WHERE r.id = ?
  `;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ message: 'Receipt not found' });
      return;
    }
    
    // Get items for this receipt
    const itemsQuery = `
      SELECT ri.*, i.name as item_name, i.code as item_code
      FROM receipt_items ri
      LEFT JOIN items i ON ri.item_id = i.id
      WHERE ri.receipt_id = ?
    `;
    
    db.query(itemsQuery, [id], (err, items) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ ...results[0], items });
    });
  });
});

app.post('/receipts', async (req, res) => {
  let { receipt_number, purchase_order_id, receipt_date, total_amount, status, notes, items, created_by } = req.body;

  // Generate nomor otomatis jika tidak dikirim
  if (!receipt_number || receipt_number.trim() === '') {
    try {
      // Gunakan tanggal hari ini (atau receipt_date jika ada)
      const today = receipt_date ? new Date(receipt_date) : new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const dateStr = `${y}${m}${d}`;
      // Cari nomor urut terakhir hari ini
      const [rows] = await db.promise().query(
        'SELECT receipt_number FROM receipts WHERE receipt_number LIKE ? ORDER BY receipt_number DESC LIMIT 1',
        [`RCPT-${dateStr}-%`]
      );
      let nextNum = 1;
      if (rows.length > 0) {
        const last = rows[0].receipt_number;
        const match = last.match(/RCPT-\d{8}-(\d{3})$/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }
      receipt_number = `RCPT-${dateStr}-${String(nextNum).padStart(3, '0')}`;
    } catch (err) {
      return res.status(500).json({ error: 'Gagal generate nomor penerimaan: ' + err.message });
    }
  }
  
  db.query(
    'INSERT INTO receipts (receipt_number, purchase_order_id, receipt_date, total_amount, status, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [receipt_number, purchase_order_id, receipt_date, total_amount, status, notes, created_by],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const receipt_id = results.insertId;
      
      if (Array.isArray(items) && items.length > 0) {
        const values = items.map(item => [
          receipt_id, 
          item.item_id, 
          item.quantity_ordered, 
          item.quantity_received, 
          item.unit_price, 
          item.total_price
        ]);
        
        db.query(
          'INSERT INTO receipt_items (receipt_id, item_id, quantity_ordered, quantity_received, unit_price, total_price) VALUES ?',
          [values],
          (err2) => {
            if (err2) {
              res.status(500).json({ error: err2.message });
              return;
            }
            
            // Update item stock and create stock movements
            items.forEach(item => {
              if (item.quantity_received > 0) {
                // Update item stock
                db.query(
                  'UPDATE items SET current_stock = current_stock + ? WHERE id = ?',
                  [item.quantity_received, item.item_id],
                  (err3) => {
                    if (err3) console.error('Error updating stock:', err3);
                  }
                );
                
                // Create stock movement
                db.query(
                  'INSERT INTO stock_movements (item_id, movement_type, quantity, reference_type, reference_id, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [item.item_id, 'in', item.quantity_received, 'purchase', receipt_id, `Receipt: ${receipt_number}`, created_by],
                  (err4) => {
                    if (err4) console.error('Error creating stock movement:', err4);
                  }
                );
              }
            });
            
            res.json({ id: receipt_id, receipt_number, purchase_order_id, receipt_date, total_amount, status, notes, items });
          }
        );
      } else {
        res.json({ id: receipt_id, receipt_number, purchase_order_id, receipt_date, total_amount, status, notes, items: [] });
      }
    }
  );
});

app.put('/receipts/:id', (req, res) => {
  const { id } = req.params;
  const { receipt_number, purchase_order_id, receipt_date, total_amount, status, notes, items } = req.body;
  
  db.query(
    'UPDATE receipts SET receipt_number = ?, purchase_order_id = ?, receipt_date = ?, total_amount = ?, status = ?, notes = ? WHERE id = ?',
    [receipt_number, purchase_order_id, receipt_date, total_amount, status, notes, id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Update items: delete old, insert new
      db.query('DELETE FROM receipt_items WHERE receipt_id = ?', [id], (err2) => {
        if (err2) {
          res.status(500).json({ error: err2.message });
          return;
        }
        
        if (Array.isArray(items) && items.length > 0) {
          const values = items.map(item => [
            id, 
            item.item_id, 
            item.quantity_ordered, 
            item.quantity_received, 
            item.unit_price, 
            item.total_price
          ]);
          
          db.query(
            'INSERT INTO receipt_items (receipt_id, item_id, quantity_ordered, quantity_received, unit_price, total_price) VALUES ?',
            [values],
            (err3) => {
              if (err3) {
                res.status(500).json({ error: err3.message });
                return;
              }
              res.json({ message: 'Receipt updated successfully' });
            }
          );
        } else {
          res.json({ message: 'Receipt updated successfully' });
        }
      });
    }
  );
});

app.delete('/receipts/:id', (req, res) => {
  const { id } = req.params;
  
  // Check if receipt can be deleted (only pending receipts)
  db.query('SELECT status FROM receipts WHERE id = ?', [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ message: 'Receipt not found' });
      return;
    }
    if (results[0].status === 'completed') {
      res.status(400).json({ message: 'Cannot delete completed receipts' });
      return;
    }
    
    db.query('DELETE FROM receipts WHERE id = ?', [id], (err2) => {
      if (err2) {
        res.status(500).json({ error: err2.message });
        return;
      }
      res.json({ message: 'Receipt deleted successfully' });
    });
  });
});

// Stock Movements API
app.get('/stock_movements', (req, res) => {
  const query = `
    SELECT sm.*, i.name as item_name, i.code as item_code, u.full_name as user_name
    FROM stock_movements sm
    LEFT JOIN items i ON sm.item_id = i.id
    LEFT JOIN users u ON sm.created_by = u.id
    ORDER BY sm.created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.post('/stock_movements', (req, res) => {
  const { item_id, movement_type, quantity, reference_type, reference_id, notes, created_by } = req.body;
  
  db.query(
    'INSERT INTO stock_movements (item_id, movement_type, quantity, reference_type, reference_id, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [item_id, movement_type, quantity, reference_type, reference_id, notes, created_by],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Update item stock based on movement type
      let stockChange = 0;
      if (movement_type === 'in') {
        stockChange = Math.abs(quantity); // Ensure positive for in movements
      } else if (movement_type === 'out') {
        stockChange = -Math.abs(quantity); // Ensure negative for out movements
      } else if (movement_type === 'adjustment') {
        stockChange = quantity; // quantity can be positive or negative for adjustments
      }
      
      if (stockChange !== 0) {
        db.query(
          'UPDATE items SET current_stock = current_stock + ? WHERE id = ?',
          [stockChange, item_id],
          (err2) => {
            if (err2) {
              console.error('Error updating stock:', err2);
            }
          }
        );
      }
      
      res.json({ id: results.insertId, item_id, movement_type, quantity, reference_type, reference_id, notes, created_by });
    }
  );
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Authentication routes
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const query = 'SELECT * FROM users WHERE username = ? AND status = "active"';
  
  db.query(query, [username], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = results[0];
    
    // Compare password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      // Create token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remove password from response
      // eslint-disable-next-line no-unused-vars
      const { password, ...userWithoutPassword } = user;

      res.json({
        success: true,
        user: userWithoutPassword,
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  });
});

app.post('/auth/register', async (req, res) => {
  const { username, password, email, full_name, role = 'user' } = req.body;

  if (!username || !password || !email || !full_name) {
    return res.status(400).json({ message: 'Username, password, email, and full_name are required' });
  }

  try {
    // Check if username already exists
    const checkQuery = 'SELECT id FROM users WHERE username = ?';
    db.query(checkQuery, [username], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Hash password using bcrypt
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new user
      const insertQuery = 'INSERT INTO users (username, password, email, full_name, role, status) VALUES (?, ?, ?, ?, ?, "active")';
      db.query(insertQuery, [username, hashedPassword, email, full_name, role], (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }

        res.json({
          success: true,
          message: 'User registered successfully',
          user: {
            id: results.insertId,
            username,
            email,
            full_name,
            role,
            status: 'active'
          }
        });
      });
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/auth/logout', (req, res) => {
  // In a real app, you might want to blacklist the token
  res.json({ success: true, message: 'Logged out successfully' });
});

// Protected route example
app.get('/auth/me', authenticateToken, (req, res) => {
  const query = 'SELECT id, username, email, full_name, role, status FROM users WHERE id = ?';
  
  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: results[0] });
  });
});

// Users API
app.get('/users', authenticateToken, (req, res) => {
  console.log('GET /users called');
  const query = 'SELECT id, username, email, full_name, role, status, created_at FROM users ORDER BY created_at DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Endpoint untuk menghapus user
app.delete('/users/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  // Tidak boleh menghapus diri sendiri
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'Tidak dapat menghapus user yang sedang login.' });
  }
  db.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }
    res.json({ message: 'User berhasil dihapus.' });
  });
});

// Endpoint untuk mengedit user
app.put('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { username, email, full_name, role, status, password } = req.body;
  
  try {
    // Cek apakah user exists
    const checkQuery = 'SELECT id FROM users WHERE id = ?';
    db.query(checkQuery, [id], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'User tidak ditemukan.' });
      }
      
      // Jika ada password baru, hash password
      let updateQuery, queryParams;
      if (password && password.trim() !== '') {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        updateQuery = 'UPDATE users SET username = ?, email = ?, full_name = ?, role = ?, status = ?, password = ? WHERE id = ?';
        queryParams = [username, email, full_name, role, status, hashedPassword, id];
      } else {
        updateQuery = 'UPDATE users SET username = ?, email = ?, full_name = ?, role = ?, status = ? WHERE id = ?';
        queryParams = [username, email, full_name, role, status, id];
      }
      
      db.query(updateQuery, queryParams, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        
        res.json({ 
          message: 'User berhasil diperbarui.',
          user: { id, username, email, full_name, role, status }
        });
      });
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Usage Reports API
app.get('/reports/usage', (req, res) => {
  const { category = '', search = '', dateRange = 'this_month' } = req.query;
  
  let dateCondition = '';
  switch (dateRange) {
    case 'last_month':
      dateCondition = 'AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH) AND sm.created_at < DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
      break;
    case 'last_3_months':
      dateCondition = 'AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
      break;
    case 'this_year':
      dateCondition = 'AND YEAR(sm.created_at) = YEAR(CURDATE())';
      break;
    case 'last_year':
      dateCondition = 'AND YEAR(sm.created_at) = YEAR(CURDATE()) - 1';
      break;
    default: // this_month
      dateCondition = 'AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
  }
  
  let categoryCondition = category ? 'AND c.name = ?' : '';
  let searchCondition = search ? 'AND (i.code LIKE ? OR i.name LIKE ?)' : '';
  
  const query = `
    SELECT 
      i.id,
      i.code as itemCode,
      i.name as itemName,
      c.name as category,
      COALESCE(SUM(CASE WHEN sm.movement_type = 'out' THEN ABS(sm.quantity) ELSE 0 END), 0) as totalUsage,
      ROUND(COALESCE(SUM(CASE WHEN sm.movement_type = 'out' THEN ABS(sm.quantity) ELSE 0 END), 0) / 30, 1) as averageDaily,
      MAX(sm.created_at) as lastUsage,
      CASE 
        WHEN COALESCE(SUM(CASE WHEN sm.movement_type = 'out' AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 15 DAY) THEN ABS(sm.quantity) ELSE 0 END), 0) > 
             COALESCE(SUM(CASE WHEN sm.movement_type = 'out' AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND sm.created_at < DATE_SUB(CURDATE(), INTERVAL 15 DAY) THEN ABS(sm.quantity) ELSE 0 END), 0) 
        THEN 'up'
        WHEN COALESCE(SUM(CASE WHEN sm.movement_type = 'out' AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 15 DAY) THEN ABS(sm.quantity) ELSE 0 END), 0) < 
             COALESCE(SUM(CASE WHEN sm.movement_type = 'out' AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND sm.created_at < DATE_SUB(CURDATE(), INTERVAL 15 DAY) THEN ABS(sm.quantity) ELSE 0 END), 0) 
        THEN 'down'
        ELSE 'stable'
      END as trend
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN stock_movements sm ON i.id = sm.item_id ${dateCondition}
    WHERE i.status = 'active' ${categoryCondition} ${searchCondition}
    GROUP BY i.id, i.code, i.name, c.name
    ORDER BY totalUsage DESC
  `;
  
  const queryParams = [];
  if (category) queryParams.push(category);
  if (search) {
    queryParams.push(`%${search}%`);
    queryParams.push(`%${search}%`);
  }
  
  db.query(query, queryParams, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.get('/reports/usage/daily', (req, res) => {
  const { dateRange = 'this_month' } = req.query;
  
  let dateCondition = 'WHERE sm.movement_type = "out"';
  switch (dateRange) {
    case 'last_month':
      dateCondition += ' AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH) AND sm.created_at < DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
      break;
    case 'last_3_months':
      dateCondition += ' AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
      break;
    case 'this_year':
      dateCondition += ' AND YEAR(sm.created_at) = YEAR(CURDATE())';
      break;
    case 'last_year':
      dateCondition += ' AND YEAR(sm.created_at) = YEAR(CURDATE()) - 1';
      break;
    default: // this_month
      dateCondition += ' AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
  }
  
  const query = `
    SELECT 
      DATE_FORMAT(sm.created_at, '%d/%m') as date,
      DATE(sm.created_at) as fullDate,
      SUM(CASE WHEN sm.movement_type = 'out' THEN ABS(sm.quantity) ELSE 0 END) as \`usage\`
    FROM stock_movements sm
    ${dateCondition}
    GROUP BY DATE(sm.created_at)
    ORDER BY fullDate ASC
    LIMIT 30
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.get('/reports/usage/category', (req, res) => {
  const { dateRange = 'this_month' } = req.query;
  
  let dateCondition = '';
  switch (dateRange) {
    case 'last_month':
      dateCondition = 'AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH) AND sm.created_at < DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
      break;
    case 'last_3_months':
      dateCondition = 'AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
      break;
    case 'this_year':
      dateCondition = 'AND YEAR(sm.created_at) = YEAR(CURDATE())';
      break;
    case 'last_year':
      dateCondition = 'AND YEAR(sm.created_at) = YEAR(CURDATE()) - 1';
      break;
    default: // this_month
      dateCondition = 'AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
  }
  
  const query = `
    SELECT 
      c.name,
      COALESCE(SUM(CASE WHEN sm.movement_type = 'out' THEN ABS(sm.quantity) ELSE 0 END), 0) as \`value\`,
      CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(CASE WHEN sm.movement_type = 'out' THEN ABS(sm.quantity) ELSE 0 END), 0) DESC) = 1 THEN '#3B82F6'
        WHEN ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(CASE WHEN sm.movement_type = 'out' THEN ABS(sm.quantity) ELSE 0 END), 0) DESC) = 2 THEN '#10B981'
        WHEN ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(CASE WHEN sm.movement_type = 'out' THEN ABS(sm.quantity) ELSE 0 END), 0) DESC) = 3 THEN '#F59E0B'
        WHEN ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(CASE WHEN sm.movement_type = 'out' THEN ABS(sm.quantity) ELSE 0 END), 0) DESC) = 4 THEN '#EF4444'
        ELSE '#8B5CF6'
      END as color
    FROM categories c
    LEFT JOIN items i ON c.id = i.category_id
    LEFT JOIN stock_movements sm ON i.id = sm.item_id ${dateCondition}
    WHERE c.status = 'active' AND sm.movement_type = 'out'
    GROUP BY c.id, c.name
    ORDER BY \`value\` DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.get('/reports/usage/movements/:itemId', (req, res) => {
  const { itemId } = req.params;
  const { dateRange = 'this_month' } = req.query;
  
  let dateCondition = '';
  switch (dateRange) {
    case 'last_month':
      dateCondition = 'AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH) AND sm.created_at < DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
      break;
    case 'last_3_months':
      dateCondition = 'AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
      break;
    case 'this_year':
      dateCondition = 'AND YEAR(sm.created_at) = YEAR(CURDATE())';
      break;
    default: // this_month
      dateCondition = 'AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
  }
  
  const query = `
    SELECT 
      DATE(sm.created_at) as date,
      sm.quantity,
      sm.movement_type as type,
      sm.notes
    FROM stock_movements sm
    WHERE sm.item_id = ? AND sm.movement_type = 'out' ${dateCondition}
    ORDER BY sm.created_at ASC
  `;
  
  db.query(query, [itemId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// EOQ Calculations API
app.get('/eoq_calculations', (req, res) => {
  const { item_id } = req.query;
  
  let query = `
    SELECT ec.*, i.name as item_name, i.code as item_code
    FROM eoq_calculations ec
    LEFT JOIN items i ON ec.item_id = i.id
  `;
  let queryParams = [];
  
  if (item_id) {
    query += ' WHERE ec.item_id = ?';
    queryParams.push(item_id);
  }
  
  query += ' ORDER BY ec.calculation_date DESC';
  
  db.query(query, queryParams, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.post('/eoq_calculations', (req, res) => {
  const { 
    item_id, 
    annual_demand, 
    ordering_cost, 
    holding_cost, 
    eoq_quantity, 
    total_cost, 
    reorder_point, 
    calculation_date, 
    created_by 
  } = req.body;
  
  const query = `
    INSERT INTO eoq_calculations 
    (item_id, annual_demand, ordering_cost, holding_cost, eoq_quantity, total_cost, reorder_point, calculation_date, created_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [
    item_id, annual_demand, ordering_cost, holding_cost, 
    eoq_quantity, total_cost, reorder_point, calculation_date, created_by
  ], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ 
      id: results.insertId, 
      message: 'EOQ calculation saved successfully',
      ...req.body 
    });
  });
});

app.get('/eoq_calculations/:id', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT ec.*, i.name as item_name, i.code as item_code, u.full_name as created_by_name
    FROM eoq_calculations ec
    LEFT JOIN items i ON ec.item_id = i.id
    LEFT JOIN users u ON ec.created_by = u.id
    WHERE ec.id = ?
  `;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ message: 'EOQ calculation not found' });
      return;
    }
    res.json(results[0]);
  });
});

app.delete('/eoq_calculations/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM eoq_calculations WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'EOQ calculation deleted successfully' });
  });
});

// JIT Calculations API
app.get('/jit_calculations', (req, res) => {
  const { item_id } = req.query;
  
  let query = `
    SELECT jc.*, i.name as item_name, i.code as item_code
    FROM jit_calculations jc
    LEFT JOIN items i ON jc.item_id = i.id
  `;
  let queryParams = [];
  
  if (item_id) {
    query += ' WHERE jc.item_id = ?';
    queryParams.push(item_id);
  }
  
  query += ' ORDER BY jc.calculation_date DESC';
  
  db.query(query, queryParams, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.post('/jit_calculations', (req, res) => {
  const { 
    item_id, 
    lead_time, 
    daily_demand, 
    safety_stock, 
    reorder_point, 
    calculation_date, 
    created_by 
  } = req.body;
  
  const query = `
    INSERT INTO jit_calculations 
    (item_id, lead_time, daily_demand, safety_stock, reorder_point, calculation_date, created_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [
    item_id, lead_time, daily_demand, safety_stock, 
    reorder_point, calculation_date, created_by
  ], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ 
      id: results.insertId, 
      message: 'JIT calculation saved successfully',
      ...req.body 
    });
  });
});

app.get('/jit_calculations/:id', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT jc.*, i.name as item_name, i.code as item_code, u.full_name as created_by_name
    FROM jit_calculations jc
    LEFT JOIN items i ON jc.item_id = i.id
    LEFT JOIN users u ON jc.created_by = u.id
    WHERE jc.id = ?
  `;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ message: 'JIT calculation not found' });
      return;
    }
    res.json(results[0]);
  });
});

app.delete('/jit_calculations/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM jit_calculations WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'JIT calculation deleted successfully' });
  });
});

// API untuk mendapatkan historical data item untuk perhitungan
app.get('/items/:id/historical-data', (req, res) => {
  const { id } = req.params;
  const { months = 12 } = req.query;
  
  const query = `
    SELECT 
      DATE_FORMAT(sm.created_at, '%Y-%m') as month,
      SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as total_usage,
      AVG(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as avg_daily_usage
    FROM stock_movements sm
    WHERE sm.item_id = ? 
      AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      AND sm.movement_type = 'out'
    GROUP BY DATE_FORMAT(sm.created_at, '%Y-%m')
    ORDER BY month DESC
  `;
  
  db.query(query, [id, months], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Calculate annual demand from historical data
    const totalUsage = results.reduce((sum, row) => sum + row.total_usage, 0);
    const avgMonthlyUsage = results.length > 0 ? totalUsage / results.length : 0;
    const estimatedAnnualDemand = avgMonthlyUsage * 12;
    
    // Calculate daily demand
    const avgDailyUsage = results.length > 0 
      ? results.reduce((sum, row) => sum + row.avg_daily_usage, 0) / results.length 
      : 0;
    
    res.json({
      historical_data: results,
      estimated_annual_demand: Math.round(estimatedAnnualDemand),
      avg_daily_demand: Math.round(avgDailyUsage * 10) / 10,
      data_period_months: results.length
    });
  });
});

// Settings API
app.get('/settings', (req, res) => {
  db.query('SELECT setting_key, setting_value FROM system_settings', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Convert array of key-value pairs to object
    const settings = {};
    results.forEach(row => {
      let value = row.setting_value;
      
      // Try to parse JSON values (for numbers, booleans, etc.)
      try {
        value = JSON.parse(row.setting_value);
      } catch {
        // Keep as string if not valid JSON
      }
      
      settings[row.setting_key] = value;
    });
    
    res.json(settings);
  });
});

app.put('/settings', authenticateToken, (req, res) => {
  const settings = req.body;
  
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Invalid settings data' });
  }
  
  // Convert settings object to array of key-value pairs
  const settingsArray = Object.entries(settings);
  
  if (settingsArray.length === 0) {
    return res.status(400).json({ error: 'No settings provided' });
  }
  
  // Use transaction to ensure all settings are updated atomically
  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: 'Transaction failed' });
    }
    
    const promises = settingsArray.map(([key, value]) => {
      return new Promise((resolve, reject) => {
        const jsonValue = JSON.stringify(value);
        
        db.query(
          'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
          [key, jsonValue, jsonValue],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    });
    
    Promise.all(promises)
      .then(() => {
        db.commit((err) => {
          if (err) {
            db.rollback();
            return res.status(500).json({ error: 'Failed to commit settings' });
          }
          res.json({ message: 'Settings updated successfully' });
        });
      })
      .catch((err) => {
        db.rollback();
        res.status(500).json({ error: err.message });
      });
  });
});

app.get('/settings/:key', (req, res) => {
  const { key } = req.params;
  
  db.query('SELECT setting_value FROM system_settings WHERE setting_key = ?', [key], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (results.length === 0) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }
    
    let value = results[0].setting_value;
    
    // Try to parse JSON values
    try {
      value = JSON.parse(value);
    } catch {
      // Keep as string if not valid JSON
    }
    
    res.json({ [key]: value });
  });
});

app.put('/settings/:key', authenticateToken, (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  
  if (value === undefined) {
    return res.status(400).json({ error: 'Value is required' });
  }
  
  const jsonValue = JSON.stringify(value);
  
  db.query(
    'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
    [key, jsonValue, jsonValue],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Setting updated successfully' });
    }
  );
});

// Backup API - Download database backup
app.get('/backup/download', authenticateToken, (req, res) => {
  // Only allow owner to download backup
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only owner can download backup' });
  }
  
  const { exec } = require('child_process');
  const fs = require('fs');
  const path = require('path');
  
  // Generate filename with timestamp
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `inventory-backup-${timestamp}.sql`;
  const tempPath = path.join(__dirname, 'temp', filename);
  
  // Ensure temp directory exists
  const tempDir = path.dirname(tempPath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Get database config from connection
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'inventory_system'
  };
  
  // Create mysqldump command
  const mysqldumpCmd = `mysqldump -h ${dbConfig.host} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ''} ${dbConfig.database} > "${tempPath}"`;
  
  // Execute mysqldump
  exec(mysqldumpCmd, (error, stdout, stderr) => {
    if (error) {
      console.error('Backup error:', error);
      return res.status(500).json({ error: 'Failed to create backup' });
    }
    
    // Check if file was created
    if (!fs.existsSync(tempPath)) {
      return res.status(500).json({ error: 'Backup file not created' });
    }
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(tempPath);
    fileStream.pipe(res);
    
    // Clean up temp file after download
    fileStream.on('end', () => {
      fs.unlink(tempPath, (unlinkError) => {
        if (unlinkError) {
          console.error('Error deleting temp file:', unlinkError);
        }
      });
    });
    
    fileStream.on('error', (streamError) => {
      console.error('Stream error:', streamError);
      res.status(500).json({ error: 'Error streaming backup file' });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});