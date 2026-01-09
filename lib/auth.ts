import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.ADMIN_SECRET || '';

if (!JWT_SECRET) {
  console.warn('⚠️  ADMIN_SECRET not set - JWT authentication will not work');
}

interface TokenPayload {
  role: 'admin';
  iat: number;
  exp: number;
}

/**
 * Generate JWT token for admin authentication
 * Token expires in 24 hours
 */
export function generateAdminToken(): string {
  if (!JWT_SECRET) {
    throw new Error('ADMIN_SECRET not configured');
  }

  const token = jwt.sign(
    { role: 'admin' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return token;
}

/**
 * Verify JWT token
 * Returns payload if valid, null if invalid/expired
 */
export function verifyAdminToken(token: string): TokenPayload | null {
  if (!JWT_SECRET) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Verify it's an admin token
    if (decoded.role !== 'admin') {
      return null;
    }

    return decoded;
  } catch (error) {
    // Token invalid or expired
    return null;
  }
}

/**
 * Verify admin authentication from request
 * Returns true if authenticated, false otherwise
 */
export function verifyAdminAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  const payload = verifyAdminToken(token);

  return payload !== null;
}
