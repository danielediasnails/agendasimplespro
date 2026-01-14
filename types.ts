
export interface Client {
  name: string;
  whatsapp: string;
  lastVisitDate: string; // ISO string
}

export type PaymentMethod = 'Pix' | 'Cartão' | 'Dinheiro';

export interface Partner {
  name: string;
  password: string;
  login: string; // generated from name
  commission: number; // Porcentagem de ganho (10 a 100)
}

export interface Procedure {
  name: string;
  duration: string; // em minutos, ex: "60"
  durabilityDays?: number; // Durabilidade em dias para controle de retorno
}

export interface Appointment {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  clientName: string;
  whatsapp: string;
  time: string;
  procedure: string;
  secondaryProcedure?: string;
  secondaryTime?: string;
  deposit: number;
  totalValue: number;
  paymentMethod: PaymentMethod;
  createdAt: number;
  partnerName?: string; // Nome da parceira responsável
}

export interface Expense {
  id: string;
  name: string;
  value: number;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export enum TimeMode {
  STANDARD = 'STANDARD',
  FREE = 'FREE',
  CUSTOM = 'CUSTOM'
}

export interface SummaryData {
  totalClientsMonth: number;
  totalRevenueMonth: number;
}
