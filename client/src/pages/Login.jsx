import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/services';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Store, ShieldCheck, KeyRound } from 'lucide-react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    async function initCheck() {
      try {
        const res = await authApi.getStatus();
        if (res.data.isFirstRun) {
          setIsFirstRun(true);
        }
      } catch (err) {
        console.error(err);
      }
    }
    initCheck();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Master password is required');
      return;
    }

    try {
      setLoading(true);
      if (isFirstRun) {
        await authApi.setup(password);
      } else {
        await login(password);
      }
      await checkAuth();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid admin password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 rounded-2xl bg-emerald-600 text-white shadow-md">
            <Store className="w-8 h-8 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">FoamWalay</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Al Harmain Foam Center — Inventory & Sales Management</p>
          </div>
        </div>

        {/* First Run Banner */}
        {isFirstRun && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Welcome! Create your single-admin master access password below.</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={isFirstRun ? "Create Master Password" : "Admin Master Password"}
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={KeyRound}
            className="w-full py-3"
          >
            {isFirstRun ? 'Set Password & Launch' : 'Authenticate Access'}
          </Button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-400 font-medium">
            Local Desktop Software &bull; Al Harmain Foam Center
          </p>
        </div>
      </div>
    </div>
  );
}
