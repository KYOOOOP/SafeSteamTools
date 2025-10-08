import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [steamId, setSteamId] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!steamId.trim()) return;

    setLoading(true);
    setError('');
    setProfileData(null);

    try {
      const response = await fetch(`/api/profile/${steamId}`);
      if (!response.ok) {
        throw new Error('Profile not found or is private');
      }
      const data = await response.json();
      setProfileData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>SafeSteamTools - Legal Steam Data Viewer</title>
        <meta name="description" content="View public Steam profile data safely and legally" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">SafeSteamTools 🛡️</h1>
            <p className="text-gray-300">Legal, malware-free Steam data viewer</p>
            <p className="text-sm text-gray-400 mt-2">Uses only official Steam Web APIs • No passwords required</p>
          </header>

          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={steamId}
                  onChange={(e) => setSteamId(e.target.value)}
                  placeholder="Enter Steam ID (e.g., 76561198000000000)"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !steamId.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Loading...' : 'View Profile'}
                </button>
              </div>
            </form>

            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {profileData && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Profile Information</h2>
                <pre className="bg-gray-900 rounded p-4 overflow-auto text-sm">
                  {JSON.stringify(profileData, null, 2)}
                </pre>
              </div>
            )}

            <div className="mt-8 text-center">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">🔒 Security Notice</h3>
                <div className="text-left space-y-2 text-sm text-gray-300">
                  <p>✅ Uses ONLY official Steam Web APIs</p>
                  <p>✅ Requires NO Steam passwords or credentials</p>
                  <p>✅ Accesses only PUBLIC profile data</p>
                  <p>❌ Does NOT unlock paid content or circumvent DRM</p>
                  <p>❌ Not affiliated with Valve Corporation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
