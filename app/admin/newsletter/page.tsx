'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Newsletter {
  id: number;
  title: string;
  content: string;
  status: 'draft' | 'sent';
  created_at: string;
  sent_at: string | null;
  sent_count: number;
}

export default function AdminNewsletterPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [subscribers, setSubscribers] = useState<{ email: string; verified: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  const [showComposer, setShowComposer] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/admin/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setIsAuthenticated(true);
        await loadData();
      } else {
        localStorage.removeItem('admin_token');
        setLoading(false);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem('admin_token', token);
        setIsAuthenticated(true);
        await loadData();
      } else {
        const error = await response.json();
        setAuthError(error.error || 'Invalid credentials');
      }
    } catch (error) {
      setAuthError('Login failed');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');

      const [newslettersRes, subscribersRes] = await Promise.all([
        fetch('/api/admin/newsletters', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/subscribers', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (newslettersRes.ok && subscribersRes.ok) {
        const newslettersData = await newslettersRes.json();
        const subscribersData = await subscribersRes.json();
        setNewsletters(newslettersData);
        setSubscribers(subscribersData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title || !content) {
      alert('Please fill in title and content');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const url = editingId
        ? `/api/admin/newsletters/${editingId}`
        : '/api/admin/newsletters';

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, status: 'draft' })
      });

      if (response.ok) {
        await loadData();
        setShowComposer(false);
        setTitle('');
        setContent('');
        setEditingId(null);
      } else {
        alert('Failed to save draft');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSendNewsletter = async (newsletterId: number) => {
    if (!confirm(`Send this newsletter to ${subscribers.filter(s => s.verified).length} verified subscribers?`)) {
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/newsletters/${newsletterId}/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Newsletter sent successfully!');
        await loadData();
      } else {
        const error = await response.json();
        alert(`Failed to send newsletter: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending newsletter:', error);
      alert('Failed to send newsletter');
    } finally {
      setSending(false);
    }
  };

  const handleEdit = (newsletter: Newsletter) => {
    setEditingId(newsletter.id);
    setTitle(newsletter.title);
    setContent(newsletter.content);
    setShowComposer(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this newsletter?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/newsletters/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting newsletter:', error);
    }
  };

  const handleDownloadDigest = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/digest', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `simd-digest-7day-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download digest');
      }
    } catch (error) {
      console.error('Error downloading digest:', error);
      alert('Failed to download digest');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-solana-dark">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-solana-dark">
        <div className="max-w-md w-full p-8 bg-white/5 rounded-xl border border-white/10">
          <h1 className="text-2xl font-bold text-white mb-6">Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-solana-purple mb-3"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-solana-purple mb-4"
              required
            />
            {authError && (
              <p className="text-red-400 text-sm mb-4">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-solana rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            >
              Login
            </button>
            <p className="text-xs text-gray-400 mt-4 text-center">
              Leave email blank to use legacy password login
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-solana-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Newsletter Admin</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/app')}
              className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
            >
              Back to App
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('admin_token');
                setIsAuthenticated(false);
              }}
              className="px-4 py-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Total Subscribers</div>
            <div className="text-3xl font-bold text-white">{subscribers.length}</div>
          </div>
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Verified Subscribers</div>
            <div className="text-3xl font-bold text-solana-green">
              {subscribers.filter(s => s.verified).length}
            </div>
          </div>
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Total Newsletters</div>
            <div className="text-3xl font-bold text-solana-purple">{newsletters.length}</div>
          </div>
        </div>

        {/* Composer */}
        {showComposer ? (
          <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingId ? 'Edit Newsletter' : 'Compose Newsletter'}
            </h2>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Newsletter Title"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-solana-purple mb-4"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Newsletter Content (supports markdown)"
              rows={12}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-solana-purple mb-4 font-mono text-sm"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-6 py-3 bg-solana-purple rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={() => {
                  setShowComposer(false);
                  setTitle('');
                  setContent('');
                  setEditingId(null);
                }}
                className="px-6 py-3 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-8 flex gap-3">
            <button
              onClick={() => setShowComposer(true)}
              className="px-6 py-3 bg-gradient-solana rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            >
              + Compose New Newsletter
            </button>
            <button
              onClick={handleDownloadDigest}
              className="px-6 py-3 bg-solana-blue/20 rounded-lg text-solana-blue font-medium hover:bg-solana-blue/30 transition-colors border border-solana-blue/30"
            >
              📥 Download 7-Day Digest
            </button>
          </div>
        )}

        {/* Newsletters List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Newsletters</h2>
          {newsletters.length === 0 ? (
            <div className="p-12 bg-white/5 rounded-xl border border-white/10 text-center text-gray-400">
              No newsletters yet. Click "Compose New Newsletter" to get started.
            </div>
          ) : (
            newsletters.map((newsletter) => (
              <div key={newsletter.id} className="p-6 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{newsletter.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className={`px-2 py-1 rounded ${
                        newsletter.status === 'sent'
                          ? 'bg-solana-green/20 text-solana-green'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {newsletter.status.toUpperCase()}
                      </span>
                      <span>Created: {new Date(newsletter.created_at).toLocaleDateString()}</span>
                      {newsletter.sent_at && (
                        <span>Sent: {new Date(newsletter.sent_at).toLocaleDateString()}</span>
                      )}
                      {newsletter.sent_count > 0 && (
                        <span>Recipients: {newsletter.sent_count}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {newsletter.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleEdit(newsletter)}
                          className="px-4 py-2 bg-solana-blue/20 text-solana-blue rounded-lg hover:bg-solana-blue/30 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleSendNewsletter(newsletter.id)}
                          disabled={sending}
                          className="px-4 py-2 bg-solana-green/20 text-solana-green rounded-lg hover:bg-solana-green/30 transition-colors disabled:opacity-50"
                        >
                          {sending ? 'Sending...' : 'Send'}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(newsletter.id)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-300 text-sm whitespace-pre-wrap line-clamp-3">
                  {newsletter.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
