
import React, { useState } from 'react';
import { MOCK_USERS } from '../constants';
import { User, UserRole } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { ArrowRight, ShieldCheck, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoginProps {
  onLogin: (user: User) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, addToast }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.OPERATOR);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      addToast('Prašome įvesti vardą ir pavardę', 'error');
      return;
    }

    // Case-insensitive match against mock users
    const user = MOCK_USERS.find(u => u.name.toLowerCase() === name.trim().toLowerCase());

    if (user) {
      if (user.role !== role) {
        addToast(`Vartotojas rastas, bet rolė neatitinka. Bandykite kaip ${user.role}.`, 'info');
        return;
      }
      addToast(`Sveiki, ${user.name}!`, 'success');
      onLogin(user);
    } else {
      // For demo purposes, allow login with any name if not found in MOCK_USERS,
      // creating a temporary user session
      const newUser: User = {
        id: Date.now().toString(),
        name: name,
        role: role,
        preferences: {}
      };
      addToast(`Sveiki, ${newUser.name}! (Demo)`, 'success');
      onLogin(newUser);
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
            <Label className="uppercase text-[10px] tracking-widest text-mimaki-blue font-black pl-4 mb-2 block">Identifikacija</Label>
            <div className="relative group">
              <UserIcon className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5 group-focus-within:text-mimaki-blue transition-colors" />
              <Input
                type="text"
                placeholder="Vardas Pavardė"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-14 pr-6 h-16 w-full bg-black/40 border-white/5 text-white placeholder:text-white/20 focus:ring-mimaki-blue/50 focus:border-mimaki-blue/50 rounded-[2rem] text-lg font-bold backdrop-blur-sm transition-all shadow-inner"
                autoFocus
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-16 bg-mimaki-blue hover:bg-blue-600 text-white text-lg font-black uppercase tracking-widest shadow-[0_0_40px_-10px_rgba(0,91,172,0.5)] hover:shadow-[0_0_60px_-15px_rgba(0,91,172,0.6)] transition-all rounded-[2rem] border border-white/10"
          >
            Prisijungti <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          {/* Role selector for demo purposes */}
          <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-white/5">
            <button type="button" onClick={() => setRole(UserRole.OPERATOR)} className={cn("text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all", role === UserRole.OPERATOR ? "bg-white text-mimaki-dark" : "text-white/30 hover:text-white hover:bg-white/5")}>Operatorius</button>
            <button type="button" onClick={() => setRole(UserRole.ADMIN)} className={cn("text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all", role === UserRole.ADMIN ? "bg-white text-mimaki-dark" : "text-white/30 hover:text-white hover:bg-white/5")}>Admin</button>
          </div>
        </form>
      </Card>

      <div className="absolute bottom-6 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/10 mix-blend-overlay">Mimaki Engineering Co. Style</p>
      </div>
    </div>
  );
};
