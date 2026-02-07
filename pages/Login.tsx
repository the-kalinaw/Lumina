import React, { useEffect, useState } from 'react';
import { loginUser, registerUser, resendConfirmation } from '../services/storageService';
import { Sparkles, ArrowRight, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (isNew && !username.trim())) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');

    try {
      if (isNew) {
        const result = await registerUser(email, username, password);
        if (result.success) {
          if (result.needsConfirmation) {
            setInfo(`A confirmation email has been sent to ${email}. Please check your inbox.`);
            // allow user to resend confirmation
            setShowResend(true);
            // do not auto-login until confirmed
            setIsNew(false);
            setPassword('');
          } else {
            onLogin(username || email);
          }
        } else {
          setError(result.message || 'Registration failed');
        }
      } else {
        const result = await loginUser(email, password);
        if (result.success) {
          onLogin(email);
        } else {
          setError(result.message || 'Login failed');
        }
      }
    } catch (e) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-pastel-purple/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-pastel-blue/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-dark-card p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-8 animate-in zoom-in duration-500 relative z-10">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
             <span className="w-12 h-12 rounded-full bg-pastel-purple shadow-[0_0_30px_rgba(207,186,240,0.6)] flex items-center justify-center animate-pulse-slow">
                <Sparkles className="text-black" size={24} />
             </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Lumina</h1>
          <p className="text-gray-500 font-light italic">Your personal time sanctuary.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Email field - always shown */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">Email</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@domain.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:bg-white/10 focus:ring-1 focus:ring-pastel-purple outline-none transition-all placeholder-gray-600"
                />
              </div>
            </div>

            {/* Username field - only shown when creating a new account */}
            {isNew && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">Display Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    placeholder="What should we call you?"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:bg-white/10 focus:ring-1 focus:ring-pastel-purple outline-none transition-all placeholder-gray-600"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-4">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white focus:bg-white/10 focus:ring-1 focus:ring-pastel-purple outline-none transition-all placeholder-gray-600"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-xs text-center">
              {error}
            </div>
          )}

          {info && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-300 px-4 py-3 rounded-xl text-xs text-center space-y-2">
              <div>{info}</div>
              {showResend && (
                <div className="flex items-center justify-center gap-2">
                  <ResendButtonWrapper email={email} cooldown={resendCooldown} onResendStart={() => setResendCooldown(120)} setInfo={setInfo} setError={setError} setShowResend={setShowResend} />
                </div>
              )}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-pastel-purple transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isNew ? 'Create Secure Account' : 'Enter Sanctuary'}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-white/5">
          <button 
            onClick={() => { setIsNew(!isNew); setError(''); setPassword(''); setEmail(''); setUsername(''); }}
            className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-widest font-bold px-4 py-2 rounded-lg hover:bg-white/5"
          >
            {isNew ? 'Already have an account? Log In' : 'New here? Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Resend cooldown timer handler
const useResendTimer = (initial: number, setCooldown: React.Dispatch<React.SetStateAction<number>>) => {
  useEffect(() => {
    if (initial <= 0) return;
    setCooldown(initial);
    const iv = setInterval(() => {
      setCooldown(prev => {
        if ((prev as number) <= 1) {
          clearInterval(iv);
          return 0;
        }
        return (prev as number) - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [initial, setCooldown]);
};

// Inline wrapper to wire cooldown into the page
const ResendButtonWrapper: React.FC<{email: string, cooldown: number, onResendStart: () => void, setInfo: (s: string) => void, setError: (s: string) => void, setShowResend: (v: boolean) => void}> = ({ email, cooldown, onResendStart, setInfo, setError, setShowResend }) => {
  const [activeCooldown, setActiveCooldown] = React.useState(cooldown);

  useEffect(() => {
    setActiveCooldown(cooldown);
  }, [cooldown]);

  useResendTimer(activeCooldown, setActiveCooldown);

  return (
    <div>
      <button
        onClick={async () => {
          setError(''); setInfo('');
          const result = await resendConfirmation(email);
          if (result.success) {
            setInfo(`A confirmation email has been sent to ${email}.`);
            onResendStart();
            setActiveCooldown(120);
          } else {
            setError(result.message || 'Failed to resend confirmation');
            if (result.message && result.message.toLowerCase().includes('already')) setShowResend(false);
          }
        }}
        disabled={activeCooldown > 0}
        className="text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {activeCooldown > 0 ? `Resend (${activeCooldown}s)` : 'Resend confirmation'}
      </button>
    </div>
  );
};

export default Login;