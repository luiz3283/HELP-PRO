import React, { useState, useEffect } from 'react';
import { User, MileageLog } from '../types';
import { storageService } from '../services/storage';
import { analyzeOdometer } from '../services/geminiService';
import { CameraCapture } from './Camera';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bike, CheckCircle, Upload, AlertTriangle, Sparkles, LogOut, MapPin, Download, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  user: User;
  onLogout: () => void;
}

export const MotoboyPanel: React.FC<Props> = ({ user, onLogout }) => {
  const [currentLog, setCurrentLog] = useState<MileageLog | undefined>();
  const [showCamera, setShowCamera] = useState(false);
  const [mileageInput, setMileageInput] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Export State
  const [exportMonth, setExportMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    loadTodayLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTodayLog = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const log = storageService.findOpenLog(user.id, today);
    
    // If we have a closed log for today, show it
    if (!log) {
       const logs = storageService.getLogs();
       const closedLog = logs.find(l => l.userId === user.id && l.date === today && l.status === 'CLOSED');
       setCurrentLog(closedLog);
    } else {
      setCurrentLog(log);
    }
  };

  const handleCameraCapture = async (imageData: string, location: string) => {
    setCapturedImage(imageData);
    setCapturedLocation(location);
    setShowCamera(false);

    // AI Analysis
    if (process.env.API_KEY) {
      setIsAnalyzing(true);
      const reading = await analyzeOdometer(imageData);
      setIsAnalyzing(false);
      if (reading) {
        setMileageInput(reading.toString());
        setStatusMessage({ type: 'success', text: 'KM identificado!' });
      } else {
        setStatusMessage({ type: 'error', text: 'KM não identificado. Digite.' });
      }
    }
  };

  const handleSubmit = () => {
    if (!mileageInput || !capturedImage) {
      setStatusMessage({ type: 'error', text: 'Foto e KM são obrigatórios.' });
      return;
    }

    const km = parseFloat(mileageInput);
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    
    if (currentLog && currentLog.status === 'OPEN') {
      // Closing the day
      if (km < (currentLog.startKm || 0)) {
        setStatusMessage({ type: 'error', text: 'KM final menor que o inicial.' });
        return;
      }

      const updatedLog: MileageLog = {
        ...currentLog,
        endKm: km,
        endTime: now.toISOString(),
        endPhoto: capturedImage,
        endLocation: capturedLocation,
        status: 'CLOSED'
      };
      storageService.saveLog(updatedLog);
      setStatusMessage({ type: 'success', text: 'Dia finalizado!' });
      setCurrentLog(updatedLog);
    } else {
      // Starting the day
      const newLog: MileageLog = {
        id: crypto.randomUUID(),
        userId: user.id,
        userName: user.name,
        date: today,
        startKm: km,
        startTime: now.toISOString(),
        startPhoto: capturedImage,
        startLocation: capturedLocation,
        endKm: null,
        endTime: null,
        endPhoto: null,
        endLocation: null,
        status: 'OPEN'
      };
      storageService.saveLog(newLog);
      setStatusMessage({ type: 'success', text: 'Dia iniciado!' });
      setCurrentLog(newLog);
    }
    
    // Reset form states
    setCapturedImage(null);
    setMileageInput('');
  };

  const handleExportExcel = () => {
    const logs = storageService.getLogs();
    const userLogs = logs.filter(l => 
        l.userId === user.id && 
        l.date.startsWith(exportMonth)
    ).sort((a, b) => a.date.localeCompare(b.date));

    if (userLogs.length === 0) {
        setStatusMessage({ type: 'error', text: 'Sem registros neste mês.' });
        return;
    }

    const data: any[] = userLogs.map(log => ({
        Data: format(new Date(log.date + 'T00:00:00'), 'dd/MM/yyyy'),
        'KM Inicial': log.startKm,
        'Hora Inicial': log.startTime ? format(new Date(log.startTime), 'HH:mm') : '-',
        'Local Inicial': log.startLocation || '-',
        'KM Final': log.endKm || '-',
        'Hora Final': log.endTime ? format(new Date(log.endTime), 'HH:mm') : '-',
        'Local Final': log.endLocation || '-',
        'KM Total': (log.endKm && log.startKm) ? (log.endKm - log.startKm).toFixed(1) : 0, 
        Status: log.status === 'CLOSED' ? 'Fechado' : 'Aberto'
    }));

    const totalKmMonth = userLogs.reduce((acc, log) => {
        if (log.endKm && log.startKm) return acc + (log.endKm - log.startKm);
        return acc;
    }, 0);

    data.push({
        Data: 'TOTAL MÊS',
        'KM Inicial': '',
        'Hora Inicial': '',
        'Local Inicial': '',
        'KM Final': '',
        'Hora Final': '',
        'Local Final': 'SOMA MENSAL:',
        'KM Total': totalKmMonth.toFixed(1),
        Status: ''
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
    
    const fileName = `Relatorio-${user.name.replace(/\s+/g, '_')}-${exportMonth}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setStatusMessage({ type: 'success', text: 'Planilha baixada!' });
  };

  if (showCamera) {
    return <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />;
  }

  const isDayClosed = currentLog?.status === 'CLOSED';
  const isDayStarted = currentLog?.status === 'OPEN';

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 text-zinc-100 font-sans">
      {/* Header Street Style */}
      <div className="bg-zinc-900 border-b-4 border-yellow-400 p-6 relative overflow-hidden">
        {/* Graffiti Background Element */}
        <div className="absolute top-0 right-0 text-zinc-800 font-graffiti text-9xl opacity-20 transform rotate-12 select-none -translate-y-4 translate-x-4">
            RUA
        </div>

        <div className="flex justify-between items-start relative z-10">
            <div>
                <h1 className="text-3xl font-graffiti text-yellow-400 drop-shadow-md transform -rotate-1">
                    Fala, {user.name.split(' ')[0]}!
                </h1>
                <div className="inline-block bg-purple-600 text-white text-xs font-bold px-2 py-0.5 transform rotate-1 mt-1">
                    {user.vehiclePlate}
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-3 uppercase tracking-widest">{format(new Date(), "EEEE, dd MMM", { locale: ptBR })}</p>
            </div>
            <button onClick={onLogout} className="bg-zinc-800 border-2 border-zinc-700 p-2 hover:bg-red-900/50 hover:border-red-500 transition text-zinc-400 hover:text-red-500">
                <LogOut size={20} />
            </button>
        </div>
      </div>

      <div className="p-4 mt-2 space-y-6">
        {/* Reports Section (Moved from Admin) */}
        <div className="bg-zinc-900 p-4 border border-zinc-800 flex flex-col gap-3">
             <div className="flex items-center gap-2 text-zinc-500 mb-1">
                <Download size={16} className="text-yellow-400" />
                <span className="text-xs font-bold uppercase tracking-widest">Relatórios</span>
             </div>
             <div className="flex gap-2">
                <div className="relative flex-1">
                    <input 
                        type="month" 
                        value={exportMonth}
                        onChange={(e) => setExportMonth(e.target.value)}
                        className="w-full bg-black border border-zinc-700 text-white p-2 text-xs font-mono uppercase focus:border-yellow-400 outline-none h-10"
                    />
                    <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
                </div>
                <button 
                    onClick={handleExportExcel}
                    className="bg-green-600 hover:bg-green-500 text-black font-bold uppercase text-xs px-4 h-10 shadow-lg transition"
                >
                    Baixar Excel
                </button>
             </div>
        </div>

        {/* Status Card - Gritty Look */}
        <div className={`bg-zinc-900 p-6 border-l-4 shadow-lg relative overflow-hidden group
            ${isDayClosed ? 'border-green-500' : isDayStarted ? 'border-blue-500' : 'border-zinc-700'}`}
        >
          <div className="relative z-10">
            <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-widest font-mono mb-2">Status Atual</h2>
            {isDayClosed ? (
                <div className="flex items-center text-green-400 gap-3">
                <CheckCircle className="w-8 h-8" />
                <span className="font-graffiti text-2xl">Finalizado</span>
                </div>
            ) : isDayStarted ? (
                <div className="flex items-center text-blue-400 gap-3">
                <Bike className="w-8 h-8" />
                <span className="font-graffiti text-2xl">Na Pista</span>
                </div>
            ) : (
                <div className="flex items-center text-zinc-500 gap-3">
                <AlertTriangle className="w-8 h-8" />
                <span className="font-graffiti text-2xl">Off-line</span>
                </div>
            )}
            
            {currentLog && (
                <div className="mt-4 pt-4 border-t-2 border-dashed border-zinc-800 grid grid-cols-2 gap-4 font-mono">
                <div>
                    <p className="text-[10px] text-zinc-500 uppercase">KM Inicial</p>
                    <p className="text-xl font-bold text-white">{currentLog.startKm} <span className="text-sm text-zinc-600">km</span></p>
                </div>
                <div>
                    <p className="text-[10px] text-zinc-500 uppercase">KM Final</p>
                    <p className="text-xl font-bold text-white">{currentLog.endKm || '---'} <span className="text-sm text-zinc-600">km</span></p>
                </div>
                </div>
            )}
          </div>
        </div>

        {/* Action Area */}
        {!isDayClosed && (
          <div className="bg-zinc-900 border border-zinc-800 p-6 shadow-xl relative">
             {/* Decor corners */}
             <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-400"></div>
             <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400"></div>
             <div className="absolute bottom-0 left-0 w-2 h-2 bg-yellow-400"></div>
             <div className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-400"></div>

            <h3 className="font-graffiti text-2xl mb-6 text-white text-center">
              {isDayStarted ? 'Fechar o Dia' : 'Abrir o Dia'}
            </h3>

            {/* Photo Step */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2 font-mono">1. Foto do Painel</label>
              {capturedImage ? (
                <div className="relative border-2 border-zinc-700 h-48 w-full bg-black group">
                  <img src={capturedImage} alt="Painel" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                  <button 
                    onClick={() => setShowCamera(true)}
                    className="absolute bottom-2 right-2 bg-yellow-400 text-black px-4 py-2 text-xs font-bold uppercase hover:bg-yellow-300 shadow-md"
                  >
                    Trocar Foto
                  </button>
                  <div className="absolute top-2 left-2 bg-black/80 text-yellow-400 px-2 py-1 text-[10px] font-mono border border-yellow-400/30 flex items-center gap-1">
                    <MapPin size={10} /> Localizado
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowCamera(true)}
                  className="w-full h-32 border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:border-purple-500 hover:text-purple-400 transition active:scale-95"
                >
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="font-mono text-sm uppercase">Tirar Foto</span>
                </button>
              )}
            </div>

            {/* Mileage Step */}
            <div className="mb-8">
              <label className="block text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2 font-mono">
                2. KM do Painel
                {isAnalyzing && <span className="ml-2 text-purple-400 animate-pulse inline-flex items-center gap-1 normal-case font-sans font-normal text-[10px]"><Sparkles size={10}/> IA lendo...</span>}
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={mileageInput}
                  onChange={(e) => setMileageInput(e.target.value)}
                  placeholder="00000"
                  className="w-full p-4 bg-black border-2 border-zinc-700 text-white text-3xl font-mono focus:border-yellow-400 focus:bg-zinc-900 outline-none transition placeholder-zinc-800"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold font-mono">KM</span>
              </div>
            </div>

            {/* Feedback Message */}
            {statusMessage && (
                <div className={`mb-4 p-3 border-l-4 text-sm font-bold font-mono ${statusMessage.type === 'success' ? 'border-green-500 bg-green-900/20 text-green-400' : 'border-red-500 bg-red-900/20 text-red-400'}`}>
                    {statusMessage.text}
                </div>
            )}

            <button 
              onClick={handleSubmit}
              disabled={!capturedImage || !mileageInput}
              className={`w-full py-4 font-graffiti text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition transform active:translate-y-1 active:shadow-none border-2 border-black text-black ${
                !capturedImage || !mileageInput 
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed border-zinc-600' 
                : isDayStarted ? 'bg-red-500 hover:bg-red-400' : 'bg-green-500 hover:bg-green-400'
              }`}
            >
              {isDayStarted ? 'FINALIZAR CORRE' : 'INICIAR CORRE'}
            </button>
          </div>
        )}

        {isDayClosed && (
            <div className="text-center p-8 mt-8 border-2 border-dashed border-zinc-800 rounded-lg">
                <p className="font-graffiti text-zinc-600 text-xl">É isso aí! Descanso merecido.</p>
            </div>
        )}
      </div>
    </div>
  );
};