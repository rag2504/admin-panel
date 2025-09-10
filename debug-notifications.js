const fetch = require('node-fetch');

async function testNotificationSystem() {
  const baseURL = 'http://localhost:3001';
  
  console.log('🔧 Testing Notification System...\n');
  
  try {
    // First, try to get users
    console.log('1. Testing user fetch...');
    const usersRes = await fetch(`${baseURL}/api/admin/users?limit=5`, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token' // This might fail but let's see
      }
    });
    console.log('Users response status:', usersRes.status);
    
    // Test notification creation
    console.log('\n2. Testing notification creation...');
    const testNotification = {
      title: 'Test Notification 🚀',
      message: 'This is a test notification from the debug script!',
      type: 'general',
      recipients: 'all',
      priority: 'medium'
    };
    
    const notifRes = await fetch(`${baseURL}/api/test-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: '507f1f77bcf86cd799439011' }) // Test user ID
    });
    
    const notifResult = await notifRes.json();
    console.log('Notification creation response:', notifResult);
    
    // Test user notification fetch
    console.log('\n3. Testing user notification fetch...');
    const userNotifRes = await fetch(`${baseURL}/api/notifications/507f1f77bcf86cd799439011`);
    const userNotifResult = await userNotifRes.json();
    console.log('User notifications response:', userNotifResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testNotificationSystem();
}
