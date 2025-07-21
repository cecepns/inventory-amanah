-- Database: inventory_system
-- Toko Amanah Sparepart Inventory Management System

CREATE DATABASE IF NOT EXISTS inventory_system;
USE inventory_system;

-- Table: users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'staff', 'owner') DEFAULT 'staff',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: categories
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: suppliers
CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(50),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: units
CREATE TABLE units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: items
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT,
    unit_id INT,
    supplier_id INT,
    price DECIMAL(15,2) DEFAULT 0,
    cost DECIMAL(15,2) DEFAULT 0,
    current_stock INT DEFAULT 0,
    min_stock INT DEFAULT 0,
    max_stock INT DEFAULT 0,
    location VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (unit_id) REFERENCES units(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Table: purchase_orders
CREATE TABLE purchase_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INT,
    order_date DATE NOT NULL,
    expected_date DATE,
    total_amount DECIMAL(15,2) DEFAULT 0,
    status ENUM('pending', 'approved', 'received', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Table: purchase_order_items
CREATE TABLE purchase_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id INT,
    item_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Table: receipts
CREATE TABLE receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    purchase_order_id INT,
    receipt_date DATE NOT NULL,
    total_amount DECIMAL(15,2) DEFAULT 0,
    status ENUM('pending', 'completed') DEFAULT 'pending',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Table: receipt_items
CREATE TABLE receipt_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_id INT,
    item_id INT,
    quantity_ordered INT NOT NULL,
    quantity_received INT NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Table: stock_movements
CREATE TABLE stock_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT,
    movement_type ENUM('in', 'out', 'adjustment') NOT NULL,
    quantity INT NOT NULL,
    reference_type ENUM('purchase', 'sale', 'adjustment', 'transfer') NOT NULL,
    reference_id INT,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Table: stock_adjustments
CREATE TABLE stock_adjustments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    adjustment_number VARCHAR(50) UNIQUE NOT NULL,
    adjustment_date DATE NOT NULL,
    reason TEXT,
    total_items INT DEFAULT 0,
    status ENUM('pending', 'approved', 'completed') DEFAULT 'pending',
    created_by INT,
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Table: stock_adjustment_items
CREATE TABLE stock_adjustment_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    adjustment_id INT,
    item_id INT,
    current_stock INT NOT NULL,
    actual_stock INT NOT NULL,
    difference INT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (adjustment_id) REFERENCES stock_adjustments(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Table: eoq_calculations
CREATE TABLE eoq_calculations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT,
    annual_demand INT NOT NULL,
    ordering_cost DECIMAL(15,2) NOT NULL,
    holding_cost DECIMAL(15,2) NOT NULL,
    eoq_quantity INT NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    reorder_point INT NOT NULL,
    calculation_date DATE NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Table: jit_calculations
CREATE TABLE jit_calculations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT,
    lead_time INT NOT NULL,
    daily_demand DECIMAL(10,2) NOT NULL,
    safety_stock INT NOT NULL,
    reorder_point INT NOT NULL,
    calculation_date DATE NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Table: system_settings
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('low_stock', 'reorder', 'expired', 'system') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    item_id INT,
    user_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert default data
INSERT INTO users (username, email, password, full_name, role) VALUES
('admin', 'admin@tokoamanah.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin'),
('staff', 'staff@tokoamanah.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Staff Gudang', 'staff'),
('owner', 'owner@tokoamanah.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Owner', 'owner');

INSERT INTO categories (name, description) VALUES
('Mesin', 'Spare part untuk mesin kendaraan'),
('Kelistrikan', 'Komponen kelistrikan kendaraan'),
('Rem', 'Komponen sistem rem'),
('Suspensi', 'Komponen sistem suspensi'),
('Oli & Pelumas', 'Oli dan pelumas kendaraan');

INSERT INTO units (name, symbol, description) VALUES
('Piece', 'pcs', 'Satuan buah/unit'),
('Liter', 'L', 'Satuan volume liter'),
('Kilogram', 'kg', 'Satuan berat kilogram'),
('Meter', 'm', 'Satuan panjang meter'),
('Set', 'set', 'Satuan set/paket');

INSERT INTO suppliers (name, contact_person, phone, email, address, city) VALUES
('PT. Astra Otoparts', 'Budi Santoso', '021-1234567', 'budi@astra.com', 'Jl. Gaya Motor Raya No. 8', 'Jakarta'),
('CV. Perdana Motor', 'Sari Dewi', '021-7654321', 'sari@perdana.com', 'Jl. Industri No. 15', 'Bekasi'),
('Toko Berkah Jaya', 'Ahmad Rizki', '021-5555555', 'ahmad@berkah.com', 'Jl. Pasar Spare Part No. 23', 'Tangerang');

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('company_name', 'Toko Amanah Sparepart', 'Nama perusahaan'),
('company_address', 'Jl. Raya Sparepart No. 123, Jakarta', 'Alamat perusahaan'),
('company_phone', '021-1234567', 'Nomor telepon perusahaan'),
('eoq_ordering_cost', '50000', 'Biaya pemesanan default untuk EOQ'),
('eoq_holding_cost', '10000', 'Biaya penyimpanan default untuk EOQ'),
('low_stock_notification', 'true', 'Aktifkan notifikasi stok rendah'),
('backup_schedule', 'daily', 'Jadwal backup database');

-- Insert sample items
INSERT INTO items (code, name, description, category_id, unit_id, supplier_id, price, cost, current_stock, min_stock, max_stock, location) VALUES
('SPR001', 'Busi NGK BPR6ES', 'Busi motor untuk mesin 150cc', 1, 1, 1, 25000, 20000, 50, 10, 100, 'Rak A1'),
('SPR002', 'Oli Mesin SAE 10W-40', 'Oli mesin kendaraan 1 liter', 5, 2, 2, 45000, 35000, 25, 5, 50, 'Rak B1'),
('SPR003', 'Kampas Rem Depan', 'Kampas rem depan motor bebek', 3, 5, 1, 75000, 60000, 15, 3, 30, 'Rak C1'),
('SPR004', 'Aki Motor 12V 7Ah', 'Aki kering untuk motor', 2, 1, 3, 180000, 150000, 8, 2, 20, 'Rak D1'),
('SPR005', 'Shockbreaker Belakang', 'Shock absorber belakang motor', 4, 1, 2, 350000, 280000, 12, 3, 25, 'Rak E1');

-- Create indexes for better performance
CREATE INDEX idx_items_code ON items(code);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_supplier ON items(supplier_id);
CREATE INDEX idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX idx_purchase_orders_date ON purchase_orders(order_date);
CREATE INDEX idx_receipts_date ON receipts(receipt_date);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Create views for reporting
CREATE VIEW stock_status AS
SELECT 
    i.id,
    i.code,
    i.name,
    i.current_stock,
    i.min_stock,
    i.max_stock,
    c.name as category_name,
    u.symbol as unit_symbol,
    s.name as supplier_name,
    CASE 
        WHEN i.current_stock <= i.min_stock THEN 'Low Stock'
        WHEN i.current_stock >= i.max_stock THEN 'Overstock'
        ELSE 'Normal'
    END as stock_status
FROM items i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN units u ON i.unit_id = u.id
LEFT JOIN suppliers s ON i.supplier_id = s.id
WHERE i.status = 'active';

CREATE VIEW monthly_stock_movement AS
SELECT 
    DATE_FORMAT(sm.created_at, '%Y-%m') as month,
    i.name as item_name,
    sm.movement_type,
    SUM(sm.quantity) as total_quantity
FROM stock_movements sm
JOIN items i ON sm.item_id = i.id
GROUP BY DATE_FORMAT(sm.created_at, '%Y-%m'), i.id, sm.movement_type;