
import React from 'react';
import { PrinterData, PrinterStatus, User, UserRole } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { StatusBadge } from './ui/badge';
import { LogOut, Settings, RotateCcw, FileText, Play, CheckCircle, Square } from 'lucide-react';

interface DashboardProps {
  printers: PrinterData[];
  onStart: (id: string) => void;
  onFinishWork: (id: string) => void;
  onView: (id: string) => void;
  onReset: (id: string) => void;
  currentUser: User;
  onLogout: () => void;
  onGoToAdmin: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  printers, onStart, onFinishWork, onView, onReset, currentUser, onLogout, onGoToAdmin
}) => {
  return (
    <div className="min-h-screen bg-mimaki-gray/50">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-mimaki-blue rounded-2xl shadow-lg shadow-mimaki-blue/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>
          <span className="font-black text-xl text-mimaki-dark tracking-tighter">UniPrintPro <span className="text-mimaki-blue">VIT</span></span>
        </div>

        <div className="flex items-center space-x-6">
          {currentUser.role === UserRole.ADMIN && (
            <Button
              variant="ghost"
              onClick={onGoToAdmin}
              className="text-slate-600 hover:text-mimaki-blue font-bold uppercase tracking-widest hidden sm:flex"
            >
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
          )}
          <div className="flex items-center space-x-3 pl-6 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-mimaki-dark leading-none">{currentUser.name}</p>
              <p className="text-xs text-slate-400 font-medium uppercase mt-1 tracking-widest">{currentUser.role}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onLogout}
              className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6 md:p-10 max-w-[1600px] mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-mimaki-dark tracking-tight uppercase">Gamybos Stotis</h1>
            <p className="text-slate-500 mt-2 text-lg font-medium">Valdykite savo įrenginio darbo ciklą</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {printers.map((printer) => (
            <Card key={printer.id} className="overflow-hidden hover:shadow-[0_20px_40px_rgba(0,91,172,0.15)] transition-all duration-300 group border-white hover:border-mimaki-blue/20 bg-white/80 backdrop-blur-sm">
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-mimaki-gray group-hover:bg-mimaki-blue transition-colors duration-300 rounded-2xl group-hover:text-white text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </div>
                  <StatusBadge status={printer.status} className="px-3 py-1 text-[10px] uppercase tracking-wider" />
                </div>
                <CardTitle className="text-2xl font-black text-mimaki-dark uppercase tracking-tighter">{printer.name}</CardTitle>
              </CardHeader>

              <CardContent className="p-8 pt-2">
                {/* Message from previous operator */}
                {printer.nextOperatorMessage ? (
                  <div className="mb-6 p-5 bg-amber-50 rounded-3xl border border-amber-100 text-sm text-amber-900 italic relative">
                    <span className="absolute -top-3 left-4 bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-1 rounded-full tracking-widest">Perdavimas</span>
                    "{printer.nextOperatorMessage}"
                  </div>
                ) : (
                  <div className="h-4 mb-6"></div> // Spacer
                )}

                <div className="space-y-4 mt-2">
                  {/* Phase-based actions */}
                  {printer.status === PrinterStatus.NOT_STARTED || printer.status === PrinterStatus.IN_PROGRESS ? (
                    <Button
                      onClick={() => onStart(printer.id)}
                      className="w-full h-16 text-lg font-black shadow-lg shadow-mimaki-blue/20 bg-mimaki-dark hover:bg-black"
                    >
                      <Play className="w-5 h-5 mr-3 text-mimaki-blue" fill="currentColor" />
                      {printer.status === PrinterStatus.IN_PROGRESS ? 'Tęsti Paruošimą' : 'Pradėti Darbą'}
                    </Button>
                  ) : null}

                  {printer.status === PrinterStatus.READY_TO_WORK ? (
                    <Button
                      onClick={() => onStart(printer.id)}
                      className="w-full h-16 text-lg bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 border-transparent"
                    >
                      <CheckCircle className="w-5 h-5 mr-3" />
                      Vykdyti Gamybą
                    </Button>
                  ) : null}

                  {printer.status === PrinterStatus.WORKING ? (
                    <Button
                      onClick={() => onFinishWork(printer.id)}
                      className="w-full h-16 text-lg bg-mimaki-blue hover:bg-blue-600 shadow-lg shadow-mimaki-blue/30 border-transparent"
                    >
                      <Square className="w-5 h-5 mr-3 fill-current" />
                      Baigti Darbą
                    </Button>
                  ) : null}
                </div>
              </CardContent>

              <CardFooter className="p-8 pt-0 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => onView(printer.id)}
                  className="flex-1 font-bold uppercase tracking-widest text-xs h-12 rounded-2xl border-slate-200 text-slate-500 hover:text-mimaki-blue hover:border-mimaki-blue/30"
                >
                  <FileText className="w-3 h-3 mr-2" />
                  Ataskaita
                </Button>

                {currentUser.role === UserRole.ADMIN && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { if (confirm('Išvalyti būseną?')) onReset(printer.id); }}
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl h-12 w-12"
                    title="Reset Status"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
