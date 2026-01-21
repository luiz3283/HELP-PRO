import React, { useState, useEffect } from 'react';
import { User, MileageLog, UserRole } from '../types';
import { storageService } from '../services/storage';
import { Users, FileText, Download, LogOut, Plus, Trash2, Search, MapPin, Zap, Calendar, Briefcase, Filter, X, Pencil, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface Props {
  user: User;
  onLogout: () => void;
}

export const AdminPanel: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'users'>('logs');
  const [logs, setLogs] = useState<MileageLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Notification State
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterUser, setFilterUser] = useState('');
  
  // State for monthly export (Users tab)
  const [exportMonth, setExportMonth] = useState(format(new Date(), 'yyyy-MM'));

  // User Form State
  const [formData, setFormData] = useState({ 
    name: '', 
    username: '', 
    password: '', 
    vehiclePlate: '', 
    vehicleModel: '', 
    clientName: '' 
  });

  useEffect(() => {
    refreshData();
  }, []);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  };

  const refreshData = () => {
    setLogs(storageService.getLogs().reverse()); // Newest first
    setUsers(storageService.getUsers());
  };

  const handleOpenNewUserModal = () => {
    setFormData({ name: '', username: '', password: '', vehiclePlate: '', vehicleModel: '', clientName: '' });
    setEditingUserId(null);
    setShowUserModal(true);
  };

  const handleOpenEditUserModal = (targetUser: User) => {
    setFormData({
        name: targetUser.name,
        username: targetUser.username,
        password: targetUser.password || '',
        vehiclePlate: targetUser.vehiclePlate,
        vehicleModel: targetUser.vehicleModel || '',
        clientName: targetUser.clientName || ''
    });
    setEditingUserId(targetUser.id);
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password) return;

    if (editingUserId) {
        // Update Existing
        const updatedUser: User = {
            id: editingUserId,
            name: formData.name,
            username: formData.username,
            password: formData.password,
            vehiclePlate: formData.vehiclePlate,
            vehicleModel: formData.vehicleModel,
            clientName: formData.clientName,
            role: UserRole.MOTOBOY
        };
        storageService.updateUser(updatedUser);
        showToast('success', 'Colaborador atualizado com sucesso!');
    } else {
        // Create New
        const u: User = {
            id: crypto.randomUUID(),
            name: formData.name,
            username: formData.username,
            password: formData.password,
            vehiclePlate: formData.vehiclePlate,
            vehicleModel: formData.vehicleModel,
            clientName: formData.clientName,
            role: UserRole.MOTOBOY
        };
        storageService.addUser(u);
        showToast('success', 'Colaborador cadastrado!');
    }

    setFormData({ name: '', username: '', password: '', vehiclePlate: '', vehicleModel: '', clientName: '' });
    setShowUserModal(false);
    setEditingUserId(null);
    refreshData();
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este colaborador?')) {
        storageService.deleteUser(id);
        refreshData();
        showToast('success', 'Colaborador removido.');
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.date.includes(searchTerm);
    const matchesDate = filterDate ? log.date === filterDate : true;
    const matchesMonth = filterMonth ? log.date.startsWith(filterMonth) : true;
    const matchesUser = filterUser ? log.userId === filterUser : true;

    return matchesSearch && matchesDate && matchesMonth && matchesUser;
  });

  const exportGeneralToExcel = () => {
    const logsToExport = filteredLogs;

    const data: any[] = logsToExport.map(log => ({
      Data: log.date,
      Colaborador: log.userName,
      'KM Inicial': log.startKm,
      'Hora Inicial': log.startTime ? format(new Date(log.startTime), 'HH:mm') : '-',
      'Local Inicial': log.startLocation || '-',
      'KM Final': log.endKm || '-',
      'Hora Final': log.endTime ? format(new Date(log.endTime), 'HH:mm') : '-',
      'Local Final': log.endLocation || '-',
      'KM Total': (log.endKm && log.startKm) ? (log.endKm - log.startKm).toFixed(1) : '-',
      Status: log.status === 'CLOSED' ? 'Fechado' : 'Aberto'
    }));

    const totalKmGeneral = logsToExport.reduce((acc, log) => {
        if (log.endKm && log.startKm) {
            return acc + (log.endKm - log.startKm);
        }
        return acc;
    }, 0);

    data.push({
        Data: 'TOTAL GERAL',
        Colaborador: '',
        'KM Inicial': '',
        'Hora Inicial': '',
        'Local Inicial': '',
        'KM Final': '',
        'Hora Final': '',
        'Local Final': 'SOMA TOTAL:',
        'KM Total': totalKmGeneral.toFixed(1),
        Status: ''
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registros");
    XLSX.writeFile(wb, `help-pro-geral-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    showToast('success', 'Planilha Geral gerada!');
  };

  const exportUserMonthlyReport = (targetUser: User) => {
    const userLogs = logs.filter(l => 
        l.userId === targetUser.id && 
        l.date.startsWith(exportMonth)
    ).sort((a, b) => a.date.localeCompare(b.date));

    if (userLogs.length === 0) {
        showToast('error', `Sem registros para ${targetUser.name} em ${exportMonth}.`);
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
    XLSX.utils.book_append_sheet(wb, ws, "Relatorio Mensal");
    
    const fileName = `Relatorio-${targetUser.name.replace(/\s+/g, '_')}-${exportMonth}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast('success', 'Relatório Individual gerado!');
  };

  const clearFilters = () => {
      setSearchTerm('');
      setFilterDate('');
      setFilterMonth('');
      setFilterUser('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-200 relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded shadow-2xl border transition-all animate-in slide-in-from-top-5 fade-in duration-300 ${notification.type === 'success' ? 'bg-zinc-900 border-green-500 text-green-400' : 'bg-zinc-900 border-red-500 text-red-400'}`}>
            {notification.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
            <span className="font-bold font-mono uppercase text-sm">{notification.message}</span>
        </div>
      )}

      {/* Top Nav */}
      <nav className="bg-zinc-900 border-b border-zinc-800 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="bg-yellow-400 p-2 transform -rotate-3 border border-black">
                <Zap className="text-black w-6 h-6 fill-black" />
            </div>
            <div>
                <h1 className="font-graffiti text-2xl text-white tracking-wide">Help <span className="text-yellow-400">Pro</span></h1>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-zinc-500 uppercase">Admin: {user.name}</span>
            <button onClick={onLogout} className="text-zinc-500 hover:text-red-500 transition">
                <LogOut size={20} />
            </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-black/50 border-r border-zinc-800 flex flex-col hidden md:flex">
            <button 
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-3 px-6 py-6 border-l-4 transition-all ${activeTab === 'logs' ? 'border-yellow-400 bg-zinc-900 text-yellow-400 font-bold' : 'border-transparent text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
            >
                <FileText size={20} />
                <span className="uppercase tracking-wider text-sm">Registros</span>
            </button>
            <button 
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-3 px-6 py-6 border-l-4 transition-all ${activeTab === 'users' ? 'border-purple-500 bg-zinc-900 text-purple-400 font-bold' : 'border-transparent text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
            >
                <Users size={20} />
                <span className="uppercase tracking-wider text-sm">Equipe</span>
            </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-zinc-950/50">
            
            {activeTab === 'logs' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <h2 className="text-3xl font-graffiti text-zinc-100">Controle da Rua</h2>
                        <div className="flex gap-2">
                             {(filterDate || filterMonth || filterUser || searchTerm) && (
                                <button onClick={clearFilters} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-4 py-2 text-xs font-bold uppercase border border-zinc-700">
                                    <X size={14} /> Limpar Filtros
                                </button>
                             )}
                            <button onClick={exportGeneralToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-black font-bold px-4 py-2 shadow-lg transition uppercase text-sm">
                                <Download size={18} />
                                Baixar Geral
                            </button>
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                            {/* Month Filter */}
                            <div className="relative">
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Mês</label>
                                <div className="relative cursor-pointer" onClick={() => {
                                    const el = document.getElementById('filter-month-input') as HTMLInputElement;
                                    if(el) el.showPicker();
                                }}>
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
                                    <input 
                                        id="filter-month-input"
                                        type="month" 
                                        value={filterMonth}
                                        onChange={(e) => setFilterMonth(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-black border border-zinc-700 text-white focus:border-yellow-400 outline-none text-sm font-mono uppercase cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Date Filter */}
                            <div className="relative">
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Data Específica</label>
                                <div className="relative cursor-pointer" onClick={() => {
                                    const el = document.getElementById('filter-date-input') as HTMLInputElement;
                                    if(el) el.showPicker();
                                }}>
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
                                    <input 
                                        id="filter-date-input"
                                        type="date" 
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-black border border-zinc-700 text-white focus:border-yellow-400 outline-none text-sm font-mono uppercase cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* User Filter */}
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Colaborador</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
                                    <select
                                        value={filterUser}
                                        onChange={(e) => setFilterUser(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-black border border-zinc-700 text-white focus:border-yellow-400 outline-none text-sm font-mono uppercase appearance-none cursor-pointer"
                                    >
                                        <option value="">Todos os Pilotos</option>
                                        {users.filter(u => u.role === UserRole.MOTOBOY).map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.vehiclePlate})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l border-zinc-800 pl-2">
                                        <Filter size={12} className="text-zinc-600" />
                                    </div>
                                </div>
                            </div>

                             {/* Search Text Filter */}
                             <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Busca Geral</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                                    <input 
                                        type="text" 
                                        placeholder="BUSCAR TEXTO..."
                                        className="w-full pl-10 pr-4 py-2 bg-black border border-zinc-700 text-white focus:border-yellow-400 outline-none placeholder-zinc-700 font-mono uppercase text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
                        {/* Wrapper for horizontal scroll on smaller screens */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="bg-black text-zinc-500 text-xs uppercase font-mono tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Piloto</th>
                                        <th className="px-6 py-4">Início</th>
                                        <th className="px-6 py-4">Fim</th>
                                        <th className="px-6 py-4">Total</th>
                                        <th className="px-6 py-4">Provas</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800 text-sm">
                                    {filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-zinc-600 font-graffiti text-xl">Nenhum registro encontrado com os filtros atuais.</td>
                                        </tr>
                                    ) : filteredLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-zinc-800 transition group">
                                            <td className="px-6 py-4 font-mono text-zinc-400">{log.date}</td>
                                            <td className="px-6 py-4 font-bold text-white uppercase">{log.userName}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-zinc-300">{log.startKm}</div>
                                                <div className="text-[10px] text-zinc-600 font-mono flex flex-col gap-1 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        {log.startTime ? format(new Date(log.startTime), 'HH:mm') : '-'}
                                                    </span>
                                                    {log.startLocation && (
                                                        <span className="flex items-start gap-1 text-yellow-600 max-w-[150px] leading-tight" title={log.startLocation}>
                                                            <MapPin size={10} className="shrink-0 mt-0.5"/>
                                                            <span className="truncate">{log.startLocation}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-zinc-300">{log.endKm || '-'}</div>
                                                <div className="text-[10px] text-zinc-600 font-mono flex flex-col gap-1 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        {log.endTime ? format(new Date(log.endTime), 'HH:mm') : '-'}
                                                    </span>
                                                    {log.endLocation && (
                                                        <span className="flex items-start gap-1 text-yellow-600 max-w-[150px] leading-tight" title={log.endLocation}>
                                                            <MapPin size={10} className="shrink-0 mt-0.5"/>
                                                            <span className="truncate">{log.endLocation}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-yellow-400">
                                                {(log.endKm && log.startKm) ? (log.endKm - log.startKm).toFixed(1) + ' km' : '-'}
                                            </td>
                                            <td className="px-6 py-4 flex gap-2">
                                                {log.startPhoto && (
                                                    <a href={log.startPhoto} download={`start-${log.id}.jpg`} className="w-8 h-8 bg-zinc-800 border border-zinc-600 hover:border-yellow-400 hover:scale-150 transition-transform z-0 hover:z-10">
                                                        <img src={log.startPhoto} className="w-full h-full object-cover" alt="Start" />
                                                    </a>
                                                )}
                                                {log.endPhoto && (
                                                    <a href={log.endPhoto} download={`end-${log.id}.jpg`} className="w-8 h-8 bg-zinc-800 border border-zinc-600 hover:border-yellow-400 hover:scale-150 transition-transform z-0 hover:z-10">
                                                        <img src={log.endPhoto} className="w-full h-full object-cover" alt="End" />
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest border ${log.status === 'CLOSED' ? 'border-green-800 text-green-500 bg-green-900/10' : 'border-yellow-800 text-yellow-500 bg-yellow-900/10'}`}>
                                                    {log.status === 'CLOSED' ? 'FECHADO' : 'ABERTO'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-end gap-4">
                        <div className="flex-1">
                            <h2 className="text-3xl font-graffiti text-zinc-100">Equipe</h2>
                            <p className="text-zinc-500 text-xs mt-1">Gerenciamento por Cliente e Relatórios</p>
                        </div>
                        
                        {/* Month Selector for Export */}
                        <div className="flex items-center gap-2 bg-zinc-900 p-2 border border-zinc-800 cursor-pointer" onClick={() => {
                             const el = document.getElementById('export-month-input') as HTMLInputElement;
                             if(el) el.showPicker();
                        }}>
                            <Calendar size={18} className="text-yellow-400"/>
                            <input 
                                id="export-month-input"
                                type="month" 
                                value={exportMonth}
                                onChange={(e) => setExportMonth(e.target.value)}
                                className="bg-transparent text-white font-mono uppercase outline-none text-sm cursor-pointer"
                            />
                        </div>

                        <button onClick={handleOpenNewUserModal} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-3 shadow-lg transition uppercase text-sm">
                            <Plus size={18} />
                            Novo Piloto
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.filter(u => u.role === UserRole.MOTOBOY).map(u => (
                            <div key={u.id} className="bg-zinc-900 border-b-4 border-purple-600 shadow-sm flex flex-col">
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-zinc-800 rounded-none flex items-center justify-center text-purple-500 font-graffiti text-2xl border border-zinc-700">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div className="text-right">
                                            <div className="inline-block bg-yellow-400 text-black px-2 py-0.5 text-xs font-mono font-bold transform -rotate-1 mb-1">
                                                {u.vehiclePlate || 'SEM PLACA'}
                                            </div>
                                            {u.vehicleModel && <div className="text-[10px] text-zinc-500 font-mono uppercase">{u.vehicleModel}</div>}
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg text-white uppercase tracking-tight">{u.name}</h3>
                                    <p className="text-sm text-zinc-500 mb-3 font-mono">@{u.username}</p>
                                    
                                    {u.clientName && (
                                        <div className="flex items-center gap-2 text-zinc-300 text-xs bg-zinc-800 p-2 border border-zinc-700">
                                            <Briefcase size={12} className="text-purple-400" />
                                            <span className="uppercase font-bold tracking-wide">{u.clientName}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="bg-black/20 p-4 border-t border-zinc-800 flex justify-between items-center gap-2">
                                    <button 
                                        onClick={() => exportUserMonthlyReport(u)}
                                        className="text-[10px] font-bold text-green-500 hover:text-green-400 uppercase flex items-center gap-1 transition mr-auto"
                                        title={`Baixar relatório de ${exportMonth}`}
                                    >
                                        <Download size={14} />
                                        Relatório
                                    </button>

                                    <button 
                                        onClick={() => handleOpenEditUserModal(u)}
                                        className="text-zinc-600 hover:text-yellow-400 transition"
                                        title="Editar informações"
                                    >
                                        <Pencil size={18} />
                                    </button>

                                    <button 
                                        onClick={() => handleDeleteUser(u.id)} 
                                        className="text-zinc-600 hover:text-red-500 transition"
                                        title="Remover usuário"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
      </div>

      {/* Modal for New/Edit User */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 border-2 border-zinc-700 max-w-md w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-graffiti text-white mb-6">{editingUserId ? 'Editar Piloto' : 'Novo Piloto'}</h3>
                <form onSubmit={handleSaveUser} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Nome Completo</label>
                        <input required type="text" className="w-full bg-black border border-zinc-700 text-white p-3 focus:border-purple-500 outline-none placeholder-zinc-700 font-mono" 
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Usuário</label>
                            <input required type="text" className="w-full bg-black border border-zinc-700 text-white p-3 focus:border-purple-500 outline-none placeholder-zinc-700 font-mono" 
                                value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Senha</label>
                            <input required type="text" className="w-full bg-black border border-zinc-700 text-white p-3 focus:border-purple-500 outline-none placeholder-zinc-700 font-mono" 
                                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Cliente / Empresa Atendida</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                            <input type="text" placeholder="Ex: Farmácia X, iFood, Loggi" className="w-full pl-10 pr-3 py-3 bg-black border border-zinc-700 text-white focus:border-purple-500 outline-none placeholder-zinc-700 font-mono uppercase" 
                                value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Modelo da Moto</label>
                            <input type="text" placeholder="Ex: CG 160" className="w-full bg-black border border-zinc-700 text-white p-3 focus:border-purple-500 outline-none placeholder-zinc-700 font-mono uppercase" 
                                value={formData.vehicleModel} onChange={e => setFormData({...formData, vehicleModel: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Placa</label>
                            <input required type="text" placeholder="ABC-1234" className="w-full bg-black border border-zinc-700 text-white p-3 focus:border-purple-500 outline-none uppercase font-mono" 
                                value={formData.vehiclePlate} onChange={e => setFormData({...formData, vehiclePlate: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-3 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-700 font-bold uppercase text-sm">Cancelar</button>
                        <button type="submit" className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase text-sm shadow-lg">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};