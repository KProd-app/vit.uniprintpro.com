import React, { useEffect, useState } from 'react';
import { PrinterData, PrinterStatus, User, UserRole } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { StatusBadge } from './ui/badge';
import { LogOut, Settings, RotateCcw, FileText, Play, CheckCircle, Square, QrCode, List } from 'lucide-react';
import { Timer } from './Timer';
import { Scanner } from '@yudiel/react-qr-scanner';

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
  // Find assigned printer(s) for current user
  const myPrinters = printers.filter(p =>
    p.operatorName === currentUser.name &&
    p.status !== PrinterStatus.NOT_STARTED &&
    p.status !== PrinterStatus.ENDING_SHIFT
  );

  const [showScanner, setShowScanner] = useState<boolean>(myPrinters.length === 0 && currentUser.role === UserRole.WORKER);
  const [scanError, setScanError] = useState<string>('');
  const [showAllPrinters, setShowAllPrinters] = useState<boolean>(false);
  const [scannerEnabled, setScannerEnabled] = useState<boolean>(false);

  // If user has an active job, they see that job. Otherwise scanner or list.

  useEffect(() => {
    if (!showScanner) {
      setScannerEnabled(false);
      setScanError('');
    }
  }, [showScanner]);

  const handleScan = (detectedCodes: any) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedValue = detectedCodes[0].rawValue;

      // If the scanned value is a full URL containing '?station=', extract it. Otherwise use the pathname.
      let parsedStationValue = scannedValue;
      try {
        const url = new URL(scannedValue);
        const param = url.searchParams.get('station');
        if (param) {
          parsedStationValue = param;
        } else if (url.pathname.length > 1 && !['/live', '/mlive', '/dlive', '/lenta', '/user'].includes(url.pathname)) {
          parsedStationValue = decodeURIComponent(url.pathname.substring(1));
        }
      } catch (e) {
        // Not a valid URL, use raw value
      }

      const normalizedParam = parsedStationValue.toLowerCase().trim();
      // Find printer by ID OR mapping fields
      const printer = printers.find(p => 
        p.id === parsedStationValue || 
        (p.qrCode && p.qrCode.toLowerCase().trim() === normalizedParam) ||
        p.name.toLowerCase().replace(/\s+/g, '') === normalizedParam
      );
      if (printer) {
        if (printer.status === PrinterStatus.WORKING) {
          // If scanning a working printer, maybe they want to join it or finish it? 
          // For now, standard logic: open it.
          // If it's THEIR printer, just open it.
          if (printer.operatorName === currentUser.name) {
            onStart(printer.id);
          } else {
            // Taking over? Or just viewing? 
            // User requirements imply simple assignment. Let's just open the view.
            onStart(printer.id);
          }
        } else {
          onStart(printer.id);
        }
        setShowScanner(false); // Close scanner after success
      } else {
        setScanError('Nerastas stationas su šiuo QR kodu');
      }
    }
  };

  const renderPrinterCard = (printer: PrinterData, featured: boolean = false) => (
    <Card key={printer.id} className={`overflow-hidden hover:shadow-[0_20px_40px_rgba(0,91,172,0.15)] transition-all duration-300 group border-white hover:border-mimaki-blue/20 bg-white/80 backdrop-blur-sm flex flex-col h-full ${featured ? 'border-mimaki-blue shadow-xl ring-4 ring-mimaki-blue/10 transform md:scale-105 z-10' : ''}`}>
      <CardHeader className="p-6 md:p-8 pb-4 flex-shrink-0">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-4 transition-colors duration-300 rounded-2xl text-slate-400 ${featured ? 'bg-mimaki-blue text-white' : 'bg-mimaki-gray group-hover:bg-mimaki-blue group-hover:text-white'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>
          <StatusBadge status={printer.status} className="px-3 py-1 text-[10px] uppercase tracking-wider" />
        </div>
        <CardTitle className="text-2xl font-black text-mimaki-dark uppercase tracking-tighter truncate" title={printer.name}>{printer.name}</CardTitle>
        {featured && <div className="text-xs font-bold text-mimaki-blue uppercase tracking-widest mt-2">Jūsų Aktyvi Stotis</div>}
        {printer.operatorName && !featured && <div className="text-xs text-slate-400 mt-2 truncate">Operatorius: {printer.operatorName}</div>}
      </CardHeader>

      <CardContent className="p-6 md:p-8 pt-2 flex-grow flex flex-col">
        {/* Message from previous operator */}
        {printer.nextOperatorMessage ? (
          <div className="mb-6 p-5 bg-amber-50 rounded-3xl border border-amber-100 text-sm text-amber-900 italic relative flex-shrink-0">
            <span className="absolute -top-3 left-4 bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-1 rounded-full tracking-widest">Perdavimas</span>
            "{printer.nextOperatorMessage}"
          </div>
        ) : (
          <div className="h-4 mb-6 flex-shrink-0"></div> // Spacer
        )}

        <div className="space-y-4 mt-auto">
          {/* Timer for Working Status */}
          {printer.status === PrinterStatus.WORKING && printer.workStartedAt && (
            <div className="mb-4 bg-slate-900 text-white rounded-2xl py-4 px-6 shadow-lg shadow-slate-900/20 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-widest">Gamybos Laikas</div>
              <Timer startTime={printer.workStartedAt} className="text-3xl justify-center text-emerald-400" />
            </div>
          )}

          {/* Phase-based actions */}
          {printer.status === PrinterStatus.NOT_STARTED || printer.status === PrinterStatus.IN_PROGRESS ? (
            <Button
              onClick={() => (printer.status === PrinterStatus.NOT_STARTED && printer.workFinishedAt) ? onFinishWork(printer.id) : onStart(printer.id)}
              className="w-full h-16 text-lg font-black shadow-lg shadow-mimaki-blue/20 bg-mimaki-dark hover:bg-black active:scale-95 transition-transform"
            >
              {(printer.status === PrinterStatus.NOT_STARTED && printer.workFinishedAt) ? (
                <FileText className="w-5 h-5 mr-3 text-mimaki-blue" />
              ) : (
                <Play className="w-5 h-5 mr-3 text-mimaki-blue" fill="currentColor" />
              )}
              {printer.status === PrinterStatus.IN_PROGRESS
                ? 'Tęsti Paruošimą'
                : (printer.workFinishedAt ? 'Koreguoti Duomenis' : 'Pradėti Darbą')
              }
            </Button>
          ) : null}

          {printer.status === PrinterStatus.READY_TO_WORK ? (
            <Button
              onClick={() => onStart(printer.id)}
              className="w-full h-16 text-lg bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 border-transparent active:scale-95 transition-transform"
            >
              <CheckCircle className="w-5 h-5 mr-3" />
              Vykdyti Gamybą
            </Button>
          ) : null}

          {printer.status === PrinterStatus.WORKING ? (
            <Button
              onClick={() => onFinishWork(printer.id)}
              className="w-full h-16 text-lg bg-mimaki-blue hover:bg-blue-600 shadow-lg shadow-mimaki-blue/30 border-transparent active:scale-95 transition-transform"
            >
              <Square className="w-5 h-5 mr-3 fill-current" />
              Baigti Darbą
            </Button>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="p-6 md:p-8 pt-0 flex gap-3 flex-shrink-0">
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
  );

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
            <p className="text-slate-500 mt-2 text-lg font-medium">
              {myPrinters.length > 0
                ? `Jūsų aktyvios stotys: ${myPrinters.length}`
                : 'Valdykite savo įrenginio darbo ciklą'}
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setShowScanner(!showScanner);
                if (!showScanner) {
                  setShowAllPrinters(false);
                  setScannerEnabled(false);
                  setScanError('');
                }
              }}
              className={`h-14 px-8 rounded-2xl font-bold uppercase tracking-widest transition-all ${showScanner ? 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50' : 'bg-mimaki-blue text-white shadow-lg shadow-mimaki-blue/30'}`}
            >
              {showScanner ? (
                <>
                  <List className="w-5 h-5 mr-2" />
                  Uždaryti Skanerį
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  Skenuoti Kitą
                </>
              )}
            </Button>
          </div>
        </header>

        {showScanner ? (
          <div className="flex flex-col items-center justify-center py-10 animate-in fade-in zoom-in duration-300">
            <Card className="w-full max-w-md overflow-hidden bg-slate-900 border-0 shadow-2xl rounded-[3rem]">
              <CardHeader className="text-center pb-2 pt-8">
                <CardTitle className="text-white text-2xl uppercase tracking-widest">Skenuokite QR Kodą</CardTitle>
                <p className="text-slate-400 text-sm font-medium">Nukreipkite kamerą į stoties kodą</p>
              </CardHeader>
              <CardContent className="p-4">
                <div className="relative rounded-[2rem] overflow-hidden border-4 border-slate-700 bg-black aspect-square">
                  {scannerEnabled ? (
                    <Scanner
                      onScan={handleScan}
                      onError={() => setScanError('Nepavyko pasiekti kameros. Patikrinkite kameros leidimą naršyklėje.')}
                      components={{}}
                      styles={{ container: { width: '100%', height: '100%' } }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center text-white p-6">
                      <p className="font-bold">Norint skenuoti QR, reikia įjungti kamerą.</p>
                      <Button
                        onClick={() => setScannerEnabled(true)}
                        className="mt-4 bg-mimaki-blue text-white hover:bg-blue-700"
                      >
                        Įjungti kamerą
                      </Button>
                    </div>
                  )}
                </div>
                {scanError && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center text-sm font-bold">
                    {scanError}
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-center pb-8 pt-0">
                <p className="text-slate-500 text-xs font-mono">VIT UNIPRINT PRO • SCANNER</p>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="space-y-12">
            {myPrinters.length > 0 ? (
              <div className="animate-in slide-in-from-bottom-8 duration-500">
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-mimaki-dark uppercase tracking-tight mb-6">Mano Stotys ({myPrinters.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                    {myPrinters.map(p => renderPrinterCard(p, true))}
                  </div>
                </div>

                <div className="text-center pt-8 border-t border-slate-200">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Norite dirbti prie kito įrenginio?</p>
                  {!showAllPrinters ? (
                    <Button variant="outline" onClick={() => setShowAllPrinters(true)} className="rounded-full px-8">
                      Rodyti visas stotis
                    </Button>
                  ) : (
                    <Button variant="ghost" onClick={() => setShowAllPrinters(false)} className="text-slate-400">
                      Slėpti kitas stotis
                    </Button>
                  )}
                </div>

                {showAllPrinters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 mt-8 pb-20 animate-in fade-in duration-500">
                    {printers.filter(p => !myPrinters.find(mp => mp.id === p.id)).map(p => renderPrinterCard(p))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 pb-20 animate-in slide-in-from-bottom-8 duration-500">
                {printers.map(p => renderPrinterCard(p))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
