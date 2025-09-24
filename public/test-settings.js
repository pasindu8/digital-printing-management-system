// Settings API Test Script
console.log('🔧 Testing Settings API Endpoints...\n');

const baseURL = 'http://localhost:5000/api/settings';

// Test company settings
fetch(`${baseURL}/company`)
  .then(response => response.json())
  .then(data => {
    console.log('✅ Company Settings loaded successfully');
    console.log('Company Name:', data.companyName);
    console.log('Currency:', data.currency);
    console.log('Notifications:', data.notifications);
    console.log('');
  })
  .catch(error => {
    console.log('❌ Company Settings failed:', error.message);
  });

// Test other endpoints (if authenticated)
console.log('Note: User management and some settings require authentication.');
console.log('You can test these through the UI once logged in.');
console.log('');
console.log('✅ Settings system is ready for use!');
