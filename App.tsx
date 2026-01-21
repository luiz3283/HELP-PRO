import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { storageService } from './services/storage';
import { MotoboyPanel } from './components/MotoboyPanel';
import { AdminPanel } from './components/AdminPanel';
import { Zap, Lock, Download } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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

  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setPassword('');
  };

  // Login Screen
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
            <form onSubmit={handleLogin} className="space-y-6">
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
            </form>

            {showInstallHint && (
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

            <div className="mt-8 text-center text-[10px] text-zinc-600 font-mono uppercase tracking-wide">
                <p className="mb-2">Acesso Restrito &bull; v1.0.1</p>
                <p>Admin: admin / 123</p>
                <p>Motoboy: joao / 123</p>
            </div>
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