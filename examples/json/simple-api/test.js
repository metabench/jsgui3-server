// Test file for the simple JSON API example
// Runs the server and tests all endpoints

const { spawn } = require('child_process');
const http = require('http');

async function testSimpleAPI() {
  console.log('🧪 Testing Simple JSON API Example');
  console.log('=====================================\n');

  let serverProcess;

  try {
    // Start the server
    console.log('🚀 Starting server...');
    serverProcess = spawn('node', ['server.js'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Wait for server to start
    await new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);

      serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log('Server output:', data.toString().trim());
        // Look for server started message indicating server is listening
        if (output.includes('🚀 Simple JSON API Server started!')) {
          clearTimeout(timeout);
          console.log('✅ Server started successfully and is listening');
          // Wait a moment for server to be fully ready
          setTimeout(() => {
            console.log('⏳ Waiting for server to be ready...');
            setTimeout(resolve, 0); // Brief additional wait
          }, 0);
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      serverProcess.on('error', reject);
    });

    const baseUrl = 'http://localhost:3002';

    // Test 1: GET /api/status
    console.log('\n📋 Test 1: GET /api/status');
    let statusResponse;
    try {
      statusResponse = await makeRequest('GET', '/api/status');
      console.log('Response:', JSON.stringify(statusResponse, null, 2));
    } catch (error) {
      console.error('Request failed:', error.message);
      console.error('Full error:', error);
      throw error;
    }

    if (!statusResponse.status || statusResponse.status !== 'running') {
      throw new Error('Status endpoint failed - expected status: "running"');
    }
    console.log('✅ Status test passed - server is running');

    // Test 2: GET /api/messages
    console.log('\n📋 Test 2: GET /api/messages');
    const messagesResponse = await makeRequest('GET', '/api/messages');
    console.log('Response:', JSON.stringify(messagesResponse, null, 2));

    if (!messagesResponse.messages || !Array.isArray(messagesResponse.messages)) {
      throw new Error('Messages endpoint failed - expected messages array');
    }
    console.log(`✅ Messages test passed - found ${messagesResponse.messages.length} initial messages`);

    // Test 3: POST /api/add-message
    console.log('\n📋 Test 3: POST /api/add-message');
    const addMessageData = {
      text: 'Test message from automated test',
      author: 'Test Suite'
    };
    const addResponse = await makeRequest('POST', '/api/add-message', addMessageData);
    console.log('Response:', JSON.stringify(addResponse, null, 2));

    if (!addResponse.success || !addResponse.message) {
      throw new Error('Add message endpoint failed - expected success response with message');
    }
    console.log('✅ Add message test passed - message added successfully');

    // Test 4: Verify message was added
    console.log('\n📋 Test 4: Verify message was added');
    const messagesAfterAdd = await makeRequest('GET', '/api/messages');
    const hasNewMessage = messagesAfterAdd.messages.some(msg =>
      msg.text === 'Test message from automated test'
    );

    if (!hasNewMessage) {
      throw new Error('Message was not added correctly - test message not found in messages list');
    }
    console.log('✅ Message verification test passed - test message found in list');

    // Test 5: POST /api/clear-messages
    console.log('\n📋 Test 5: POST /api/clear-messages');
    const clearResponse = await makeRequest('POST', '/api/clear-messages');
    console.log('Response:', JSON.stringify(clearResponse, null, 2));

    if (!clearResponse.success) {
      throw new Error('Clear messages endpoint failed - expected success response');
    }
    console.log('✅ Clear messages test passed - messages cleared successfully');

    // Test 6: Verify messages were cleared
    console.log('\n📋 Test 6: Verify messages were cleared');
    const messagesAfterClear = await makeRequest('GET', '/api/messages');

    if (messagesAfterClear.count !== 0) {
      throw new Error('Messages were not cleared correctly - expected count to be 0');
    }
    console.log('✅ Message clearing verification test passed - all messages cleared');

    // Test 7: Error handling
    console.log('\n📋 Test 7: Error handling test');
    try {
      const errorResponse = await makeRequest('POST', '/api/add-message', { text: '' });
      console.log('Error response:', JSON.stringify(errorResponse, null, 2));
      if (!errorResponse.error || !errorResponse.error.includes('Message text is required')) {
        throw new Error('Error handling test failed - expected error response with "Message text is required"');
      }
      console.log('✅ Error handling test passed - validation working correctly');
    } catch (error) {
      throw new Error('Error handling test failed: ' + error.message);
    }

    console.log('\n🎉 All tests passed! Simple JSON API is working correctly.');
    console.log('\n📊 Test Summary:');
    console.log('  ✅ Server startup');
    console.log('  ✅ GET /api/status');
    console.log('  ✅ GET /api/messages');
    console.log('  ✅ POST /api/add-message');
    console.log('  ✅ Message persistence');
    console.log('  ✅ POST /api/clear-messages');
    console.log('  ✅ Message clearing');
    console.log('  ✅ Error handling');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    // Clean up server process
    if (serverProcess) {
      console.log('\n🧹 Shutting down server...');
      serverProcess.kill('SIGTERM');

      // Wait a bit for graceful shutdown
      setTimeout(() => {
        if (!serverProcess.killed) {
          serverProcess.kill('SIGKILL');
        }
        console.log('✅ Server shut down');
      }, 2000);
    }
  }
}

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Run the tests
if (require.main === module) {
  testSimpleAPI().catch(console.error);
}

module.exports = { testSimpleAPI };