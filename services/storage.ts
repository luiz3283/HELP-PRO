
import { User, MileageLog } from '../types';

const USERS_KEY = 'motolog_users_v2'; // Changed key to avoid conflict with old password-protected data
const LOGS_KEY = 'motolog_logs';

export const storageService = {
  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  },

  // In this simplified version, we likely only have one user, but keeping array for compatibility
  getMainUser: (): User | null => {
    const users = storageService.getUsers();
    return users.length > 0 ? users[0] : null;
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
    } else {
      users.push(updatedUser);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  deleteUser: (userId: string): void => {
    const users = storageService.getUsers();
    const newUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
  },

  clearUsers: (): void => {
    localStorage.removeItem(USERS_KEY);
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
