
import { Procedure } from './types';

export const STANDARD_TIMES = ['08:00', '10:30', '13:30', '16:00', '18:00'];

export const generateFreeTimes = (): string[] => {
  const times: string[] = [];
  for (let hour = 7; hour <= 20; hour++) {
    const h = hour.toString().padStart(2, '0');
    times.push(`${h}:00`);
    if (hour < 20) {
      times.push(`${h}:30`);
    }
  }
  return times;
};

export const FREE_TIMES = generateFreeTimes();

export const DEFAULT_PROCEDURES: Procedure[] = [
  { name: 'Molde F1', duration: '2h', durabilityDays: 21 },
  { name: 'Banho de Gel', duration: '1h30', durabilityDays: 15 },
  { name: 'Blindagem', duration: '1h', durabilityDays: 15 },
  { name: 'Manicure Tradicional', duration: '1h', durabilityDays: 7 },
  { name: 'Pé Tradicional', duration: '1h', durabilityDays: 15 },
  { name: 'Pé Blindagem', duration: '1h', durabilityDays: 20 },
  { name: 'Manutenção', duration: '1h30', durabilityDays: 21 }
];

export const DEFAULT_SECONDARY_PROCEDURES: Procedure[] = [
  { name: 'Decoração', duration: '1h' },
  { name: 'Remoção', duration: '1h' },
  { name: 'Reparo Unitário', duration: '1h' }
];

export const DEFAULT_PARTNERS = [
  { name: 'Parceira 01', password: '123', login: 'parc01', commission: 50 },
  { name: 'Parceira 02', password: '123', login: 'parc02', commission: 50 },
  { name: 'Parceira 03', password: '123', login: 'parc03', commission: 50 },
  { name: 'Parceira 04', password: '123', login: 'parc04', commission: 50 },
  { name: 'Parceira 05', password: '123', login: 'parc05', commission: 50 }
];

export const PAYMENT_METHODS = ['Pix', 'Cartão', 'Dinheiro'];

export const MEI_LIMIT = 81000;

export interface ThemePalette {
  id: string;
  name: string;
  primary: string;
  hover: string;
}

export const COLOR_PALETTES: ThemePalette[] = [
  { id: 'gold', name: 'Dourado', primary: '#D4AF37', hover: '#B8860B' },
  { id: 'rose', name: 'Rose', primary: '#E0BFB8', hover: '#B76E79' },
  { id: 'silver', name: 'Prata', primary: '#A9A9A9', hover: '#808080' },
  { id: 'wine', name: 'Vinho', primary: '#722F37', hover: '#5E1914' },
  { id: 'emerald', name: 'Verde', primary: '#10b981', hover: '#059669' },
  { id: 'custom', name: 'Sua Cor', primary: '#6366f1', hover: '#4f46e5' }
];
