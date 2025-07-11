import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

// 환경 변수에서 암호화 키 가져오기 (없으면 생성)
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  return Buffer.from(key, 'base64');
}

/**
 * 토큰을 암호화합니다
 */
export function encryptToken(token: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // IV + encrypted를 base64로 인코딩하여 반환
    const combined = iv.toString('hex') + ':' + encrypted;
    return Buffer.from(combined).toString('base64');
  } catch (error) {
    console.error('Token encryption failed:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * 암호화된 토큰을 복호화합니다
 */
export function decryptToken(encryptedToken: string): string {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedToken, 'base64').toString();
    const [ivHex, encryptedHex] = combined.split(':');

    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted token format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error);
    throw new Error('Failed to decrypt token');
  }
}

/**
 * 암호화 키 생성 (설정용)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
} 