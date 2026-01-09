import { NextResponse } from 'next/server';
import { generateAdminToken } from '@/lib/auth';
import { loginRateLimiter, getClientIdentifier } from '@/lib/rate-limiter';
import { sql } from '@/scripts/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    // Rate limiting - prevent brute force attacks
    const clientId = getClientIdentifier(request);
    const rateLimit = loginRateLimiter.check(clientId);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many login attempts. Please try again later.',
          retryAfter: rateLimit.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter)
          }
        }
      );
    }

    const { email, password } = await request.json();

    // Try email/password authentication first (preferred method)
    if (email) {
      try {
        const admins = await sql`
          SELECT id, email, password_hash, name, is_active
          FROM admins
          WHERE email = ${email.toLowerCase().trim()}
        `;

        if (admins.length === 0) {
          return NextResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
          );
        }

        const admin = admins[0];

        if (!admin.is_active) {
          return NextResponse.json(
            { error: 'Account is inactive. Contact administrator.' },
            { status: 401 }
          );
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, admin.password_hash);

        if (!passwordMatch) {
          return NextResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
          );
        }

        // Update last login
        await sql`
          UPDATE admins
          SET last_login_at = NOW()
          WHERE id = ${admin.id}
        `;

        // Generate JWT token with 24-hour expiration
        const token = generateAdminToken();

        // Reset rate limit on successful login
        loginRateLimiter.reset(clientId);

        return NextResponse.json({
          token,
          admin: {
            email: admin.email,
            name: admin.name
          }
        });

      } catch (dbError) {
        console.error('Database authentication error:', dbError);
        // Fall through to ADMIN_SECRET authentication
      }
    }

    // Fallback: Check password against ADMIN_SECRET environment variable
    // This provides backward compatibility and emergency access
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) {
      return NextResponse.json(
        { error: 'Admin authentication not configured' },
        { status: 500 }
      );
    }

    if (password !== adminSecret) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token with 24-hour expiration
    const token = generateAdminToken();

    // Reset rate limit on successful login
    loginRateLimiter.reset(clientId);

    return NextResponse.json({ token });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
