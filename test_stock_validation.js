const fetch = require('node-fetch');

// Test script to verify stock validation works
async function testStockValidation() {
  const API_BASE = 'https://api-inventory.isavralabel.com/api/inventory-amanah';
  
  // You'll need to replace this with a valid token
  const token = 'YOUR_AUTH_TOKEN_HERE';
  
  console.log('Testing stock validation...');
  
  // Test case: Try to create an outbound movement with insufficient stock
  const testMovement = {
    item_id: 1, // Replace with a valid item ID
    movement_type: 'out',
    quantity: 999, // Large quantity that should exceed stock
    reference_type: 'adjustment',
    reference_id: null,
    notes: 'Test validation - should fail',
    created_by: 1 // Replace with valid user ID
  };
  
  try {
    const response = await fetch(`${API_BASE}/stock_movements`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMovement)
    });
    
    const result = await response.json();
    
    if (response.status === 400 && result.error === 'Maaf, stok tidak mencukupi') {
      console.log('✅ Stock validation working correctly!');
      console.log('Error message:', result.message);
      console.log('Current stock:', result.current_stock);
      console.log('Requested quantity:', result.requested_quantity);
    } else if (response.ok) {
      console.log('❌ Stock validation not working - transaction succeeded when it should have failed');
    } else {
      console.log('❓ Unexpected response:', result);
    }
  } catch (error) {
    console.error('Error testing validation:', error);
  }
}

console.log('Note: You need to update the token and item_id in this script before running');
console.log('This script is for testing purposes only - it requires valid authentication');
