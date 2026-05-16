/**
 * Test script for 0G DA integration
 * Tests blob submission, retrieval, and batch processing
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

async function testOGDA() {
  console.log('🧪 Testing 0G DA Integration...\n');

  try {
    // Test 1: Check DA Client status
    console.log('1️⃣ Testing DA Client status...');
    const statusResponse = await fetch('http://localhost:3000/api/og-da/status');
    const status = await statusResponse.json();
    console.log('Status:', JSON.stringify(status, null, 2));
    
    if (!status.available) {
      console.error('❌ DA Client not available. Please start DA Client node first.');
      console.log('   Run: docker run -d --env-file da-client/envfile.env --name 0g-da-client -p 51001:51001 0g-da-client combined');
      process.exit(1);
    }
    console.log('✅ DA Client is available\n');

    // Test 2: Submit single blob
    console.log('2️⃣ Testing blob submission...');
    const testData = {
      type: 'test',
      timestamp: Date.now(),
      message: 'Hello from 0G DA!',
      data: 'This is a test blob for 0G DA integration.',
    };

    const submitResponse = await fetch('http://localhost:3000/api/og-da/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: JSON.stringify(testData),
        options: {},
      }),
    });

    const submitResult = await submitResponse.json();
    console.log('Submit result:', JSON.stringify(submitResult, null, 2));
    
    if (!submitResult.success) {
      throw new Error(`Submission failed: ${submitResult.error}`);
    }
    console.log('✅ Blob submitted successfully');
    console.log(`   Request ID: ${submitResult.requestId}`);
    console.log(`   Blob Hash: ${submitResult.blobHash}\n`);

    // Test 3: Submit game history batch
    console.log('3️⃣ Testing game history batch submission...');
    const gameResults = [];
    for (let i = 0; i < 5; i++) {
      gameResults.push({
        gameId: `test_game_${i}`,
        gameType: 'ROULETTE',
        userAddress: '0x1234567890123456789012345678901234567890',
        betAmount: '1000000000000000000',
        payoutAmount: i % 2 === 0 ? '2000000000000000000' : '0',
        isWin: i % 2 === 0,
        timestamp: Date.now() + i,
      });
    }

    const batchResponse = await fetch('http://localhost:3000/api/og-da/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: JSON.stringify({
          type: 'game_history_batch',
          timestamp: Date.now(),
          games: gameResults,
          totalGames: gameResults.length,
          version: '1.0',
        }),
        options: {
          metadata: {
            batchType: 'game_history',
            gameCount: gameResults.length,
          },
        },
      }),
    });

    const batchResult = await batchResponse.json();
    console.log('Batch result:', JSON.stringify(batchResult, null, 2));
    
    if (!batchResult.success) {
      throw new Error(`Batch submission failed: ${batchResult.error}`);
    }
    console.log('✅ Game history batch submitted successfully\n');

    console.log('✅ All tests passed!');
    console.log('\n📝 Next steps:');
    console.log('   - Set up DA Client node for production');
    console.log('   - Configure NEXT_PUBLIC_0G_DA_CLIENT_URL in .env');
    console.log('   - Test blob retrieval once blobs are confirmed on-chain');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testOGDA().catch(console.error);

