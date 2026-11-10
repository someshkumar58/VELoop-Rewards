/**
 * Standalone MongoDB Atlas Connectivity Verification Script
 * 
 * Safely tests connection to MongoDB Atlas and runs an admin ping command
 * without modifying, inserting, or deleting any database records.
 * Never prints connection strings or passwords.
 */

require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');

const verifyConnection = async () => {
  console.log('[Verification] Testing connection to MongoDB Atlas...');
  const startTime = Date.now();

  try {
    const connection = await connectDB();
    
    // Execute a read-only admin ping to test server responsiveness
    const adminDb = connection.db.admin();
    const pingResult = await adminDb.ping();
    const duration = Date.now() - startTime;

    console.log(`[Verification] Admin ping successful (${duration}ms). Response:`, pingResult);
    console.log(`[Verification] Database Name: ${connection.name}`);
    console.log(`[Verification] ReadyState: ${connection.readyState} (1 = Connected)`);

    await disconnectDB();
    console.log('[Verification] Test completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`[Verification Failed] ${error.message}`);
    process.exit(1);
  }
};

verifyConnection();

