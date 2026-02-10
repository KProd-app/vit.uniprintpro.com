
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
    <div className="min-h-screen bg-mimaki-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-mimaki-blue/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl animate-in fade-in zoom-in duration-500 rounded-[3rem]">
        <CardHeader className="space-y-6 text-center pt-12 pb-2">
          <div className="w-24 h-24 bg-mimaki-blue rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-mimaki-blue/30 transform -rotate-6 hover:rotate-0 transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 21a10.003 10.003 0 0010-10V7a2 2 0 00-2-2h-2V4.414a2 2 0 00-.586-1.414L15.414 1a2 2 0 00-1.414-.586H12a2 2 0 00-2 2V3m0 0a2 2 0 00-2 2H6a2 2 0 00-2 2v4a10.003 10.003 0 002 6.09" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mt-4">UniPrintPro</h1>
            <p className="text-mimaki-blue font-bold uppercase text-[10px] tracking-[0.3em] mt-2">VIT Gamybos Stotis</p>
          </div>
        </CardHeader>

        <CardContent className="p-10 pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="fullName" className="text-slate-400 uppercase tracking-widest text-[10px] font-black pl-4">
                Identifikacija
              </Label>
              <Input
                id="fullName"
                type="text"
                autoFocus
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Vardas Pavardė"
                className="h-16 bg-white/5 border-white/10 text-xl text-white placeholder:text-slate-500 focus:border-mimaki-blue/50 rounded-3xl"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-16 bg-mimaki-blue hover:bg-blue-600 text-white font-black uppercase tracking-widest text-lg rounded-3xl shadow-xl shadow-mimaki-blue/20"
            >
              Prisijungti
              <ArrowRight className="ml-3 w-5 h-5" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="absolute bottom-6 text-slate-800/40 text-[10px] font-bold uppercase tracking-widest">
        Mimaki Engineering Co. Style
      </p>
    </div>
  );
};
