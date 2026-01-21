
export enum UserRole {
  ADMIN = 'ADMIN',
  MOTOBOY = 'MOTOBOY'
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  vehiclePlate: string;
  vehicleModel?: string; // Motorcycle Model (e.g., CG 160)
  clientName?: string;   // Client the motoboy is assigned to
}

export interface MileageLog {
  id: string;
  userId: string;
  userName: string;
  date: string; // ISO Date string YYYY-MM-DD
  
  startKm: number | null;
  startTime: string | null; // ISO Timestamp
  startPhoto: string | null; // Base64
  startLocation: string | null;

  endKm: number | null;
  endTime: string | null; // ISO Timestamp
  endPhoto: string | null; // Base64
  endLocation: string | null;

  status: 'OPEN' | 'CLOSED';
}

export interface DashboardStats {
  totalKm: number;
  activeDrivers: number;
  logsToday: number;
}
