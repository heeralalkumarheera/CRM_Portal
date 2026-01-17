import { useState } from 'react';
import { portalAuthAPI } from '../../services/portalApi';

const PortalLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await portalAuthAPI.login({ email, password });
      localStorage.setItem('portalToken', data.data.token);
      window.location.href = '/portal';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Client Portal Login</h1>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <input className="input mb-3 w-full" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="input mb-4 w-full" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button disabled={loading} className="btn btn-primary w-full">{loading ? 'Logging in...' : 'Login'}</button>
      </form>
    </div>
  );
};

export default PortalLogin;
