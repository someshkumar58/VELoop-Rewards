const mongoose = require('mongoose');
const dns = require('dns');

// On Windows and certain ISP networks, default DNS can fail to resolve MongoDB SRV records (querySrv ECONNREFUSED).
// Setting reliable DNS servers ensures consistent SRV lookup.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // Graceful fallback if environment restricts DNS setting
}

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Validates environment configuration and ensures credentials are never exposed in logs.
 *
 * @returns {Promise<mongoose.Connection>}
 */
const connectDB = async () => {
  let uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    const errorMsg = 'MONGODB_URI or MONGO_URI is not defined in environment variables (.env). Cannot connect to database.';
    console.error(`[Database Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Safeguard: Strip any accidental angle brackets <...> commonly retained from MongoDB Atlas template copy-pasting
  if (uri.includes('<') || uri.includes('>')) {
    uri = uri.replace(/:\/\/([^:]+):([^@]+)@/, (match, user, pass) => {
      return '://' + user.replace(/[<>]/g, '') + ':' + pass.replace(/[<>]/g, '') + '@';
    });
  }

  try {
    const conn = await mongoose.connect(uri);

    // Safe success message: conn.connection.host and db name only, never printing URI or credentials
    console.log(`[Database] MongoDB Atlas Connected successfully: ${conn.connection.host} (Database: ${conn.connection.name})`);
    return conn.connection;
  } catch (err) {
    // Sanitize any error message to remove potential connection strings or credentials
    const sanitizedMessage = (err.message || 'Unknown database connection error')
      .replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, 'mongodb+srv://<credentials-hidden>@');

    console.error(`[Database Error] Failed to connect to MongoDB Atlas: ${sanitizedMessage}`);
    throw new Error(sanitizedMessage);
  }
};

/**
 * Gracefully disconnects from MongoDB Atlas.
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[Database] MongoDB Atlas disconnected.');
  } catch (err) {
    console.error('[Database Error] Error during disconnection:', err.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
