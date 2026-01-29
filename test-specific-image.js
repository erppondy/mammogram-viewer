const fs = require('fs');
const path = require('path');

async function testImageRetrieval() {
  try {
    const { storageService } = require('./backend/dist/services/StorageService');
    
    // Test with one of the images from the database
    const storagePath = 'images/user-49b4ae52-a9f6-4e70-93c0-b4a62b09edd5/PRIYA/2025/12/42a6cc7b-e71b-4f3e-82a8-9d479a160ab4.dicom';
    
    console.log('Attempting to retrieve:', storagePath);
    console.log('Full path would be:', path.join('./storage', storagePath));
    console.log('File exists:', fs.existsSync(path.join('./storage', storagePath)));
    
    if (!fs.existsSync(path.join('./storage', storagePath))) {
      console.log('\n❌ FILE NOT FOUND IN STORAGE');
      console.log('This is why the DICOM viewer is failing!');
      console.log('\nChecking what files actually exist in storage...');
      
      const storageRoot = './storage/images';
      if (fs.existsSync(storageRoot)) {
        const users = fs.readdirSync(storageRoot);
        console.log('User directories:', users.slice(0, 3));
        
        if (users.length > 0) {
          const firstUser = users[0];
          const userPath = path.join(storageRoot, firstUser);
          console.log(`\nContents of ${firstUser}:`, fs.readdirSync(userPath));
        }
      }
    } else {
      const fileBuffer = await storageService.getFile(storagePath);
      console.log('✓ File retrieved successfully, size:', fileBuffer.length);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testImageRetrieval();
