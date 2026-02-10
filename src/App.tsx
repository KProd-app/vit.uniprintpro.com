
import React, { useState, useEffect } from 'react';
import { PrinterData, PrinterStatus, ViewType, User } from './types';
import { MOCK_PRINTERS } from './constants';
import { Dashboard } from './components/Dashboard';
import { SetupProcess } from './components/SetupProcess';
import { ViewSummary } from './components/ViewSummary';
import { AdminView } from './components/AdminView';
import { EndShiftProcess } from './components/EndShiftProcess';
import { Login } from './components/Login';
import { Toast } from './components/Toast';

const STORAGE_KEY = 'printer_dashboard_v3_state';
const AUTH_KEY = 'printer_dashboard_v3_auth';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('LOGIN');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [printers, setPrinters] = useState<PrinterData[]>([]);
  const [activePrinterId, setActivePrinterId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number, message: string, type: 'success' | 'error' | 'info' }[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_KEY);
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setView('DASHBOARD');
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPrinters(JSON.parse(saved));
      } catch (e) {
        setPrinters(MOCK_PRINTERS);
      }
    } else {
      setPrinters(MOCK_PRINTERS);
    }
  }, []);

  useEffect(() => {
    if (printers.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(printers));
    }
  }, [printers]);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const updatePrinter = (id: string, updates: Partial<PrinterData>) => {
    setPrinters(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_KEY);
    setView('LOGIN');
  };

  const handleReset = (id: string) => {
    const original = MOCK_PRINTERS.find(p => p.id === id);
    if (original) {
      updatePrinter(id, { 
        ...original, 
        status: PrinterStatus.NOT_STARTED,
        nextOperatorMessage: '' 
      });
      addToast(`Statusas resetuotas: ${original.name}`, 'info');
    }
  };

  const handleStartSetup = (id: string) => {
    const p = printers.find(x => x.id === id);
    if (p?.status === PrinterStatus.READY_TO_WORK) {
        setIsSyncing(true);
        setTimeout(() => {
            updatePrinter(id, { 
                status: PrinterStatus.WORKING,
                workStartedAt: new Date().toLocaleString('lt-LT'),
            });
            setIsSyncing(false);
            addToast("Darbas pradėtas!", "success");
        }, 800);
        return;
    }
    setActivePrinterId(id);
    setView('SETUP');
  };

  const handleOpenEndShift = (id: string) => {
    setActivePrinterId(id);
    setView('END_SHIFT');
  };

  const handleCompleteEndShift = async (message: string, endChecklist: { [key: string]: boolean }, production: number, defects: number) => {
    if (activePrinterId && currentUser) {
      setIsSyncing(true);
      await new Promise(r => setTimeout(r, 1200));
      updatePrinter(activePrinterId, { 
        status: PrinterStatus.NOT_STARTED,
        workFinishedAt: new Date().toLocaleString('lt-LT'),
        nextOperatorMessage: message,
        endShiftChecklist: endChecklist,
        productionAmount: production,
        defectsAmount: defects,
        // Resetting morning checks for the next morning
        maintenanceDone: false,
        nozzlePrintDone: false,
        nozzleFile: null,
        vit: { shift: '', checklist: {}, notes: '', signature: '', confirmed: false }
      });
      setIsSyncing(false);
      setView('DASHBOARD');
      setActivePrinterId(null);
      addToast(`Pamaina baigta! Pagaminta: ${production}, Brokas: ${defects}`, 'success');
    }
  };

  const handleSetupComplete = async () => {
    if (activePrinterId && currentUser) {
      setIsSyncing(true);
      await new Promise(resolve => setTimeout(resolve, 1200));
      updatePrinter(activePrinterId, { 
        status: PrinterStatus.READY_TO_WORK,
        operatorName: currentUser.name
      });
      setIsSyncing(false);
      setView('DASHBOARD');
      setActivePrinterId(null);
      addToast("Paruošimas baigtas. Galite pradėti gamybą.", "success");
    }
  };

  const activePrinter = printers.find(p => p.id === activePrinterId);

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {isSyncing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center">
          <div className="bg-white p-12 rounded-[40px] shadow-2xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-900 border-t-transparent mb-6"></div>
            <p className="font-black text-2xl text-slate-800 uppercase tracking-tighter">Sinchronizuojama...</p>
          </div>
        </div>
      )}

      {view === 'LOGIN' && <Login onLogin={handleLogin} addToast={addToast} />}

      {currentUser && view === 'DASHBOARD' && (
        <Dashboard 
          printers={printers} 
          onStart={handleStartSetup}
          onFinishWork={handleOpenEndShift}
          onView={(id) => { setActivePrinterId(id); setView('SUMMARY'); }}
          onReset={handleReset} 
          currentUser={currentUser}
          onLogout={handleLogout}
          onGoToAdmin={() => setView('ADMIN')}
        />
      )}

      {view === 'ADMIN' && <AdminView printers={printers} onBack={() => setView('DASHBOARD')} />}

      {view === 'SETUP' && activePrinter && currentUser && (
        <SetupProcess
          printer={activePrinter}
          currentUser={currentUser}
          onSave={(data) => updatePrinter(activePrinter.id, data)}
          onFinish={handleSetupComplete}
          onCancel={() => { setView('DASHBOARD'); setActivePrinterId(null); }}
          addToast={addToast}
        />
      )}

      {view === 'END_SHIFT' && activePrinter && currentUser && (
        <EndShiftProcess
          printer={activePrinter}
          currentUser={currentUser}
          onFinish={handleCompleteEndShift}
          onCancel={() => { setView('DASHBOARD'); setActivePrinterId(null); }}
          addToast={addToast}
        />
      )}

      {view === 'SUMMARY' && activePrinter && (
        <ViewSummary printer={activePrinter} onBack={() => { setView('DASHBOARD'); setActivePrinterId(null); }} />
      )}

      <div className="fixed bottom-0 right-0 p-6 flex flex-col space-y-4 z-[110]">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
        ))}
      </div>
    </div>
  );
};

export default App;
