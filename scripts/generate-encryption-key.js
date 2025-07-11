#!/usr/bin/env node

const crypto = require('crypto');

// 32바이트 암호화 키 생성
const encryptionKey = crypto.randomBytes(32).toString('base64');

console.log('🔐 Generated encryption key for your .env.local file:');
console.log('');
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log('');
console.log('Add this line to your .env.local file to enable token encryption.');
console.log('⚠️  Keep this key secure and never commit it to version control!'); 