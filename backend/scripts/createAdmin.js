const readline = require('readline');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

// RFC-compliant email validation regex matching User model
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

/**
 * Validates administrative password strength according to security standards.
 * Requires: >= 12 chars, at least one uppercase, lowercase, digit, and special symbol.
 *
 * @param {string} password
 * @returns {{ valid: boolean, message?: string }}
 */
function validateAdminPassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required and cannot be empty.' };
  }
  if (password.length < 12) {
    return { valid: false, message: 'Admin password must be at least 12 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Admin password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Admin password must contain at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Admin password must contain at least one numeric digit (0-9).' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, message: 'Admin password must contain at least one special character (e.g. !@#$%^&*).' };
  }
  return { valid: true };
}

/**
 * Interactive prompt helper for visible input (name, email).
 */
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

/**
 * Interactive prompt helper for masked password input (*).
 * Never echoes plaintext password characters to the terminal.
 */
function askHidden(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const stdin = process.stdin;
    process.stdout.write(query);

    let password = '';

    if (stdin.isTTY) {
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');

      const onData = (char) => {
        if (char === '\n' || char === '\r' || char === '\u0004') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          rl.close();
          resolve(password);
        } else if (char === '\u0003') {
          // Handle Ctrl+C abort cleanly
          stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write('\n[Setup Aborted by User]\n');
          process.exit(1);
        } else if (char === '\b' || char === '\x7f') {
          // Handle backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else {
          password += char;
          process.stdout.write('*');
        }
      };

      stdin.on('data', onData);
    } else {
      // Fallback for non-interactive / piped environments
      rl.question('', (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    }
  });
}

/**
 * Business logic to provision the initial administrator.
 * Independent of CLI I/O to facilitate comprehensive automated testing.
 *
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.confirmPassword
 * @returns {Promise<{ success: boolean, message: string, admin?: Object, code?: string }>}
 */
async function provisionAdmin({ name, email, password, confirmPassword }) {
  const candidateName = (name || '').trim();
  const candidateEmail = (email || '').trim().toLowerCase();

  // 1. Basic field presence validation
  if (!candidateName || candidateName.length < 2) {
    return {
      success: false,
      code: 'INVALID_NAME',
      message: 'Admin full name is required and must be at least 2 characters long.'
    };
  }

  if (!candidateEmail || !EMAIL_REGEX.test(candidateEmail)) {
    return {
      success: false,
      code: 'INVALID_EMAIL',
      message: 'A valid email address is required.'
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      code: 'PASSWORD_MISMATCH',
      message: 'Passwords do not match. Please verify your entries.'
    };
  }

  // 2. Strong password policy verification
  const policyCheck = validateAdminPassword(password);
  if (!policyCheck.valid) {
    return {
      success: false,
      code: 'WEAK_PASSWORD',
      message: policyCheck.message
    };
  }

  // 3. Safety Check: Verify if an administrator already exists in the system
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    return {
      success: false,
      code: 'ADMIN_ALREADY_EXISTS',
      message:
        'SETUP REFUSED: An administrator account already exists. Initial setup can only be run once. For password recovery, refer to the verified administrative procedures.'
    };
  }

  // 4. Safety Check: Prevent silent promotion of an existing ordinary user
  const existingUser = await User.findOne({ email: candidateEmail });
  if (existingUser) {
    return {
      success: false,
      code: 'EMAIL_ALREADY_EXISTS',
      message: `SETUP REFUSED: An account with email "${candidateEmail}" already exists with role '${existingUser.role}'. To preserve audit integrity, ordinary user accounts will not be silently promoted to administrator.`
    };
  }

  // 5. Hash password with bcrypt before saving (10 salt rounds)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // 6. Create administrator record with explicit role: 'admin'
  const newAdmin = await User.create({
    name: candidateName,
    email: candidateEmail,
    passwordHash,
    role: 'admin',
    accountStatus: 'Active',
    isVerified: true
  });

  return {
    success: true,
    message: 'Initial administrator account provisioned successfully.',
    admin: {
      id: newAdmin._id || newAdmin.id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      accountStatus: newAdmin.accountStatus
    }
  };
}

/**
 * Main CLI execution entry point.
 */
async function runCLI() {
  console.log('============================================================');
  console.log('     VELOOP REWARDS — INITIAL ADMINISTRATOR PROVISIONING    ');
  console.log('============================================================\n');
  console.log('NOTICE: This CLI script establishes the first trusted system');
  console.log('administrator. It can only be executed once.\n');

  try {
    await connectDB();

    const name = await askQuestion('Enter Administrator Full Name: ');
    const email = await askQuestion('Enter Administrator Email Address: ');
    const password = await askHidden('Enter Administrator Password (hidden): ');
    const confirmPassword = await askHidden('Confirm Administrator Password (hidden): ');

    console.log('\nValidating and provisioning administrator...');
    const result = await provisionAdmin({ name, email, password, confirmPassword });

    if (!result.success) {
      console.error('\n❌ ' + result.message);
      process.exitCode = 1;
    } else {
      console.log('\n✅ ' + result.message);
      console.log('------------------------------------------------------------');
      console.log(`ID:             ${result.admin.id}`);
      console.log(`Name:           ${result.admin.name}`);
      console.log(`Email:          ${result.admin.email}`);
      console.log(`Role:           ${result.admin.role}`);
      console.log(`Account Status: ${result.admin.accountStatus}`);
      console.log('------------------------------------------------------------');
      console.log('\nYou can now log in at http://localhost:5173/admin/login');
    }
  } catch (error) {
    console.error('\n❌ Unexpected error during provisioning:', error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
    console.log('\n[Database connection closed]');
  }
}

if (require.main === module) {
  runCLI();
}

module.exports = {
  provisionAdmin,
  validateAdminPassword
};

