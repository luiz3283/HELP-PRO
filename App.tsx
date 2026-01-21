
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { storageService } from './services/storage';
import { MotoboyPanel } from './components/MotoboyPanel';
import { Zap, Download, Shield, Bike, Briefcase } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isSetupDone, setIsSetupDone] = useState(false);
  const [appState, setAppState] = useState<'LOADING' | 'SETUP' | 'WELCOME' | 'APP'>('LOADING');

  // Setup Form State (First time only)
  const [regName, setRegName] = useState('');
  const [regPlate, setRegPlate] = useState('');
  const [regModel, setRegModel] = useState('');
  const [regClient, setRegClient] = useState('');

  const [showInstallHint, setShowInstallHint] = useState(false);

  useEffect(() => {
    // Check if installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (!isStandalone) setShowInstallHint(true);

    // Check for existing user
    const existingUser = storageService.getMainUser();
    
    if (existingUser) {
        setUser(existingUser);
        setAppState('WELCOME');
    } else {
        setAppState('SETUP');
    }
  }, []);

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPlate) return;

    const newUser: User = {
        id: crypto.randomUUID(),
        name: regName,
        username: regName.toLowerCase().replace(/\s+/g, ''),
        role: UserRole.MOTOBOY,
        vehiclePlate: regPlate.toUpperCase(),
        vehicleModel: regModel.toUpperCase(),
        clientName: regClient
    };

    storageService.addUser(newUser);
    setUser(newUser);
    setAppState('APP'); // Go straight to app after setup
  };

  const handleEnter = () => {
    setAppState('APP');
  };

  const handleLogout = () => {
    // Actually just resets to welcome screen in this simplified version
    // Unless we want to "Clear Data"
    setAppState('WELCOME');
  };

  if (appState === 'APP' && user) {
    return <MotoboyPanel user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black p-4">
        <div className="w-full max-w-md bg-zinc-900/50 border-2 border-yellow-400/20 rounded-sm overflow-hidden relative flex flex-col justify-center backdrop-blur-sm shadow-2xl">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 blur-[80px] opacity-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400 blur-[80px] opacity-10 pointer-events-none"></div>

          <div className="p-8 text-center relative z-10">
            <div className="inline-flex items-center justify-center p-4 rounded-none bg-yellow-400 mb-4 transform -rotate-3 border-2 border-black shadow-lg">
                <Zap className="text-black w-10 h-10 fill-black" />
            </div>
            <h1 className="text-5xl md:text-6xl text-white mb-2 font-graffiti tracking-wider transform -rotate-2 drop-shadow-lg">
              Help <span className="text-yellow-400">Pro</span>
            </h1>
            <p className="text-zinc-400 font-mono text-xs tracking-[0.2em] uppercase mt-2">Sistema de Controle Urbano</p>
          </div>
          
          <div className="p-8 pt-0 relative z-10">
            
            {appState === 'SETUP' && (
                <form onSubmit={handleSetup} className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-zinc-800/50 p-4 border border-zinc-700 mb-4">
                        <p className="text-yellow-400 font-bold uppercase text-xs tracking-widest mb-1">Configuração Inicial</p>
                        <p className="text-zinc-400 text-[10px]">Informe seus dados para começar. Isso será feito apenas uma vez.</p>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Seu Nome</label>
                        <input
                            required
                            type="text"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            className="w-full px-3 py-3 bg-black/40 text-white border-b border-zinc-600 focus:border-yellow-400 outline-none font-mono"
                            placeholder="Ex: João Silva"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Placa da Moto</label>
                            <input
                                required
                                type="text"
                                value={regPlate}
                                onChange={(e) => setRegPlate(e.target.value)}
                                className="w-full px-3 py-3 bg-black/40 text-white border-b border-zinc-600 focus:border-yellow-400 outline-none font-mono uppercase"
                                placeholder="ABC-1234"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Modelo</label>
                            <input
                                type="text"
                                value={regModel}
                                onChange={(e) => setRegModel(e.target.value)}
                                className="w-full px-3 py-3 bg-black/40 text-white border-b border-zinc-600 focus:border-yellow-400 outline-none font-mono"
                                placeholder="CG 160"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Empresa / Cliente</label>
                        <input
                            type="text"
                            value={regClient}
                            onChange={(e) => setRegClient(e.target.value)}
                            className="w-full px-3 py-3 bg-black/40 text-white border-b border-zinc-600 focus:border-yellow-400 outline-none font-mono"
                            placeholder="Ex: iFood"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-purple-600 text-white font-graffiti text-2xl py-3 hover:bg-purple-500 transition shadow-lg mt-4 border-2 border-transparent hover:border-white"
                    >
                        CRIAR PERFIL
                    </button>
                </form>
            )}

            {appState === 'WELCOME' && user && (
                <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
                     <div className="mb-6 flex flex-col items-center">
                        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center border-4 border-yellow-400 mb-4 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                            <span className="font-graffiti text-3xl text-white">{user.name.charAt(0)}</span>
                        </div>
                        <h2 className="text-white text-xl font-bold uppercase tracking-wide">{user.name}</h2>
                        <span className="text-zinc-500 font-mono text-sm bg-zinc-900 px-2 py-1 mt-1 border border-zinc-800">{user.vehiclePlate}</span>
                     </div>

                    <button
                        onClick={handleEnter}
                        className="w-full bg-yellow-400 text-black font-graffiti text-4xl py-6 hover:bg-yellow-300 transition transform hover:-translate-y-1 active:translate-y-0 border-2 border-black shadow-[4px_4px_0px_0px_#fff]"
                    >
                        ENTRAR
                    </button>

                    <button 
                        onClick={() => {
                            if(window.confirm('Isso apagará seus dados e logs deste dispositivo. Tem certeza?')) {
                                storageService.clearUsers();
                                window.location.reload();
                            }
                        }}
                        className="mt-8 text-zinc-600 hover:text-red-500 text-[10px] uppercase font-bold tracking-widest"
                    >
                        Resetar Aplicativo
                    </button>
                </div>
            )}

            {showInstallHint && appState !== 'LOADING' && (
                <div className="mt-8 p-4 bg-zinc-800/50 border border-zinc-700 rounded text-center">
                    <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
                        <Download size={18} />
                        <span className="font-bold uppercase text-xs tracking-widest">Instalar Aplicativo</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                        Para instalar, toque no botão <strong>Compartilhar</strong> (iOS) ou <strong>Menu</strong> (Android) e selecione <strong>"Adicionar à Tela de Início"</strong>.
                    </p>
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default App;
