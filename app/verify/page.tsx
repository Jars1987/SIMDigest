'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const response = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(data.message);
          setEmail(data.email);
        } else {
          setStatus('error');
          setMessage(data.message);
        }
      } catch (error) {
        setStatus('error');
        setMessage('Verification failed. Please try again.');
      }
    }

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4 py-8 sm:p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-solana-purple/20 via-solana-dark to-solana-green/20"></div>
      <div className="relative w-full max-w-sm sm:max-w-md bg-white/10 backdrop-blur-sm border border-solana-purple/30 rounded-lg p-6 sm:p-8 text-center mx-4 sm:mx-0">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">
          {status === 'loading' && <span className="text-white">Verifying...</span>}
          {status === 'success' && <span className="bg-gradient-solana bg-clip-text text-transparent">Email Verified!</span>}
          {status === 'error' && <span className="text-red-400">Verification Failed</span>}
        </h1>

        {status === 'loading' && (
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solana-purple"></div>
          </div>
        )}

        {status === 'success' && (
          <div className="mb-4">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-solana-green mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {email && (
              <p className="text-gray-300 mb-2">
                <strong className="text-white">{email}</strong> has been verified.
              </p>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}

        <p className="text-gray-300 mb-6">{message}</p>

        <Link
          href="/"
          className="inline-block bg-gradient-solana text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-solana-purple/20 via-solana-dark to-solana-green/20"></div>
      <div className="relative max-w-md w-full bg-white/10 backdrop-blur-sm border border-solana-purple/30 rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Verifying...</h1>
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solana-purple"></div>
        </div>
        <p className="text-gray-300">Please wait...</p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyContent />
    </Suspense>
  );
}
