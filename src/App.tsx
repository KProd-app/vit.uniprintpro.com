import React, { useState, useEffect } from 'react';
import { PrinterData, PrinterStatus, ViewType } from './types';
import { DataProvider, usePrinters } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Dashboard } from './components/Dashboard';
import { SetupProcess } from './components/SetupProcess';
import { ViewSummary } from './components/ViewSummary';
import { AdminView } from './components/AdminView';
import { EndShiftProcess } from './components/EndShiftProcess';
import { Login } from './components/Login';
import { Toast } from './components/Toast';
import { ChecklistModal } from './components/ChecklistModal';
import { ChecklistTemplate } from './types';

// Inner component to use Auth and Data contexts
const AppContent: React.FC = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { printers, updatePrinter: contextUpdatePrinter, resetPrinter: contextResetPrinter, isSyncing, checklistTemplates, saveShiftLog } = usePrinters();

  const [view, setView] = useState<ViewType>('DASHBOARD');
  const [activePrinterId, setActivePrinterId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number, message: string, type: 'success' | 'error' | 'info' }[]>([]);

  // Automatically handle view switching based on auth
  const currentView = !user ? 'LOGIN' : view;

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const handleLogout = async () => {
    await signOut();
    addToast('Atsijungta sėkmingai', 'info');
  };

  const handleReset = async (id: string) => {
    const printer = printers.find(p => p.id === id);
    if (printer && confirm(`Ar tikrai norite resetuoti ${printer.name}?`)) {
      await contextResetPrinter(id);
      addToast(`Statusas resetuotas: ${printer.name}`, 'info');
    }
  };

  const handleStartSetup = async (id: string) => {
    const p = printers.find(x => x.id === id);
    if (p?.status === PrinterStatus.READY_TO_WORK) {
      // Direct start work logic
      await contextUpdatePrinter(id, {
        status: PrinterStatus.WORKING,
        workStartedAt: new Date().toLocaleString('lt-LT'),
      });
      addToast("Darbas pradėtas!", "success");
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
    if (activePrinterId && user) {
      const printer = printers.find(p => p.id === activePrinterId);
      if (printer) {
        // 1. Save Log
        try {
          await saveShiftLog({
            printerId: printer.id,
            printerName: printer.name,
            shift: printer.vit.shift,
            operatorName: printer.operatorName || user.name,
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            startedAt: printer.workStartedAt || new Date().toISOString(),
            finishedAt: new Date().toLocaleString('lt-LT'),
            productionAmount: production,
            defectsAmount: defects,
            vitData: printer.vit,
            nozzleData: {
              url: printer.nozzleFile?.url,
              mimakiFiles: printer.mimakiNozzleFiles
            },
            nextOperatorMessage: message
          });
        } catch (e) {
          console.error("Failed to save log", e);
          addToast("Nepavyko išsaugoti istorijos žurnale", "error");
          // We likely still want to proceed to close shift?
          // Let's assume yes.
        }
      }

      await contextUpdatePrinter(activePrinterId, {
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
        vit: { shift: '' as any, checklist: {}, notes: '', signature: '', confirmed: false } as any,
        selectedMimakiUnits: [],
        mimakiNozzleFiles: {}
      });
      setView('DASHBOARD');
      setActivePrinterId(null);
      addToast(`Pamaina baigta! Pagaminta: ${production}, Brokas: ${defects}`, 'success');
    }
  };

  const handleSetupComplete = async () => {
    if (activePrinterId && user) {
      try {
        await contextUpdatePrinter(activePrinterId, {
          status: PrinterStatus.WORKING, // Auto-start work
          workStartedAt: new Date().toLocaleString('lt-LT'),
          operatorName: user.name
        });
        setView('DASHBOARD');
        setActivePrinterId(null);
        addToast("Sėkmingai pradėta gamyba!", "success");
      } catch (error) {
        console.error(error);
        addToast("Klaida išsaugant būseną! Patikrinkite ryšį.", "error");
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

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

      {currentView === 'LOGIN' && <Login addToast={addToast} />}

      {currentView === 'DASHBOARD' && user && (
        <Dashboard
          printers={printers}
          onStart={handleStartSetup}
          onFinishWork={handleOpenEndShift}
          onView={(id) => { setActivePrinterId(id); setView('SUMMARY'); }}
          onReset={handleReset}
          currentUser={user}
          onLogout={handleLogout}
          onGoToAdmin={() => setView('ADMIN')}
        />
      )}

      {currentView === 'ADMIN' && <AdminView printers={printers} onBack={() => setView('DASHBOARD')} addToast={addToast} />}

      {currentView === 'SETUP' && activePrinter && user && (
        <SetupProcess
          printer={activePrinter}
          currentUser={user}
          checklistTemplates={checklistTemplates}
          onSave={(data) => contextUpdatePrinter(activePrinter.id, data)}
          onFinish={handleSetupComplete}
          onCancel={() => { setView('DASHBOARD'); setActivePrinterId(null); }}
          addToast={addToast}
          uploadFile={usePrinters().uploadFile}
        />
      )}

      {currentView === 'END_SHIFT' && activePrinter && user && (
        <EndShiftProcess
          printer={activePrinter}
          currentUser={user}
          onFinish={handleCompleteEndShift}
          onCancel={() => { setView('DASHBOARD'); setActivePrinterId(null); }}
          addToast={addToast}
        />
      )}

      {currentView === 'SUMMARY' && activePrinter && (
        <ViewSummary
          printer={activePrinter}
          checklistTemplates={checklistTemplates}
          onBack={() => { setView('DASHBOARD'); setActivePrinterId(null); }}
        />
      )}

      <div className="fixed bottom-0 right-0 p-6 flex flex-col space-y-4 z-[110]">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  )
}

export default App;
