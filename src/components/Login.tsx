
import React, { useState } from 'react';
import { MOCK_USERS } from '../constants';
import { User } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader } from './ui/card';
import { ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, addToast }) => {
  const [fullName, setFullName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      addToast('Prašome įvesti vardą ir pavardę', 'error');
      return;
    }

    // Case-insensitive match against mock users
    const user = MOCK_USERS.find(u => u.name.toLowerCase() === fullName.trim().toLowerCase());

    if (user) {
      addToast(`Sveiki, ${user.name}!`, 'success');
      onLogin(user);
    } else {
      addToast('Vartotojas nerastas. Bandykite dar kartą.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[grid-slate-900/50]">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in duration-500">
        <CardHeader className="space-y-6 text-center pt-10 pb-2">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5 border border-emerald-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 21a10.003 10.003 0 0010-10V7a2 2 0 00-2-2h-2V4.414a2 2 0 00-.586-1.414L15.414 1a2 2 0 00-1.414-.586H12a2 2 0 00-2 2V3m0 0a2 2 0 00-2 2H6a2 2 0 00-2 2v4a10.003 10.003 0 002 6.09" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">UniPrintPro</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">VIT Sistema</p>
          </div>
        </CardHeader>

        <CardContent className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-400 uppercase tracking-wider text-xs font-bold pl-1">
                Identifikacija
              </Label>
              <Input
                id="fullName"
                type="text"
                autoFocus
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Vardas Pavardė"
                className="h-12 bg-slate-900/50 border-slate-700 text-lg text-white placeholder:text-slate-600 focus:border-emerald-500/50"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-white text-slate-900 hover:bg-slate-200 font-black uppercase tracking-widest text-sm"
            >
              Prisijungti
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Background gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>
    </div>
  );
};
