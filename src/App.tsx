import React, { useState, useEffect } from 'react';
import { PrinterData, PrinterStatus, ViewType, Station } from './types';
import { DataProvider, usePrinters } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Dashboard } from './components/Dashboard';
import { SetupProcess } from './components/SetupProcess';
import { StationSetupProcess } from './components/StationSetupProcess';
import { ViewSummary } from './components/ViewSummary';
import { AdminView } from './components/AdminView';
import { EndShiftProcess } from './components/EndShiftProcess';
import { Login } from './components/Login';
import { Toast } from './components/Toast';
import { ChecklistModal } from './components/ChecklistModal';
import { ChecklistTemplate } from './types';
import { FeedbackModal } from './components/FeedbackModal';
import { MessageSquare } from 'lucide-react';
import { LiveDashboard } from './components/LiveDashboard';
import { MobileLiveDashboard } from './components/MobileLiveDashboard';
import { DesktopLiveDashboard } from './components/DesktopLiveDashboard';
import { StartVerification } from './components/StartVerification';

// Inner component to use Auth and Data contexts
const AppContent: React.FC = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { printers, stations, updatePrinter: contextUpdatePrinter, resetPrinter: contextResetPrinter, isSyncing, checklistTemplates, saveShiftLog } = usePrinters();

  const [view, setView] = useState<ViewType>(() => {
    // Check URL for /live variants
    const path = window.location.pathname;
    if (path === '/live') return 'LIVE';
    if (path === '/mlive') return 'LIVE_MOBILE';
    if (path === '/dlive') return 'LIVE_DESKTOP';
    return 'DASHBOARD';
  });
  const [activePrinterId, setActivePrinterId] = useState<string | null>(null);
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number, message: string, type: 'success' | 'error' | 'info' }[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);

  // Automatically handle view switching based on auth, UNLESS it's a live dashboard
  const isLiveView = view === 'LIVE' || view === 'LIVE_MOBILE' || view === 'LIVE_DESKTOP';
  const currentView = isLiveView ? view : (!user ? 'LOGIN' : view);

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

  const handleStartSetup = async (id: string, type: 'PRINTER' | 'STATION' = 'PRINTER') => {
    if (type === 'STATION') {
      setActiveStationId(id);
      setView('STATION_SETUP' as any); // Temporary cast until ViewType updated
      return;
    }

    const p = printers.find(x => x.id === id);
    if (!p) return;

    if (p.status === PrinterStatus.READY_TO_WORK) {
      // Direct start work logic
      await contextUpdatePrinter(id, {
        status: PrinterStatus.WORKING,
        workStartedAt: new Date().toISOString(),
      });
      addToast("Darbas pradėtas!", "success");
      return;
    }

    // Check availability of verification
    // Triggers if verification is not done yet.
    // This allows manual entry of remaining amount if it was missing from previous shift.
    const needsVerification = !p.handoverVerified;

    setActivePrinterId(id);
    if (needsVerification) {
      setView('START_VERIFICATION');
    } else {
      setView('SETUP');
    }
  };

  const handleVerificationConfirm = async (remaining: number) => {
    if (activePrinterId) {
      await contextUpdatePrinter(activePrinterId, {
        handoverVerified: true,
        remainingAmount: remaining
        // We could clear message here, but user might want to refer to it?
        // Let's keep it until they finish shift or explicit clear?
        // Actually, once verified, it's "consumed".
        // Maybe we don't clear it from DB, just verifying flag allows bypassing.
      });
      setView('SETUP');
    }
  };

  const handleOpenEndShift = (id: string) => {
    setActivePrinterId(id);
    setView('END_SHIFT');
  };

  const handleCompleteEndShift = async (message: string, endChecklist: { [key: string]: boolean }, production: number, defects: number, remaining: number, robotDefects?: number, printDefects?: number) => {
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
            finishedAt: new Date().toISOString(),
            productionAmount: production,
            defectsAmount: defects,
            robotDefects: robotDefects || 0,
            printingDefects: printDefects || 0,
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
        workFinishedAt: new Date().toISOString(),
        nextOperatorMessage: message,
        endShiftChecklist: endChecklist,
        productionAmount: production,
        remainingAmount: remaining,
        defectsAmount: defects,
        robotDefects: robotDefects || 0,
        printingDefects: printDefects || 0,
        // Resetting ONLY dynamic state, keeping VIT for next shift check
        // maintenanceDone: false, // Don't reset
        // nozzlePrintDone: false, // Don't reset
        // nozzleFile: null, // Don't reset
        // vit: ... // Don't reset
        // selectedMimakiUnits: [], // Keep selection
        // mimakiNozzleFiles: {} // Keep files
      });
      setView('DASHBOARD');
      setActivePrinterId(null);
      const defectRate = production > 0 ? ((defects / production) * 100).toFixed(1) + '%' : '0%';
      addToast(`Pamaina baigta! Pagaminta: ${production}, Brokas: ${defectRate}`, 'success');

      // Scroll to top to ensure user sees the dashboard/scanner immediately
      window.scrollTo(0, 0);

      // Reload the page to ensure fresh state for next shift
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const handleSetupComplete = async () => {
    if (activePrinterId && user) {
      try {
        await contextUpdatePrinter(activePrinterId, {
          status: PrinterStatus.WORKING, // Auto-start work
          maintenanceDone: true,
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
  const isLive = currentView === 'LIVE'; // Only TV view uses the dark wrapper, others manage their own
  // Or actually, let's keep it simple. If it's generic live, we might want to let the component handle it?
  // Mobile/Desktop components have full-screen generic classes.
  // The wrapper div has `min-h-screen relative`. 
  // Let's just say if it's ANY live view, we might not want the default slate-50.
  // But wait, App wrapper puts `bg-slate-50` by default.
  // Mobile wants `bg-slate-50`. Desktop `bg-slate-100`. TV `bg-slate-950`.
  // TV component has `fixed inset-0` so it covers everything.
  // Mobile/Desktop are just normal flow.

  return (
    <div className={`min-h-screen relative ${isLive ? 'bg-slate-950' : 'bg-slate-50'}`}>
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
          stations={stations}
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
          onSave={(data, silent) => contextUpdatePrinter(activePrinter.id, data, silent)}
          onFinish={handleSetupComplete}
          onCancel={() => { setView('DASHBOARD'); setActivePrinterId(null); }}
          addToast={addToast}
          uploadFile={usePrinters().uploadFile}
        />
      )}

      {/* Render Station Setup */}
      {(view as any) === 'STATION_SETUP' && activeStationId && user && (
        <StationSetupProcess
          station={stations.find(s => s.id === activeStationId)!}
          assignedPrinters={printers.filter(p => p.stationId === activeStationId)}
          currentUser={user}
          checklistTemplates={checklistTemplates}
          updatePrinter={contextUpdatePrinter}
          onFinish={() => setView('DASHBOARD')}
          onCancel={() => { setView('DASHBOARD'); setActiveStationId(null); }}
          addToast={addToast}
          uploadFile={usePrinters().uploadFile}
        />
      )}

      {currentView === 'START_VERIFICATION' && activePrinter && user && (
        <StartVerification
          printer={activePrinter}
          currentUser={user}
          onConfirm={handleVerificationConfirm}
          onCancel={() => { setView('DASHBOARD'); setActivePrinterId(null); }}
        />
      )}

      {currentView === 'END_SHIFT' && activePrinter && user && (
        <EndShiftProcess
          printer={activePrinter}
          currentUser={user}
          checklistTemplates={checklistTemplates}
          onFinish={handleCompleteEndShift}
          onCancel={() => setView('DASHBOARD')}
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

      {currentView === 'LIVE' && (
        <LiveDashboard printers={printers} />
      )}

      {currentView === 'LIVE_MOBILE' && (
        <MobileLiveDashboard printers={printers} />
      )}

      {currentView === 'LIVE_DESKTOP' && (
        <DesktopLiveDashboard printers={printers} />
      )}

      {/* Feedback Button - Always visible if logged in */}
      {user && (
        <>
          <button
            onClick={() => setShowFeedback(true)}
            className="fixed bottom-6 left-6 z-[100] bg-white text-slate-500 hover:text-mimaki-blue p-3 rounded-full shadow-lg border border-slate-200 hover:border-mimaki-blue/50 transition-all duration-300 group"
            title="Pranešti apie klaidą"
          >
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping hidden group-hover:block"></div>
            <MessageSquare className="w-6 h-6" />
          </button>
          <FeedbackModal
            isOpen={showFeedback}
            onClose={() => setShowFeedback(false)}
            addToast={addToast}
          />
        </>
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
