import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { storageService } from './services/storage';
import { MotoboyPanel } from './components/MotoboyPanel';
import { AdminPanel } from './components/AdminPanel';
import { Zap, Lock, Download, UserPlus, ArrowLeft, Shield } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration State
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // UI State
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showInstallHint, setShowInstallHint] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (!isStandalone) {
        setShowInstallHint(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = storageService.getUsers();
    const foundUser = users.find(u => u.username === username && u.password === password);

    if (foundUser) {
      setUser(foundUser);
      setError('');
    } else {
      setError('Usuário ou senha inválidos, parça.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regName || !regUsername || !regPassword) {
        setError('Preencha todos os campos.');
        return;
    }

    if (regPassword !== regConfirmPassword) {
        setError('As senhas não conferem.');
        return;
    }

    const users = storageService.getUsers();
    if (users.find(u => u.username === regUsername)) {
        setError('Este usuário já existe.');
        return;
    }

    const newAdmin: User = {
        id: crypto.randomUUID(),
        name: regName,
        username: regUsername,
        password: regPassword,
        role: UserRole.ADMIN,
        vehiclePlate: 'ADMIN' // Placeholder for admin
    };

    storageService.addUser(newAdmin);
    
    setSuccessMsg('Admin cadastrado! Faça login agora.');
    setIsRegistering(false);
    setUsername(regUsername); // Pre-fill login
    setPassword('');
    // Clear reg form
    setRegName('');
    setRegUsername('');
    setRegPassword('');
    setRegConfirmPassword('');
  };

  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setPassword('');
  };

  // Login / Register Screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black p-4">
        <div className="w-full max-w-md bg-zinc-900/50 border-2 border-yellow-400/20 rounded-sm overflow-hidden relative flex flex-col justify-center backdrop-blur-sm">
          
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
            
            {/* Toggle Views */}
            {!isRegistering ? (
                // LOGIN FORM
                <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                
                {successMsg && (
                    <div className="p-3 bg-green-900/30 border border-green-500 text-green-400 text-sm font-bold font-mono text-center">
                        {successMsg}
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2 font-mono">Login</label>
                    <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-4 bg-black/40 text-white rounded-none border-b-2 border-zinc-600 focus:border-yellow-400 outline-none transition font-mono placeholder-zinc-600 text-lg"
                    placeholder="Seu usuário"
                    autoCapitalize="none"
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2 font-mono">Senha</label>
                    <div className="relative">
                        <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-4 bg-black/40 text-white rounded-none border-b-2 border-zinc-600 focus:border-yellow-400 outline-none transition font-mono placeholder-zinc-600 text-lg"
                        placeholder="Sua senha"
                        />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-900/30 border border-red-500 text-red-400 text-sm font-bold font-mono text-center animate-pulse">
                    {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full bg-purple-600 text-white font-graffiti text-3xl py-4 mt-4 hover:bg-purple-500 transition transform hover:-translate-y-1 active:translate-y-0 border-2 border-transparent hover:border-white shadow-xl"
                >
                    ENTRAR
                </button>

                <div className="pt-4 text-center border-t border-zinc-800 mt-4">
                    <button 
                        type="button" 
                        onClick={() => { setError(''); setIsRegistering(true); }}
                        className="text-zinc-500 hover:text-yellow-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mx-auto transition"
                    >
                        <Shield size={14} />
                        Criar conta Admin
                    </button>
                </div>
                </form>
            ) : (
                // REGISTER FORM
                <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-left-8 duration-300">
                    <div className="flex items-center gap-2 mb-4 text-yellow-400 border-b border-zinc-800 pb-2">
                        <Shield size={20} />
                        <span className="font-graffiti text-xl">Novo Chefe</span>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Nome Completo</label>
                        <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full px-3 py-3 bg-black/40 text-white border-b border-zinc-600 focus:border-yellow-400 outline-none font-mono"
                        placeholder="Ex: Carlos Admin"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Usuário de Acesso</label>
                        <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        className="w-full px-3 py-3 bg-black/40 text-white border-b border-zinc-600 focus:border-yellow-400 outline-none font-mono"
                        placeholder="Ex: carlos.adm"
                        autoCapitalize="none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Senha</label>
                            <input
                            type="password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full px-3 py-3 bg-black/40 text-white border-b border-zinc-600 focus:border-yellow-400 outline-none font-mono"
                            placeholder="***"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Confirmar</label>
                            <input
                            type="password"
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            className="w-full px-3 py-3 bg-black/40 text-white border-b border-zinc-600 focus:border-yellow-400 outline-none font-mono"
                            placeholder="***"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-2 bg-red-900/30 border border-red-500 text-red-400 text-xs font-bold font-mono text-center">
                        {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-yellow-500 text-black font-graffiti text-2xl py-3 hover:bg-yellow-400 transition shadow-lg mt-2"
                    >
                        CADASTRAR
                    </button>

                    <button 
                        type="button" 
                        onClick={() => { setError(''); setIsRegistering(false); }}
                        className="w-full text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mt-4"
                    >
                        <ArrowLeft size={14} />
                        Voltar para Login
                    </button>
                </form>
            )}

            {showInstallHint && !isRegistering && (
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
            
            {!isRegistering && (
                <div className="mt-8 text-center text-[10px] text-zinc-600 font-mono uppercase tracking-wide">
                    <p className="mb-2">Acesso Restrito &bull; v1.1.0</p>
                    <p>Admin Padrão: admin / 123</p>
                </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Role Routing
  if (user.role === UserRole.ADMIN) {
    return <AdminPanel user={user} onLogout={handleLogout} />;
  }

  return <MotoboyPanel user={user} onLogout={handleLogout} />;
};

export default App;