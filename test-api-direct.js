#!/usr/bin/env node

/**
 * Direct API test to check what the backend returns
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function testAPI() {
  const token = process.argv[2];
  
  if (!token) {
    console.log('Usage: node test-api-direct.js <token>');
    console.log('\nTo get your token:');
    console.log('1. Login to the app');
    console.log('2. Open DevTools (F12) > Application > Local Storage');
    console.log('3. Copy the "token" value');
    process.exit(1);
  }

  try {
    console.log('🔍 Testing /api/images/by-patient endpoint\n');
    
    const response = await axios.get(`${API_URL}/images/by-patient`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ API Response received\n');
    console.log('Patients:', response.data.patients?.length || 0);
    
    let totalImages = 0;
    response.data.patients?.forEach((patient, idx) => {
      console.log(`\n${idx + 1}. Patient: ${patient.folder}`);
      console.log(`   Images: ${patient.imageCount}`);
      totalImages += patient.imageCount;
      
      patient.images.forEach((img, imgIdx) => {
        console.log(`   ${imgIdx + 1}. ${img.originalFilename}`);
        console.log(`      user_id: ${img.userId}`);
        console.log(`      uploader: ${img.uploaderEmail || img.uploaderName || 'N/A'}`);
      });
    });
    
    console.log(`\n📊 Total images: ${totalImages}`);
    
    // Also test the debug endpoint
    console.log('\n\n🔍 Testing /api/images/debug-license endpoint\n');
    const debugResponse = await axios.get(`${API_URL}/images/debug-license`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Current User:', debugResponse.data.currentUser);
    console.log('\nSummary:', debugResponse.data.summary);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAPI();
