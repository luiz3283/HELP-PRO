import { User, UserRole, MileageLog } from '../types';

const USERS_KEY = 'motolog_users';
const LOGS_KEY = 'motolog_logs';

// Initial Mock Data
const INITIAL_ADMIN: User = {
  id: 'admin-1',
  name: 'Administrador Geral',
  username: 'admin',
  password: '123',
  vehiclePlate: '',
  role: UserRole.ADMIN,
};

const INITIAL_MOTOBOY: User = {
  id: 'moto-1',
  name: 'João da Silva',
  username: 'joao',
  password: '123',
  vehiclePlate: 'ABC-1234',
  vehicleModel: 'Honda CG 160 Fan',
  clientName: 'Farmácia Central',
  role: UserRole.MOTOBOY,
};

// Initialize Storage if empty
const initStorage = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([INITIAL_ADMIN, INITIAL_MOTOBOY]));
  }
  if (!localStorage.getItem(LOGS_KEY)) {
    localStorage.setItem(LOGS_KEY, JSON.stringify([]));
  }
};

initStorage();

export const storageService = {
  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  },

  addUser: (user: User): void => {
    const users = storageService.getUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  updateUser: (updatedUser: User): void => {
    const users = storageService.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  },

  deleteUser: (userId: string): void => {
    const users = storageService.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getLogs: (): MileageLog[] => {
    return JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
  },

  saveLog: (log: MileageLog): void => {
    const logs = storageService.getLogs();
    const existingIndex = logs.findIndex(l => l.id === log.id);
    
    if (existingIndex >= 0) {
      logs[existingIndex] = log;
    } else {
      logs.push(log);
    }
    
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  },

  findOpenLog: (userId: string, date: string): MileageLog | undefined => {
    const logs = storageService.getLogs();
    return logs.find(l => l.userId === userId && l.date === date);
  }
};