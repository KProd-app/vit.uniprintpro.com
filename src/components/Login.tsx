import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePrinters } from '../contexts/DataContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { ArrowRight, ShieldCheck, User as UserIcon, Lock } from 'lucide-react';
import { cn, normalizeString } from '@/lib/utils';
import { User } from '../types';

interface LoginProps {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Login: React.FC<LoginProps> = ({ addToast }) => {
  const { signIn } = useAuth();
  const { getUsers } = usePrinters();
  const [nameInput, setNameInput] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);

  // Load users for lookup
  useEffect(() => {
    getUsers()
      .then(fetchedUsers => {
        setUsers(fetchedUsers);
      })
      .catch(err => console.error("Failed to load users for login", err));
  }, [getUsers]);

  // Handle name input changes
  useEffect(() => {
    const normalizedInput = nameInput.trim().toLowerCase();
    if (!normalizedInput) {
      setMatchedUser(null);
      setShowPassword(false);
      return;
    }

    // Check for match using normalized strings
    const searchNormalized = normalizeString(nameInput);
    const user = users.find(u => normalizeString(u.name) === searchNormalized);

    if (user) {
      setMatchedUser(user);
      if (user.role === 'Admin') {
        setShowPassword(true);
      } else {
        setShowPassword(false);
      }
    } else {
      setMatchedUser(null);
      setShowPassword(false);
    }
  }, [nameInput, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matchedUser) {
      addToast('Vartotojas nerastas. Patikrinkite vardą.', 'error');
      return;
    }

    if (matchedUser.role === 'Admin' && !password.trim()) {
      addToast('Administratoriui būtinas slaptažodis', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const email = matchedUser.email || `${normalizeString(matchedUser.name).replace(/\s+/g, '.')}@vit.uniprintpro.com`; // Fallback if no email
      const loginPassword = matchedUser.role === 'Admin' ? password : 'uniprint'; // Default password for workers

      await signIn(email, loginPassword);
      addToast(`Sveiki, ${matchedUser.name}!`, 'success');
    } catch (error: any) {
      console.error('Login error:', error);
      let msg = error.message;
      if (msg.includes('Invalid login credentials')) {
        if (matchedUser.role === 'Worker') {
          msg = 'Nepavyko prisijungti automatiškai. Kreipkitės į administratorių (slaptažodis turi būti "uniprint")';
        } else {
          msg = 'Neteisingas slaptažodis';
        }
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Vartotojas nepatvirtintas';
      }
      addToast(`Klaida: ${msg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mimaki-dark flex items-center justify-center p-6 relative overflow-hidden text-white">
      {/* Ambient Background with stronger opacity */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-mimaki-blue/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>

      <Card className="w-full max-w-md border-white/5 bg-white/5 backdrop-blur-3xl shadow-2xl animate-in fade-in zoom-in duration-500 rounded-[3rem] p-8">
        <div className="flex flex-col items-center mb-10">
          <div className="p-5 bg-mimaki-blue/20 rounded-[2rem] mb-6 shadow-inner ring-1 ring-white/10">
            <ShieldCheck className="w-10 h-10 text-mimaki-blue" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase text-center drop-shadow-lg">UniPrintPro</h1>
          <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold mt-2">VIT Sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="uppercase text-[10px] tracking-widest text-mimaki-blue font-black pl-4 mb-2 block">Vardas Pavardė</Label>
            <div className="relative group">
              <UserIcon className={`absolute left-6 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${matchedUser ? 'text-emerald-500' : 'text-white/40 group-focus-within:text-mimaki-blue'}`} />
              <Input
                type="text"
                placeholder="Vardas Pavardė"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className={cn(
                  "pl-14 pr-6 h-16 w-full bg-black/40 border-white/5 text-white placeholder:text-white/20 focus:ring-mimaki-blue/50 focus:border-mimaki-blue/50 rounded-[2rem] text-lg font-bold backdrop-blur-sm transition-all shadow-inner",
                  matchedUser && "border-emerald-500/50 ring-emerald-500/20"
                )}
                autoFocus
                required

              />

              {matchedUser && (
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${matchedUser.role === 'Admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {matchedUser.role}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={cn("space-y-2 transition-all duration-300 overflow-hidden", showPassword ? "max-h-32 opacity-100" : "max-h-0 opacity-0")}>
            <Label className="uppercase text-[10px] tracking-widest text-mimaki-blue font-black pl-4 mb-2 block">Slaptažodis (Admin)</Label>
            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5 group-focus-within:text-mimaki-blue transition-colors" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-14 pr-6 h-16 w-full bg-black/40 border-white/5 text-white placeholder:text-white/20 focus:ring-mimaki-blue/50 focus:border-mimaki-blue/50 rounded-[2rem] text-lg font-bold backdrop-blur-sm transition-all shadow-inner"
                required={showPassword}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !matchedUser}
            className="w-full h-16 bg-mimaki-blue hover:bg-blue-600 text-white text-lg font-black uppercase tracking-widest shadow-[0_0_40px_-10px_rgba(0,91,172,0.5)] hover:shadow-[0_0_60px_-15px_rgba(0,91,172,0.6)] transition-all rounded-[2rem] border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Jungiama...' : (matchedUser?.role === 'Admin' ? 'Prisijungti' : 'Pradėti Darbą')} <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </form>
      </Card>

      <div className="absolute bottom-6 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/10 mix-blend-overlay">Mimaki Engineering Co. Style</p>
      </div>
    </div>
  );
};
