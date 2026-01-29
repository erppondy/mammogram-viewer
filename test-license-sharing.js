#!/usr/bin/env node

/**
 * Test script to verify license-based image sharing
 * 
 * This script will:
 * 1. Check if users have license_id set
 * 2. Check if images have license_id set
 * 3. Verify the sharing logic
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function testLicenseSharing() {
  console.log('🔍 Testing License-Based Image Sharing\n');
  console.log('=' .repeat(60));

  // You need to provide tokens for two users with the same license
  const user1Token = process.argv[2];
  const user2Token = process.argv[3];

  if (!user1Token || !user2Token) {
    console.log('\n❌ Usage: node test-license-sharing.js <user1-token> <user2-token>');
    console.log('\nTo get tokens:');
    console.log('1. Login as User 1 and copy the token from localStorage');
    console.log('2. Login as User 2 and copy the token from localStorage');
    console.log('\nExample:');
    console.log('node test-license-sharing.js "eyJhbGc..." "eyJhbGc..."\n');
    process.exit(1);
  }

  try {
    // Test User 1
    console.log('\n📋 Testing User 1:');
    console.log('-'.repeat(60));
    const user1Debug = await axios.get(`${API_URL}/images/debug-license`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    
    console.log('User Info:', {
      id: user1Debug.data.currentUser.id,
      email: user1Debug.data.currentUser.email,
      licenseId: user1Debug.data.currentUser.license_id
    });
    console.log('\nSummary:', user1Debug.data.summary);
    console.log('\nMy Images:', user1Debug.data.myImages.length);
    user1Debug.data.myImages.forEach((img, idx) => {
      console.log(`  ${idx + 1}. ${img.original_filename} (license_id: ${img.license_id})`);
    });
    console.log('\nAll License Images:', user1Debug.data.licenseImages.length);
    user1Debug.data.licenseImages.forEach((img, idx) => {
      console.log(`  ${idx + 1}. ${img.original_filename} (user_id: ${img.user_id}, license_id: ${img.license_id})`);
    });
    console.log('\nUsers with same license:', user1Debug.data.licenseUsers.length);
    user1Debug.data.licenseUsers.forEach((u, idx) => {
      console.log(`  ${idx + 1}. ${u.email} (id: ${u.id})`);
    });

    // Test User 2
    console.log('\n\n📋 Testing User 2:');
    console.log('-'.repeat(60));
    const user2Debug = await axios.get(`${API_URL}/images/debug-license`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    
    console.log('User Info:', {
      id: user2Debug.data.currentUser.id,
      email: user2Debug.data.currentUser.email,
      licenseId: user2Debug.data.currentUser.license_id
    });
    console.log('\nSummary:', user2Debug.data.summary);
    console.log('\nMy Images:', user2Debug.data.myImages.length);
    user2Debug.data.myImages.forEach((img, idx) => {
      console.log(`  ${idx + 1}. ${img.original_filename} (license_id: ${img.license_id})`);
    });
    console.log('\nAll License Images:', user2Debug.data.licenseImages.length);
    user2Debug.data.licenseImages.forEach((img, idx) => {
      console.log(`  ${idx + 1}. ${img.original_filename} (user_id: ${img.user_id}, license_id: ${img.license_id})`);
    });
    console.log('\nUsers with same license:', user2Debug.data.licenseUsers.length);
    user2Debug.data.licenseUsers.forEach((u, idx) => {
      console.log(`  ${idx + 1}. ${u.email} (id: ${u.id})`);
    });

    // Verify sharing
    console.log('\n\n✅ Verification:');
    console.log('='.repeat(60));
    
    const sameLicense = user1Debug.data.currentUser.license_id === user2Debug.data.currentUser.license_id;
    console.log(`Same License: ${sameLicense ? '✅ YES' : '❌ NO'}`);
    
    if (sameLicense) {
      const user1CanSeeUser2Images = user1Debug.data.licenseImages.some(
        img => img.user_id === user2Debug.data.currentUser.id
      );
      const user2CanSeeUser1Images = user2Debug.data.licenseImages.some(
        img => img.user_id === user1Debug.data.currentUser.id
      );
      
      console.log(`User 1 can see User 2's images: ${user1CanSeeUser2Images ? '✅ YES' : '❌ NO'}`);
      console.log(`User 2 can see User 1's images: ${user2CanSeeUser1Images ? '✅ YES' : '❌ NO'}`);
      
      if (user1CanSeeUser2Images && user2CanSeeUser1Images) {
        console.log('\n🎉 License sharing is working correctly!');
      } else {
        console.log('\n⚠️ License sharing may not be working as expected');
      }
    } else {
      console.log('\n⚠️ Users do not share the same license');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

testLicenseSharing();
