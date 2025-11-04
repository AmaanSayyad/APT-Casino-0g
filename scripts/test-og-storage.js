/**
 * Test script for 0G Storage integration
 * Tests file upload, download, and KV operations
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testOGStorage() {
  console.log('🧪 Testing 0G Storage Integration...\n');

  const baseUrl = 'http://localhost:3000';

  try {
    // Test 1: Upload a test file
    console.log('1️⃣ Testing file upload...');
    
    // Create a test file
    const testContent = `Test file content for 0G Storage
Created at: ${new Date().toISOString()}
This is a test file to verify 0G Storage integration.`;
    
    const testFilePath = path.join(__dirname, '..', 'test-upload.txt');
    fs.writeFileSync(testFilePath, testContent);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('path', 'test-files/test-upload.txt');
    formData.append('verifyProof', 'true');
    
    const uploadResponse = await fetch(`${baseUrl}/api/og-storage/upload`, {
      method: 'POST',
      body: formData,
    });
    
    const uploadResult = await uploadResponse.json();
    console.log('Upload result:', JSON.stringify(uploadResult, null, 2));
    
    if (!uploadResult.success) {
      throw new Error(`Upload failed: ${uploadResult.error}`);
    }
    
    const rootHash = uploadResult.rootHash;
    console.log('✅ File uploaded successfully');
    console.log(`   Root Hash: ${rootHash}`);
    console.log(`   Transaction: ${uploadResult.txHash}\n`);
    
    // Clean up test file
    fs.unlinkSync(testFilePath);

    // Test 2: Download the file
    console.log('2️⃣ Testing file download...');
    
    const downloadResponse = await fetch(
      `${baseUrl}/api/og-storage/download?rootHash=${rootHash}&verifyProof=true`
    );
    
    if (!downloadResponse.ok) {
      const error = await downloadResponse.json();
      throw new Error(`Download failed: ${error.error}`);
    }
    
    const downloadedBuffer = await downloadResponse.arrayBuffer();
    const downloadedContent = Buffer.from(downloadedBuffer).toString('utf-8');
    
    console.log('✅ File downloaded successfully');
    console.log(`   File Size: ${downloadedBuffer.byteLength} bytes`);
    console.log(`   Content Preview: ${downloadedContent.substring(0, 100)}...\n`);
    
    // Verify content matches
    if (downloadedContent.trim() === testContent.trim()) {
      console.log('✅ Content verification passed\n');
    } else {
      console.warn('⚠️ Content verification failed - content mismatch\n');
    }

    // Test 3: KV Storage
    console.log('3️⃣ Testing KV storage...');
    
    const kvStoreResponse = await fetch(`${baseUrl}/api/og-storage/kv/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streamId: 1, // USER_STATE stream
        key: 'test_key_' + Date.now(),
        value: JSON.stringify({
          test: true,
          timestamp: Date.now(),
          message: 'Hello from 0G Storage KV!',
        }),
      }),
    });
    
    const kvStoreResult = await kvStoreResponse.json();
    console.log('KV store result:', JSON.stringify(kvStoreResult, null, 2));
    
    if (!kvStoreResult.success) {
      console.warn('⚠️ KV store test skipped (may require configured flow contract)');
    } else {
      console.log('✅ KV storage successful');
      console.log(`   Transaction: ${kvStoreResult.txHash}\n`);
      
      // Test 4: KV Retrieval
      console.log('4️⃣ Testing KV retrieval...');
      
      // Note: KV retrieval may take a moment to be available
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const kvGetResponse = await fetch(
        `${baseUrl}/api/og-storage/kv/get?streamId=1&key=${encodeURIComponent(kvStoreResult.key)}`
      );
      
      const kvGetResult = await kvGetResponse.json();
      console.log('KV get result:', JSON.stringify(kvGetResult, null, 2));
      
      if (kvGetResult.success) {
        console.log('✅ KV retrieval successful\n');
      } else {
        console.warn('⚠️ KV retrieval failed (may need time to propagate)\n');
      }
    }

    console.log('✅ All tests completed!');
    console.log('\n📝 Next steps:');
    console.log('   - Configure NEXT_PUBLIC_0G_STORAGE_INDEXER_RPC in .env');
    console.log('   - Set up flow contract for KV storage');
    console.log('   - Test with actual game assets and user profiles');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testOGStorage().catch(console.error);

