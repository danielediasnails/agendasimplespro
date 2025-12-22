
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

export const DEFAULT_PROCEDURES = [
  'Molde F1',
  'Banho de Gel',
  'Blindagem',
  'Manicure Tradicional',
  'Pé Tradicional',
  'Pé Blindagem',
  'Manutenção'
];

export const DEFAULT_SECONDARY_PROCEDURES = [
  'Molde F1',
  'Banho de Gel',
  'Blindagem',
  'Manicure Tradicional',
  'Pé Tradicional',
  'Pé Blindagem',
  'Manutenção'
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
  { id: 'gold', name: 'Dourado Real', primary: '#D4AF37', hover: '#B8860B' },
  { id: 'rose', name: 'Rose Gold', primary: '#E0BFB8', hover: '#B76E79' },
  { id: 'silver', name: 'Prata Elegante', primary: '#A9A9A9', hover: '#808080' },
  { id: 'wine', name: 'Vinho Chic', primary: '#722F37', hover: '#5E1914' },
  { id: 'emerald', name: 'Esmeralda Luxo', primary: '#10b981', hover: '#059669' },
  { id: 'custom', name: 'Personalizada', primary: '#6366f1', hover: '#4f46e5' }
];
