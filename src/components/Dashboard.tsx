
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
    <div className="min-h-screen bg-slate-50/50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-slate-900 rounded-xl shadow-lg shadow-slate-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>
          <span className="font-black text-xl text-slate-900 tracking-tighter">UniPrintPro <span className="text-emerald-500">VIT</span></span>
        </div>

        <div className="flex items-center space-x-6">
          {currentUser.role === UserRole.ADMIN && (
            <Button
              variant="ghost"
              onClick={onGoToAdmin}
              className="text-slate-600 hover:text-slate-900 font-bold uppercase tracking-widest hidden sm:flex"
            >
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
          )}
          <div className="flex items-center space-x-3 pl-6 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-none">{currentUser.name}</p>
              <p className="text-xs text-slate-400 font-medium uppercase mt-1 tracking-widest">{currentUser.role}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onLogout}
              className="text-red-400 hover:text-red-600 hover:bg-red-50"
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
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight uppercase">Gamybos Stotis</h1>
            <p className="text-slate-500 mt-2 text-lg">Valdykite savo įrenginio darbo ciklą</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {printers.map((printer) => (
            <Card key={printer.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-slate-200">
              <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-50 group-hover:bg-slate-900 transition-colors duration-300 rounded-xl group-hover:text-emerald-400 text-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </div>
                  <StatusBadge status={printer.status} className="px-3 py-1 text-[10px] uppercase tracking-wider" />
                </div>
                <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{printer.name}</CardTitle>
              </CardHeader>

              <CardContent className="p-6 pt-2">
                {/* Message from previous operator */}
                {printer.nextOperatorMessage ? (
                  <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100/50 text-sm text-amber-800 italic">
                    <p className="font-black text-[10px] uppercase tracking-widest mb-1 opacity-60">Perdavimas:</p>
                    "{printer.nextOperatorMessage}"
                  </div>
                ) : (
                  <div className="h-4 mb-6"></div> // Spacer to keep card height somewhat consistent
                )}

                <div className="space-y-3 mt-2">
                  {/* Phase-based actions */}
                  {printer.status === PrinterStatus.NOT_STARTED || printer.status === PrinterStatus.IN_PROGRESS ? (
                    <Button
                      onClick={() => onStart(printer.id)}
                      className="w-full py-6 text-base shadow-lg shadow-slate-900/10"
                    >
                      <Play className="w-5 h-5 mr-2 text-emerald-400" fill="currentColor" />
                      {printer.status === PrinterStatus.IN_PROGRESS ? 'Tęsti Paruošimą' : 'Pradėti Darbą'}
                    </Button>
                  ) : null}

                  {printer.status === PrinterStatus.READY_TO_WORK ? (
                    <Button
                      onClick={() => onStart(printer.id)}
                      className="w-full py-6 text-base bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 border-transparent"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Vykdyti Gamybą
                    </Button>
                  ) : null}

                  {printer.status === PrinterStatus.WORKING ? (
                    <Button
                      onClick={() => onFinishWork(printer.id)}
                      className="w-full py-6 text-base bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/20 border-transparent"
                    >
                      <Square className="w-5 h-5 mr-2 fill-current" />
                      Baigti Darbą
                    </Button>
                  ) : null}
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onView(printer.id)}
                  className="flex-1 font-bold uppercase tracking-widest text-xs"
                >
                  <FileText className="w-3 h-3 mr-2" />
                  Ataskaita
                </Button>

                {currentUser.role === UserRole.ADMIN && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { if (confirm('Išvalyti būseną?')) onReset(printer.id); }}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
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
