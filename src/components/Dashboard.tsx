import React, { useState } from 'react';
import { PrinterData, PrinterStatus, User, UserRole, Station } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { StatusBadge } from './ui/badge';
import { LogOut, Settings, RotateCcw, FileText, Play, CheckCircle, Square, QrCode, List, LayoutGrid } from 'lucide-react';
import { Timer } from './Timer';
import { Scanner } from '@yudiel/react-qr-scanner';

interface DashboardProps {
  printers: PrinterData[];
  stations: Station[];
  onStart: (id: string, type: 'PRINTER' | 'STATION') => void;
  onFinishWork: (id: string) => void;
  onView: (id: string) => void;
  onReset: (id: string) => void;
  currentUser: User;
  onLogout: () => void;
  onGoToAdmin: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  printers, stations, onStart, onFinishWork, onView, onReset, currentUser, onLogout, onGoToAdmin
}) => {
  // Group printers by station
  const printersByStation = printers.reduce((acc, printer) => {
    if (printer.stationId) {
      if (!acc[printer.stationId]) acc[printer.stationId] = [];
      acc[printer.stationId].push(printer);
    }
    return acc;
  }, {} as Record<string, PrinterData[]>);

  // Find assigned stations for current user (any printer in station assigned to user)
  const myStations = stations.filter(station => {
    const stationPrinters = printersByStation[station.id] || [];
    return stationPrinters.some(p =>
      p.operatorName === currentUser.name &&
      p.status !== PrinterStatus.NOT_STARTED &&
      p.status !== PrinterStatus.ENDING_SHIFT
    );
  });

  // Also find standalone printers assigned to user
  const myStandalonePrinters = printers.filter(p =>
    !p.stationId &&
    p.operatorName === currentUser.name &&
    p.status !== PrinterStatus.NOT_STARTED &&
    p.status !== PrinterStatus.ENDING_SHIFT
  );

  const hasActiveJob = myStations.length > 0 || myStandalonePrinters.length > 0;

  const [showScanner, setShowScanner] = useState<boolean>(!hasActiveJob && currentUser.role === UserRole.WORKER);
  const [scanError, setScanError] = useState<string>('');
  const [showAll, setShowAll] = useState<boolean>(false);

  const handleScan = (detectedCodes: any) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedValue = detectedCodes[0].rawValue;

      // Check for Station QR
      const station = stations.find(s => s.id === scannedValue || s.stationQrLink === scannedValue); // logic depends on what's in QR
      if (station) {
        onStart(station.id, 'STATION');
        setShowScanner(false);
        return;
      }

      // Check for Printer QR
      const printer = printers.find(p => p.id === scannedValue || p.qrCode === scannedValue);
      if (printer) {
        if (printer.stationId) {
          // If belongs to station, open station? Or specific printer?
          // Requirement implies Station-based flow. Let's open Station.
          onStart(printer.stationId, 'STATION');
        } else {
          onStart(printer.id, 'PRINTER');
        }
        setShowScanner(false);
      } else {
        setScanError('Nerastas objektas su šiuo QR kodu');
      }
    }
  };

  const renderPrinterCard = (printer: PrinterData, featured: boolean = false) => (
    <Card key={printer.id} className={`overflow-hidden hover:shadow-xl transition-all duration-300 group border-white hover:border-mimaki-blue/20 bg-white/80 backdrop-blur-sm flex flex-col h-full ${featured ? 'border-mimaki-blue shadow-xl ring-4 ring-mimaki-blue/10 transform md:scale-105 z-10' : ''}`}>
      <CardHeader className="p-6 pb-4 flex-shrink-0">
        <div className="flex justify-between items-start mb-4">
          <StatusBadge status={printer.status} className="px-2 py-1 text-[10px] uppercase tracking-wider" />
          {currentUser.role === UserRole.ADMIN && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); if (confirm('Išvalyti būseną?')) onReset(printer.id); }}
              className="text-slate-300 hover:text-red-500 h-6 w-6 -mr-2 -mt-2"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          )}
        </div>
        <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight truncate">{printer.name}</CardTitle>
        {printer.operatorName && <div className="text-xs text-slate-400 mt-1 truncate">Op: {printer.operatorName}</div>}
      </CardHeader>

      <CardContent className="p-6 pt-0 flex-grow flex flex-col">
        {printer.status === PrinterStatus.WORKING && printer.workStartedAt && (
          <div className="mt-auto mb-4 bg-slate-100 rounded-xl p-3 text-center">
            <Timer startTime={printer.workStartedAt} className="text-xl justify-center text-slate-700 font-mono" />
          </div>
        )}

        <div className="mt-auto space-y-2">
          {printer.status === PrinterStatus.WORKING ? (
            <Button onClick={() => onFinishWork(printer.id)} className="w-full bg-mimaki-blue hover:bg-blue-600 text-white font-bold h-12 rounded-xl text-sm uppercase">
              Baigti
            </Button>
          ) : (
            <Button onClick={() => onStart(printer.id, 'PRINTER')} className="w-full bg-slate-900 text-white font-bold h-12 rounded-xl text-sm uppercase">
              Pradėti
            </Button>
          )}
          <Button variant="ghost" onClick={() => onView(printer.id)} className="w-full text-xs font-bold uppercase text-slate-400 hover:text-mimaki-blue h-8">
            Istorija
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStationCard = (station: Station, featured: boolean = false) => {
    const assignedPrinters = printersByStation[station.id] || [];
    const activePrinters = assignedPrinters.filter(p => p.status === PrinterStatus.WORKING);
    const anyIssue = assignedPrinters.some(p => p.status === PrinterStatus.IN_PROGRESS && !p.status.includes('WORKING')); // Simplified check

    return (
      <Card key={station.id} className={`overflow-hidden hover:shadow-[0_20px_40px_rgba(0,91,172,0.15)] transition-all duration-300 border-0 shadow-sm bg-white flex flex-col h-full ${featured ? 'ring-4 ring-mimaki-blue/10 transform md:scale-105 z-10' : ''}`}>
        <div className="h-2 bg-gradient-to-r from-mimaki-blue to-cyan-400"></div>
        <CardHeader className="p-8 pb-4">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-100 rounded-2xl text-slate-400">
              <LayoutGrid className="w-6 h-6" />
            </div>
            {activePrinters.length > 0 && (
              <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {activePrinters.length} Aktyvūs
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{station.name}</CardTitle>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">{assignedPrinters.length} Įrenginiai</p>
        </CardHeader>
        <CardContent className="p-8 pt-2 flex-grow">
          <div className="space-y-3 mb-8">
            {assignedPrinters.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-600 truncate max-w-[120px]">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${p.status === PrinterStatus.WORKING ? 'bg-emerald-500' : p.status === PrinterStatus.NOT_STARTED ? 'bg-slate-300' : 'bg-amber-400'}`}></span>
                  <span className="text-[10px] font-bold uppercase text-slate-400">{p.operatorName || '-'}</span>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => onStart(station.id, 'STATION')}
            className="w-full h-14 bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-mimaki-blue hover:shadow-lg hover:shadow-mimaki-blue/20 transition-all rounded-2xl"
          >
            {activePrinters.length > 0 ? 'Valdyti Stotį' : 'Atidaryti Stotį'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm bg-white/80 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-mimaki-blue rounded-2xl shadow-lg shadow-mimaki-blue/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>
          <span className="font-black text-xl text-slate-900 tracking-tighter">UniPrintPro <span className="text-mimaki-blue">VIT</span></span>
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
              <p className="text-sm font-bold text-slate-900 leading-none">{currentUser.name}</p>
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
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Gamybos Stotis</h1>
            <p className="text-slate-500 mt-2 text-lg font-medium">
              {hasActiveJob
                ? 'Jūsų aktyvios užduotys'
                : 'Pasirinkite stotį darbui'}
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setShowScanner(!showScanner);
                if (!showScanner) setShowAll(false);
              }}
              className={`h-14 px-8 rounded-2xl font-bold uppercase tracking-widest transition-all ${showScanner ? 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50' : 'bg-mimaki-blue text-white shadow-lg shadow-mimaki-blue/30'}`}
            >
              {showScanner ? (
                <>
                  <List className="w-5 h-5 mr-2" />
                  Sąrašas
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  Skenuoti
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
                  <Scanner
                    onScan={handleScan}
                    components={{}}
                    styles={{ container: { width: '100%', height: '100%' } }}
                  />
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
            {/* My Active Stations/Printers */}
            {(myStations.length > 0 || myStandalonePrinters.length > 0) && (
              <div className="animate-in slide-in-from-bottom-8 duration-500">
                <div className="mb-8 p-6 bg-blue-50/50 rounded-[40px] border border-blue-100">
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6 ml-2">Mano Aktyvios Stotys</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {myStations.map(s => renderStationCard(s, true))}
                    {myStandalonePrinters.map(p => renderPrinterCard(p, true))}
                  </div>
                </div>

                <div className="text-center pt-8">
                  {!showAll && (
                    <Button variant="outline" onClick={() => setShowAll(true)} className="rounded-full px-8 text-slate-400 uppercase font-bold tracking-widest text-xs h-12">
                      Rodyti visas stotis
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* All Stations/Printers (if no active job OR showAll is true) */}
            {(!hasActiveJob || showAll) && (
              <div className="animate-in slide-in-from-bottom-8 duration-500">
                <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-6 ml-2">Visos Stotys</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {stations.map(s => renderStationCard(s))}
                  {/* Filter out standalone printers that are NOT in a station */}
                  {printers.filter(p => !p.stationId).map(p => renderPrinterCard(p))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
