
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Calendar as CalendarIcon, Users, ChevronLeft, ChevronRight,
  Settings, Clock, X, Palette, MessageCircle, CheckCircle2, Share2, TrendingUp,
  CalendarDays, Loader2, LogOut, Briefcase, 
  Edit2, Search, List, Menu, BarChart3, 
  Scissors, Sparkles, Flower2, Crown, Heart, Fingerprint, Star, Brush, Gem, Smile,
  Coffee, Zap, Paintbrush, Hand, Eye, Droplets, Feather, Wand2, SprayCan, Diamond,
  Clover, Infinity, Waves, Shapes, PersonStanding, Footprints, Dna, Award,
  User, UserRound, Contact, SmilePlus, Lock, KeyRound, ArrowRight, Trash2, ChevronDown, ChevronUp,
  UserSearch, Sparkle, Pipette, Upload, Save, Receipt, Wallet, CalendarRange, Target, ShieldCheck,
  TrendingDown, Calendar as LucideCalendar, Hash, LayoutGrid, Banknote, Phone, History as HistoryIcon, UserPlus, HardHat, Key,
  AlertCircle, TrendingUp as TrendingUpIcon, Percent, AlertTriangle, Pipette as PipetteIcon
} from 'lucide-react';
import { Appointment, Client, PaymentMethod, Partner } from './types';
import { DEFAULT_PROCEDURES, DEFAULT_SECONDARY_PROCEDURES, COLOR_PALETTES, ThemePalette, MEI_LIMIT, DEFAULT_PARTNERS } from './constants';
import SummaryCard from './components/SummaryCard';
import AppointmentForm from './components/AppointmentForm';
import AgendaItem from './components/AgendaItem';
import ShareModal from './components/ShareModal';

type AppearanceMode = 'light' | 'dark' | 'system';
type UserRole = 'master' | 'partner';

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  username: string | null;
}

const BEAUTY_ICONS: Record<string, React.ReactNode> = {
  'calendar': <CalendarIcon />,
  'sparkles': <Sparkles />, 
  'gem': <Gem />, 
  'diamond': <Diamond />, 
  'crown': <Crown />, 
  'flower': <Flower2 />, 
  'hand': <Hand />,
  'paintbrush': <Paintbrush />, 'heart': <Heart />, 'star': <Star />, 'feather': <Feather />, 
  'eye': <Eye />, 'wand': <Wand2 />, 'brush': <Brush />, 'scissors': <Scissors />, 
  'spray': <SprayCan />, 'pipette': <Pipette />, 'droplets': <Droplets />, 
  'clover': <Clover />, 'award': <Award />, 'smile': <Smile />, 'zap': <Zap />, 'palette': <Palette />
};

const BRAND_ICON_OPTIONS: string[] = [
  'calendar', 'sparkles', 'gem', 'diamond', 'crown', 'flower', 'hand',
  'paintbrush', 'heart', 'star', 'feather', 'eye', 'wand',
  'brush', 'scissors', 'spray', 'pipette', 'droplets', 'clover',
  'award', 'smile'
];

const normalizeForLogin = (name: string) => {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
};

// --- SISTEMA DE PERSISTÊNCIA FIREBASE ---
const FIREBASE_URL = "https://agenda-simples-pro-default-rtdb.firebaseio.com";

const executeFirebaseCall = async (fnName: string, args: any[], handler?: Function, failureHandler?: Function) => {
  try {
    let result: any = null;
    const getUrl = (path: string) => `${FIREBASE_URL}/${path}.json`;

    if (fnName === 'getUserData') {
      const response = await fetch(getUrl('v1'));
      const data = await response.json() || {};
      
      const appointments = data.appointments ? Object.values(data.appointments) : [];
      const clients = data.clients ? Object.values(data.clients) : [];
      const settings = data.settings || {
        studioName: "Daniele Dias Nails",
        studioSubtitle: "Studio Nails",
        studioIcon: "calendar",
        themeMode: "light",
        themeId: "gold",
        customColor: "#D4AF37",
        annualLimit: String(MEI_LIMIT),
        procedures: DEFAULT_PROCEDURES.join(','),
        secondaryProcedures: DEFAULT_SECONDARY_PROCEDURES.join(','),
        partners: JSON.stringify(DEFAULT_PARTNERS)
      };

      result = {
        appointments,
        clients,
        userEmail: 'equipe@danielediasnails.com',
        settings
      };
    } else if (fnName === 'saveAppointment') {
      const app = args[0];
      const id = app.id || Math.random().toString(36).substr(2, 9);
      const newApp = { ...app, id, createdAt: app.createdAt || Date.now() };
      await fetch(getUrl(`v1/appointments/${id}`), {
        method: 'PUT',
        body: JSON.stringify(newApp)
      });
      result = newApp;
    } else if (fnName === 'deleteAppointment') {
      const id = args[0];
      await fetch(getUrl(`v1/appointments/${id}`), { method: 'DELETE' });
      result = true;
    } else if (fnName === 'updateUserSettings') {
      await fetch(getUrl('v1/settings'), {
        method: 'PATCH',
        body: JSON.stringify(args[0])
      });
      result = true;
    } else if (fnName === 'bulkSaveClients') {
      const newOnes = args[0];
      const updates: any = {};
      newOnes.forEach((c: any) => {
        const safeName = c.name.replace(/[.#$[\]/]/g, '_');
        updates[safeName] = c;
      });
      await fetch(getUrl('v1/clients'), {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      result = true;
    } else if (fnName === 'deleteClient') {
      const name = args[0].replace(/[.#$[\]/]/g, '_');
      await fetch(getUrl(`v1/clients/${name}`), { method: 'DELETE' });
      result = true;
    } else if (fnName === 'updateClient') {
      const oldName = args[0].replace(/[.#$[\]/]/g, '_');
      const newData = args[1];
      await fetch(getUrl(`v1/clients/${oldName}`), {
        method: 'PATCH',
        body: JSON.stringify(newData)
      });
      result = true;
    }
    
    if (handler) handler(result);
  } catch (e) {
    console.error("Erro Firebase:", e);
    if (failureHandler) failureHandler(e);
  }
};

const createFirebaseChain = (handler?: Function, failureHandler?: Function) => {
  const chain: any = {
    withSuccessHandler: (h: Function) => createFirebaseChain(h, failureHandler),
    withFailureHandler: (f: Function) => createFirebaseChain(handler, f),
  };
  const functions = ['getUserData', 'saveAppointment', 'deleteAppointment', 'updateUserSettings', 'deleteClient', 'updateClient', 'bulkSaveClients'];
  functions.forEach(fn => { 
    chain[fn] = (...args: any[]) => executeFirebaseCall(fn, args, handler, failureHandler); 
  });
  return chain;
};

// Sobrescreve o objeto google.script.run para usar Firebase
(window as any).google = { script: { run: createFirebaseChain() } };
declare var google: any;

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEKS = ['Todo', 'S1', 'S2', 'S3', 'S4', 'S5'];
const DAYS_OF_MONTH = ['Todo', ...Array.from({ length: 31 }, (_, i) => (i + 1).toString())];
const DAYS_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const YEARS = Array.from({ length: 2100 - 2025 + 1 }, (_, i) => 2025 + i);

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('studio_auth_data');
    return saved ? JSON.parse(saved) : { isAuthenticated: false, role: null, username: null };
  });

  const [loginUser, setLoginUser] = useState('danielediasnails');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [studioName, setStudioName] = useState('Daniele Dias Nails');
  const [studioSubtitle, setStudioSubtitle] = useState('Studio Nails');
  const [studioIcon, setStudioIcon] = useState('calendar');
  const [themeMode, setThemeMode] = useState<AppearanceMode>('light');
  const [customColor, setCustomColor] = useState('#D4AF37');
  const [annualLimit, setAnnualLimit] = useState(MEI_LIMIT);
  const [userTimes, setUserTimes] = useState<string[]>([]);
  const [currentTheme, setCurrentTheme] = useState<ThemePalette>(COLOR_PALETTES[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  
  const [procedures, setProcedures] = useState<string[]>(DEFAULT_PROCEDURES);
  const [secondaryProcedures, setSecondaryProcedures] = useState<string[]>(DEFAULT_SECONDARY_PROCEDURES);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isClientsOpen, setIsClientsOpen] = useState(false);
  const [isProceduresOpen, setIsProceduresOpen] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isPartnersOpen, setIsPartnersOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isIconsExpanded, setIsIconsExpanded] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [sharingAppointment, setSharingAppointment] = useState<Appointment | null>(null);
  const [isManualShare, setIsManualShare] = useState(false);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [editLimitValue, setEditLimitValue] = useState('');
  const [financeYear, setFinanceYear] = useState(new Date().getFullYear());
  const [financeMonth, setFinanceMonth] = useState(new Date().getMonth());
  const [financeWeek, setFinanceWeek] = useState(0); 
  const [financeDay, setFinanceDay] = useState(0); 
  const [clientSearch, setClientSearch] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [editingClientName, setEditingClientName] = useState<string | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [newProcName, setNewProcName] = useState('');
  const [newSecProcName, setNewSecProcName] = useState('');
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerPass, setNewPartnerPass] = useState('');
  const [newPartnerCommission, setNewPartnerCommission] = useState(50);
  const [editingPartnerIndex, setEditingPartnerIndex] = useState<number | null>(null);
  const [editPartnerName, setEditPartnerName] = useState('');
  const [editPartnerPass, setEditPartnerPass] = useState('');
  const [editPartnerCommission, setEditPartnerCommission] = useState(50);
  const [historyPartnerFilter, setHistoryPartnerFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    let newAuth: AuthState | null = null;
    if (loginUser === 'danielediasnails' && loginPass === '@Jsloks147@') {
      newAuth = { isAuthenticated: true, role: 'master', username: 'Daniele Dias' };
    } else {
      const foundPartner = partners.find(p => p.login === loginUser && p.password === loginPass);
      if (foundPartner) newAuth = { isAuthenticated: true, role: 'partner', username: foundPartner.name };
    }
    if (newAuth) {
      setAuth(newAuth);
      localStorage.setItem('studio_auth_data', JSON.stringify(newAuth));
      setLoginError(false);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studio_auth_data');
    setAuth({ isAuthenticated: false, role: null, username: null });
    setLoginUser('danielediasnails');
    setLoginPass('');
    setIsMenuOpen(false);
  };

  const darkenColor = (hex: string) => {
    try {
      let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      r = Math.max(0, r - 40); g = Math.max(0, g - 40); b = Math.max(0, b - 40);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (e) { return hex; }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');

    const primary = currentTheme.id === 'custom' ? customColor : currentTheme.primary;
    const hover = currentTheme.id === 'custom' ? darkenColor(customColor) : currentTheme.hover;

    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--primary-hover', hover);
  }, [themeMode, currentTheme, customColor]);

  useEffect(() => {
    google.script.run
      .withSuccessHandler((data: any) => {
        if (data && !data.error) {
          if (data.settings) {
            setStudioName(data.settings.studioName || 'Daniele Dias Nails');
            setStudioSubtitle(data.settings.studioSubtitle || 'Studio Nails');
            setStudioIcon(data.settings.studioIcon || 'calendar');
            setThemeMode((data.settings.themeMode as AppearanceMode) || 'light');
            setCustomColor(data.settings.customColor || '#D4AF37');
            setAnnualLimit(Number(data.settings.annualLimit) || MEI_LIMIT);
            if (data.settings.userTimes) {
              const utValue = data.settings.userTimes;
              const utStr = typeof utValue === 'string' ? utValue : utValue.join(',');
              setUserTimes(utStr.split(',').filter(Boolean));
            }
            if (data.settings.procedures) setProcedures(data.settings.procedures.split(',').filter(Boolean));
            if (data.settings.secondaryProcedures) setSecondaryProcedures(data.settings.secondaryProcedures.split(',').filter(Boolean));
            if (data.settings.partners) {
              const pts = typeof data.settings.partners === 'string' ? JSON.parse(data.settings.partners) : data.settings.partners;
              setPartners(pts);
            } else {
              setPartners(DEFAULT_PARTNERS);
            }
            const theme = COLOR_PALETTES.find(t => t.id === data.settings.themeId);
            if (theme) setCurrentTheme(theme);
          }
          if (auth.isAuthenticated) {
            setAppointments(data.appointments || []);
            setClients(data.clients || []);
            setUserEmail(data.userEmail);
          }
        }
        setLoading(false);
      })
      .getUserData();
  }, [auth.isAuthenticated]);

  const filteredAppointments = useMemo(() => {
    let base = appointments;
    if (auth.role === 'partner') base = base.filter(app => app.partnerName === auth.username);
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      return base.filter(app => (app.clientName && app.clientName.toLowerCase().includes(q)) || (app.whatsapp && app.whatsapp.includes(q)) || (app.procedure && app.procedure.toLowerCase().includes(q)))
        .sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time));
    }
    return base.filter(app => app.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate, searchQuery, auth]);

  const currentPartnerCommission = useMemo(() => {
    if (auth.role === 'partner' && auth.username) {
      const p = partners.find(p => p.name === auth.username);
      return p?.commission || 50;
    }
    return 100;
  }, [auth, partners]);

  const groupedHistory = useMemo<Record<string, Appointment[]>>(() => {
    let base = appointments.slice().sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
    if (historyPartnerFilter !== 'all') base = base.filter(app => app.partnerName === historyPartnerFilter);
    
    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase().trim();
      base = base.filter(app => 
        (app.clientName && app.clientName.toLowerCase().includes(q)) || 
        (app.procedure && app.procedure.toLowerCase().includes(q)) ||
        (app.whatsapp && app.whatsapp.includes(q))
      );
    }

    const groups: Record<string, Appointment[]> = {};
    base.forEach(app => {
      if (!groups[app.date]) groups[app.date] = [];
      groups[app.date].push(app);
    });
    const sortedGroups: Record<string, Appointment[]> = {};
    Object.keys(groups).sort((a, b) => b.localeCompare(a)).forEach(key => { sortedGroups[key] = groups[key]; });
    return sortedGroups;
  }, [appointments, historyPartnerFilter, historySearchQuery]);

  const calculateTotal = (apps: Appointment[], commission: number = 100) => {
    return apps.reduce((sum, app) => {
      const val = (Number(app.totalValue || 0) + Number(app.deposit || 0));
      return sum + (val * (commission / 100));
    }, 0);
  };

  const getWeekOfMonth = (date: Date) => Math.ceil(date.getDate() / 7);

  const filterSummaryData = (apps: Appointment[], day: number, week: number, month: number, year: number) => {
    return apps.filter(app => {
      const d = new Date(app.date + 'T12:00:00');
      if (d.getFullYear() !== year || d.getMonth() !== month) return false;
      if (day !== 0) return d.getDate() === day;
      if (week !== 0) return getWeekOfMonth(d) === week;
      return true;
    });
  };

  const filteredAppsForSummary = useMemo(() => {
    let base = appointments;
    if (auth.role === 'partner') base = base.filter(app => app.partnerName === auth.username);
    return filterSummaryData(base, financeDay, financeWeek, financeMonth, financeYear);
  }, [appointments, financeDay, financeWeek, financeMonth, financeYear, auth]);

  const monthlySummary = useMemo(() => {
    return { count: filteredAppsForSummary.length, total: calculateTotal(filteredAppsForSummary, currentPartnerCommission) };
  }, [filteredAppsForSummary, currentPartnerCommission]);

  const chartDataMonthly = useMemo<number[]>(() => {
    const weeks = [0, 0, 0, 0, 0];
    const base = auth.role === 'partner' ? appointments.filter(a => a.partnerName === auth.username) : appointments;
    base.forEach(app => {
      const d = new Date(app.date + 'T12:00:00');
      if (d.getMonth() === financeMonth && d.getFullYear() === financeYear) {
        const weekIdx = getWeekOfMonth(d) - 1;
        if (weekIdx >= 0 && weekIdx < 5) weeks[weekIdx] += (Number(app.totalValue || 0) + Number(app.deposit || 0)) * (currentPartnerCommission / 100);
      }
    });
    return weeks;
  }, [appointments, financeMonth, financeYear, auth, currentPartnerCommission]);

  const chartDataWeekly = useMemo<number[]>(() => {
    const days = [0, 0, 0, 0, 0, 0, 0];
    const base = auth.role === 'partner' ? appointments.filter(a => a.partnerName === auth.username) : appointments;
    base.forEach(app => {
      const d = new Date(app.date + 'T12:00:00');
      if (d.getMonth() === financeMonth && d.getFullYear() === financeYear) {
        const week = getWeekOfMonth(d);
        if ((financeWeek === 0 || week === financeWeek) && (financeDay === 0 || d.getDate() === financeDay)) {
          days[d.getDay()] += (Number(app.totalValue || 0) + Number(app.deposit || 0)) * (currentPartnerCommission / 100);
        }
      }
    });
    return days;
  }, [appointments, financeMonth, financeYear, financeWeek, financeDay, auth, currentPartnerCommission]);

  const yearlySummary = useMemo(() => {
    const base = auth.role === 'partner' ? appointments.filter(a => a.partnerName === auth.username) : appointments;
    const total = calculateTotal(base.filter(app => new Date(app.date + 'T12:00:00').getFullYear() === financeYear), currentPartnerCommission);
    const percentage = Math.min(100, (total / annualLimit) * 100);
    return { total, limit: annualLimit, percentage, remaining: Math.max(0, annualLimit - total), isNearLimit: total > annualLimit * 0.85 };
  }, [appointments, annualLimit, financeYear, auth, currentPartnerCommission]);

  const financeWeekLabels = useMemo(() => {
    const m = (financeMonth + 1).toString().padStart(2, '0');
    const lastDay = new Date(financeYear, financeMonth + 1, 0).getDate();
    return [
      `01-07/${m}`,
      `08-14/${m}`,
      `15-21/${m}`,
      `22-28/${m}`,
      `29-${lastDay.toString().padStart(2, '0')}/${m}`
    ];
  }, [financeMonth, financeYear]);

  const handleSaveAppointment = (appData: Omit<Appointment, 'id' | 'createdAt'>) => {
    const tempId = editingAppointment?.id;
    google.script.run.withSuccessHandler((savedApp: Appointment) => {
      if (tempId) setAppointments(prev => prev.map(a => a.id === tempId ? savedApp : a));
      else {
        setAppointments(prev => [...prev, savedApp]);
        if (!clients.find(c => c.name.toLowerCase() === savedApp.clientName.toLowerCase())) {
          setClients(prev => [...prev, { name: savedApp.clientName, whatsapp: savedApp.whatsapp, lastVisitDate: savedApp.date }]);
        }
      }
      setIsManualShare(false);
      setSharingAppointment(savedApp);
    }).saveAppointment({ ...appData, id: tempId });
    setIsFormOpen(false);
    setEditingAppointment(null);
  };

  const confirmDeleteAppointment = (id: string) => setAppointmentToDelete(id);

  const handleDeleteAppointment = () => {
    if (!appointmentToDelete) return;
    google.script.run.withSuccessHandler(() => {
      setAppointments(prev => prev.filter(a => String(a.id) !== String(appointmentToDelete)));
      setIsFormOpen(false);
      setEditingAppointment(null);
      setAppointmentToDelete(null);
    }).deleteAppointment(appointmentToDelete);
  };

  const handleUpdateClient = (oldName: string) => {
    const newData = { name: editClientName.trim(), whatsapp: editClientPhone.trim() };
    if (!newData.name) return;
    google.script.run.withSuccessHandler(() => {
      setClients(prev => prev.map(c => c.name === oldName ? { ...c, ...newData } : c));
      setAppointments(prev => prev.map(app => app.clientName === oldName ? { ...app, clientName: newData.name, whatsapp: newData.whatsapp } : app));
      setEditingClientName(null);
    }).updateClient(oldName, newData);
  };

  const handleDeleteClient = (name: string) => {
    if (window.confirm(`Excluir o contato de ${name}?`)) {
      google.script.run.withSuccessHandler(() => {
        setClients(prev => prev.filter(c => c.name.trim().toLowerCase() !== name.trim().toLowerCase()));
      }).deleteClient(name);
    }
  };

  const persistSettings = (opts: { updatedProcedures?: string[], updatedSecProcedures?: string[], updatedAnnualLimit?: number, updatedPartners?: Partner[] } = {}) => {
    const { updatedProcedures, updatedSecProcedures, updatedAnnualLimit, updatedPartners } = opts;
    const settings = { 
      studioName, studioSubtitle, studioIcon, themeId: currentTheme.id, themeMode, customColor,
      annualLimit: updatedAnnualLimit !== undefined ? updatedAnnualLimit.toString() : annualLimit.toString(),
      userTimes: userTimes.join(','),
      procedures: updatedProcedures ? updatedProcedures.join(',') : procedures.join(','),
      secondaryProcedures: updatedSecProcedures ? updatedSecProcedures.join(',') : secondaryProcedures.join(','),
      partners: JSON.stringify(updatedPartners || partners)
    };
    google.script.run.withSuccessHandler(() => setSavingSettings(false)).updateUserSettings(settings);
    localStorage.setItem('saas_settings', JSON.stringify(settings));
  };

  const saveSettings = () => { setSavingSettings(true); persistSettings(); setIsSettingsOpen(false); };
  const handleSaveNewLimit = () => {
    const newVal = parseFloat(editLimitValue);
    if (!isNaN(newVal) && newVal > 0) { setAnnualLimit(newVal); persistSettings({ updatedAnnualLimit: newVal }); setIsEditingLimit(false); }
  };

  const handleAddProcedure = () => {
    if (newProcName.trim() && !procedures.includes(newProcName.trim())) {
      const updated = [...procedures, newProcName.trim()]; setProcedures(updated); setNewProcName(''); persistSettings({ updatedProcedures: updated });
    }
  };

  const handleAddSecondaryProcedure = () => {
    if (newSecProcName.trim() && !secondaryProcedures.includes(newSecProcName.trim())) {
      const updated = [...secondaryProcedures, newSecProcName.trim()]; setSecondaryProcedures(updated); setNewSecProcName(''); persistSettings({ updatedProcedures: updated });
    }
  };

  const handleRemoveProcedure = (name: string) => { const u = procedures.filter(p => p !== name); setProcedures(u); persistSettings({ updatedProcedures: u }); };
  const handleRemoveSecondaryProcedure = (name: string) => { const u = secondaryProcedures.filter(p => p !== name); setSecondaryProcedures(u); persistSettings({ updatedSecProcedures: u }); };

  const handleAddPartner = () => {
    if (!newPartnerName.trim()) return;
    const updated = [...partners, { name: newPartnerName.trim(), password: newPartnerPass, login: normalizeForLogin(newPartnerName), commission: newPartnerCommission }];
    setPartners(updated); setNewPartnerName(''); setNewPartnerPass(''); setNewPartnerCommission(50); persistSettings({ updatedPartners: updated });
  };

  const handleUpdatePartner = (index: number) => {
    const oldName = partners[index].name, newName = editPartnerName.trim(); if (!newName) return;
    const updated = partners.map((p, i) => i === index ? { ...p, name: newName, password: editPartnerPass, login: normalizeForLogin(newName), commission: editPartnerCommission } : p);
    if (oldName !== newName) setAppointments(appointments.map(app => app.partnerName === oldName ? { ...app, partnerName: newName } : app));
    setPartners(updated); setEditingPartnerIndex(null); persistSettings({ updatedPartners: updated });
  };

  const handleDeletePartner = (index: number) => {
    if (window.confirm(`Excluir a parceira ${partners[index].name}?`)) {
      const updated = partners.filter((_, i) => i !== index); setPartners(updated); persistSettings({ updatedPartners: updated });
    }
  };

  const handleImportVCF = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result;
      if (typeof result !== 'string') return;
      const vCards: string[] = result.split(/END:VCARD/i);
      const newClients: Client[] = [];
      const exPh = new Set((clients as Client[]).map((c: Client) => (c.whatsapp || '').replace(/\D/g, '')));
      vCards.forEach((vCard: string) => {
        let name = '', phone = '';
        vCard.split('\n').forEach((line: string) => {
          const l = line.trim(); if (l.startsWith('FN:')) name = l.replace('FN:', '').trim();
          else if (l.startsWith('TEL')) {
            const p: string[] = l.split(':'); if (p.length > 1) {
              phone = p[p.length - 1].replace(/\D/g, '').trim(); if (phone.length > 11 && phone.startsWith('55')) phone = phone.substring(2);
            }
          }
        });
        if (name && phone && !exPh.has(phone)) { newClients.push({ name: name.trim(), whatsapp: phone, lastVisitDate: '' }); exPh.add(phone); }
      });
      if (newClients.length > 0) google.script.run.withSuccessHandler(() => { setClients(prev => [...prev, ...newClients]); alert(`${newClients.length} contatos importados!`); }).bulkSaveClients(newClients);
    };
    reader.readAsText(file); event.target.value = '';
  };

  const formatHistoryDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(dateStr + 'T12:00:00');
      const dayOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][date.getDay()];
      return `${day}/${month}/${year} - ${dayOfWeek}`;
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-[var(--primary-color)]" /><p className="text-slate-400 font-medium uppercase tracking-[0.2em] text-[10px]">Conectando ao Firebase...</p>
    </div>
  );

  if (!auth.isAuthenticated) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-500">
      <div className="w-full max-sm space-y-8 animate-in fade-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full gold-gradient flex items-center justify-center text-white shadow-2xl mb-8">
             {React.cloneElement((BEAUTY_ICONS[studioIcon] || BEAUTY_ICONS['calendar']) as React.ReactElement<any>, { size: 40 })}
          </div>
          <h1 className="text-3xl font-black gold-text-gradient uppercase tracking-tighter leading-none mb-4">BEM-VINDA</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Agenda Simples Pro</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-200/60 dark:border-slate-800/60 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select value={loginUser} onChange={(e) => setLoginUser(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl p-4 pl-12 text-sm font-bold outline-none appearance-none transition-all focus:border-[var(--primary-color)]">
                <option value="danielediasnails" className="font-bold">Daniele Dias</option>
                {partners.map(p => <option key={p.login} value={p.login}>{p.name}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={16} /></div>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder="Sua senha" className={`w-full bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl p-4 pl-12 text-sm font-bold outline-none transition-all ${loginError ? 'border-red-500' : 'focus:border-[var(--primary-color)]'}`} />
            </div>
          </div>
          <div className="space-y-4">
            <button type="submit" className="w-full gold-gradient text-white py-5 rounded-2xl font-bold uppercase text-xs tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
              <span>Acessar</span><ArrowRight size={18} />
            </button>
            <p className="text-[8px] font-extralight text-slate-400 uppercase tracking-[0.2em] text-center whitespace-nowrap">
              EXCLUSIVO PARA O STUDIO DANIELE DIAS NAILS
            </p>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-inherit text-inherit pb-24 font-light transition-colors duration-500">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-6 py-6 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div onClick={() => auth.role === 'master' && setIsSettingsOpen(true)} className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full gold-gradient flex items-center justify-center text-white shrink-0 shadow-lg ${auth.role === 'master' ? 'cursor-pointer' : ''}`}>
              {React.cloneElement((BEAUTY_ICONS[studioIcon] || BEAUTY_ICONS['calendar']) as React.ReactElement<any>, { size: 32 })}
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter gold-text-gradient uppercase leading-none truncate">{studioName}</h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-slate-400 mt-2 truncate">{studioSubtitle}</p>
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(true)} className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:scale-105 transition-all"><Menu size={26} className="text-slate-500" /></button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        <div className="flex flex-col items-center text-center space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Profissional</span>
          <h2 className="text-2xl font-black gold-text-gradient uppercase tracking-tight">{auth.username}</h2>
        </div>

        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Busca rápida..." className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-base outline-none focus:border-[var(--primary-color)] shadow-sm" />
        </div>
        
        {auth.role === 'master' && (
          <button onClick={() => { setEditingAppointment(null); setIsFormOpen(true); }} className="w-full gold-gradient text-white font-bold px-6 py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 transition-all"><Plus size={22} /><span>Novo Agendamento</span></button>
        )}

        {!searchQuery.trim() && (
          <section className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 flex flex-col sm:flex-row items-center justify-between shadow-sm border border-slate-200/50 dark:border-slate-800/50 gap-6">
            <div className="flex items-center gap-4">
              <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"><ChevronLeft size={20} className="text-[var(--primary-color)]" /></button>
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Agenda para</span>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-xl font-semibold outline-none cursor-pointer" />
              </div>
              <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"><ChevronRight size={20} className="text-[var(--primary-color)]" /></button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 rounded-2xl border dark:border-slate-800 text-center">
               <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Total Dia</span>
               <span className="text-2xl font-bold text-[var(--primary-color)]">{filteredAppointments.length}</span>
            </div>
          </section>
        )}

        <div className="space-y-4">
          {filteredAppointments.length > 0 ? filteredAppointments.map(app => (
            <AgendaItem 
              key={app.id} appointment={app} 
              onDelete={() => auth.role === 'master' && confirmDeleteAppointment(app.id)} 
              onEdit={() => auth.role === 'master' && (setEditingAppointment(app), setIsFormOpen(true))} 
              onShare={() => { setIsManualShare(true); setSharingAppointment(app); }} 
              isEmployeeView={auth.role === 'partner'}
              commissionPercentage={auth.role === 'partner' ? currentPartnerCommission : (partners.find(p => p.name === app.partnerName)?.commission || 100)}
              daysSinceLastVisit={null}
            />
          )) : <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-16 text-center text-slate-300 border border-dashed border-slate-200 font-bold uppercase text-xs tracking-widest">Nenhum registro para esta data.</div>}
        </div>
      </main>

      {/* Menu Principal lateral */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-full max-w-[280px] bg-white dark:bg-slate-900 h-full shadow-2xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-10">
               <h2 className="text-2xl font-black dark:text-white uppercase tracking-[0.2em]">MENU</h2>
               <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400"><X size={24} /></button>
            </div>
            <nav className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
              {auth.role === 'master' ? (
                <>
                  {[
                    { label: 'Clientes', icon: <Users size={18} />, action: () => setIsClientsOpen(true) },
                    { label: 'Parceiras', icon: <HardHat size={18} />, action: () => setIsPartnersOpen(true) },
                    { label: 'Histórico', icon: <HistoryIcon size={18} />, action: () => setIsHistoryOpen(true) },
                    { label: 'Procedimentos', icon: <Sparkle size={18} />, action: () => setIsProceduresOpen(true) },
                    { label: 'Financeiro', icon: <Briefcase size={18} />, action: () => setIsFinanceOpen(true) },
                    { label: 'Ajustes', icon: <Settings size={18} />, action: () => setIsSettingsOpen(true) }
                  ].map((item, idx) => (
                    <button key={idx} onClick={() => { item.action(); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 hover:border-[var(--primary-color)] transition-all">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm">{item.icon}</div>
                      <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2 mb-4">
                    <ShieldCheck size={32} className="mx-auto text-[var(--primary-color)]" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acesso Profissional</p>
                  </div>
                  <button onClick={() => { setIsFinanceOpen(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 hover:border-[var(--primary-color)] transition-all">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm"><Briefcase size={18} /></div>
                    <span className="font-bold text-xs uppercase tracking-widest">Meu Financeiro</span>
                  </button>
                </>
              )}
              <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 text-red-600 mt-4 border border-red-100 font-bold text-xs uppercase tracking-widest"><LogOut size={18} /><span>Sair</span></button>
            </nav>
          </div>
        </div>
      )}

      {/* MODAL FINANCEIRO */}
      {isFinanceOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-4 sm:p-8 space-y-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center shrink-0">
               <div className="flex flex-col">
                  <h2 className="text-xl font-bold dark:text-white uppercase tracking-tight">Financeiro</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{auth.role === 'master' ? 'Relatório Geral' : `Relatório de ${auth.username}`}</p>
               </div>
               <button onClick={() => setIsFinanceOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={20} /></button>
            </div>
            
            <div className="grid grid-cols-4 gap-2 shrink-0">
              {[{l: 'Dia', v: financeDay, s: setFinanceDay, d: DAYS_OF_MONTH}, {l: 'Semana', v: financeWeek, s: setFinanceWeek, d: WEEKS}, {l: 'Mês', v: financeMonth, s: setFinanceMonth, d: MONTHS}, {l: 'Ano', v: financeYear, s: setFinanceYear, d: YEARS}].map((f, i) => (
                <div key={i} className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{f.l}</label>
                  <div className="relative">
                    <select value={f.v} onChange={(e) => f.s(parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-[9px] font-bold outline-none appearance-none focus:ring-2 ring-[var(--primary-color)]">
                      {f.d.map((val, idx) => <option key={idx} value={typeof val === 'string' && val === 'Todo' ? 0 : (i === 2 ? idx : (i === 3 ? val : idx))}>{val}</option>)}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={10} /></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 gold-gradient rounded-[2rem] text-white flex flex-col items-center text-center shadow-lg shrink-0">
              <div className="bg-white/20 p-3 rounded-2xl mb-4"><Banknote size={28} /></div>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-80">{auth.role === 'master' ? 'Faturamento Studio' : 'Meu Ganho Total'}</span>
              <p className="text-4xl sm:text-5xl font-black tracking-tighter mt-1">R$ {monthlySummary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <div className="mt-5 px-5 py-2 bg-black/10 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.2em]">{monthlySummary.count} Atendimentos</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[ {l: 'Faturamento Diário', d: chartDataWeekly, a: DAYS_ABBR}, {l: 'Faturamento Semanal', d: chartDataMonthly, a: financeWeekLabels}].map((c: {l: string, d: number[], a: string[]}, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex items-center gap-2 ml-1">
                    <BarChart3 size={14} className="text-[var(--primary-color)]" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.l}</h4>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-3">
                    {c.d.map((val: number, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-12 text-[8px] font-black text-slate-400 uppercase">{c.a[idx]}</span>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full gold-gradient rounded-full" style={{ width: `${(val / (Math.max(...(c.d as number[]), 1))) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-bold min-w-[50px] text-right">R$ {val.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {auth.role === 'master' && (
              <div className="p-4 sm:p-8 bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] space-y-5 border border-slate-100 dark:border-slate-800">
                 <div className="flex justify-between items-center"><span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Progresso Anual</span><button onClick={() => { setIsEditingLimit(!isEditingLimit); setEditLimitValue(annualLimit.toString()); }} className="p-2 text-slate-400 hover:text-[var(--primary-color)]"><Edit2 size={12} /></button></div>
                 {isEditingLimit ? (
                   <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-2 w-full">
                      <input type="number" value={editLimitValue} onChange={(e) => setEditLimitValue(e.target.value)} className="flex-1 min-w-0 p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 text-sm font-bold outline-none border-2 border-[var(--primary-color)]" />
                      <button onClick={handleSaveNewLimit} className="shrink-0 p-3 sm:p-4 gold-gradient text-white rounded-2xl active:scale-95 transition-all"><CheckCircle2 size={20} /></button>
                   </div>
                 ) : (
                   <div>
                      <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter mb-4">R$ {yearlySummary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <div className="w-full h-3.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${yearlySummary.percentage}%` }}></div>
                      </div>
                      <div className="flex flex-col gap-2 mt-4">
                        <div className="flex items-center gap-2">
                          <TrendingUpIcon size={12} className="text-emerald-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{yearlySummary.percentage.toFixed(1)}% Alcançado</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target size={12} className="text-slate-400" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta Limite: R$ {yearlySummary.limit.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CLIENTES */}
      {isClientsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-8 space-y-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-bold dark:text-white uppercase tracking-tight">Meus Contatos</h2>
               <div className="flex gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-2xl hover:bg-indigo-100 transition-all"><Upload size={20} /></button>
                  <button onClick={() => setIsClientsOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><X size={20} /></button>
               </div>
               <input type="file" ref={fileInputRef} onChange={handleImportVCF} accept=".vcf" className="hidden" />
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Procurar cliente..." className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 ring-[var(--primary-color)]" />
            </div>
            <div className="space-y-4">
              {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.whatsapp.includes(clientSearch)).map((c, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 group transition-all hover:border-[var(--primary-color)]">
                  {editingClientName === c.name ? (
                    <div className="flex-1 flex gap-2">
                      <input value={editClientName} onChange={e => setEditClientName(e.target.value)} className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-xl text-xs font-bold" />
                      <input value={editClientPhone} onChange={e => setEditClientPhone(e.target.value)} className="w-32 bg-white dark:bg-slate-900 p-3 rounded-xl text-xs font-bold" />
                      <button onClick={() => handleUpdateClient(c.name)} className="p-3 bg-emerald-500 text-white rounded-xl"><CheckCircle2 size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center text-white font-black">{c.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{c.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.whatsapp}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingClientName(c.name); setEditClientName(c.name); setEditClientPhone(c.whatsapp); }} className="p-3 text-slate-400 hover:text-[var(--primary-color)]"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteClient(c.name)} className="p-3 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTÓRICO - ORGANIZADO */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-8 flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
             <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold dark:text-white uppercase tracking-tight">Histórico Geral</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Busca e registros passados</p>
                </div>
                <button onClick={() => setIsHistoryOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><X size={20} /></button>
             </div>

             <div className="space-y-4 mb-6 shrink-0">
               <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   value={historySearchQuery} 
                   onChange={(e) => setHistorySearchQuery(e.target.value)} 
                   placeholder="Procurar no histórico..." 
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 ring-[var(--primary-color)] shadow-inner" 
                 />
               </div>
               <div className="flex items-center gap-3 overflow-x-auto pb-1 custom-scrollbar">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Filtrar por:</span>
                 <select value={historyPartnerFilter} onChange={(e) => setHistoryPartnerFilter(e.target.value)} className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold p-2.5 rounded-xl outline-none border border-slate-200 dark:border-slate-700">
                    <option value="all">Todas Profissionais</option>
                    <option value="Daniele Dias">Daniele Dias</option>
                    {partners.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                 </select>
               </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-10">
                {Object.keys(groupedHistory).length > 0 ? (Object.entries(groupedHistory) as [string, Appointment[]][]).map(([date, apps]) => (
                  <div key={date} className="space-y-4">
                    <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur py-3 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={14} className="text-[var(--primary-color)]" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-200">{formatHistoryDate(date)}</h3>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">{(apps as Appointment[]).length} Registros</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(apps as Appointment[]).map(app => (
                        <AgendaItem 
                          key={app.id} appointment={app} isHistory 
                          onDelete={() => confirmDeleteAppointment(app.id)} 
                          onEdit={() => { setEditingAppointment(app); setIsFormOpen(true); setIsHistoryOpen(false); }} 
                          daysSinceLastVisit={null}
                        />
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300 opacity-50 space-y-4">
                    <HistoryIcon size={48} />
                    <p className="font-bold uppercase tracking-widest text-xs">Nenhum registro encontrado</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* MODAL PROCEDIMENTOS */}
      {isProceduresOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-xl shadow-2xl p-8 space-y-8 animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold dark:text-white uppercase tracking-tight">Procedimentos</h2>
                <button onClick={() => setIsProceduresOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={20} /></button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Principais</p>
                   <div className="flex gap-2">
                      <input value={newProcName} onChange={e => setNewProcName(e.target.value)} placeholder="Novo..." className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs" />
                      <button onClick={handleAddProcedure} className="p-3 gold-gradient text-white rounded-xl"><Plus size={16} /></button>
                   </div>
                   <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                      {(procedures as string[]).map(p => (
                        <div key={p} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{p}</span>
                          <button onClick={() => handleRemoveProcedure(p)} className="opacity-0 group-hover:opacity-100 transition-all text-red-400"><X size={14} /></button>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Secundários</p>
                   <div className="flex gap-2">
                      <input value={newSecProcName} onChange={e => setNewSecProcName(e.target.value)} placeholder="Novo..." className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs" />
                      <button onClick={handleAddSecondaryProcedure} className="p-3 gold-gradient text-white rounded-xl"><Plus size={16} /></button>
                   </div>
                   <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                      {(secondaryProcedures as string[]).map(p => (
                        <div key={p} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{p}</span>
                          <button onClick={() => handleRemoveSecondaryProcedure(p)} className="opacity-0 group-hover:opacity-100 transition-all text-red-400"><X size={14} /></button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODAL PARCEIRAS */}
      {isPartnersOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-4 sm:p-8 space-y-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
             <div className="flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold dark:text-white uppercase tracking-tight">Equipe</h2>
                <button onClick={() => setIsPartnersOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><X size={20} /></button>
             </div>
             <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] space-y-4 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nova Profissional</p>
                <div className="grid grid-cols-2 gap-3">
                   <input value={newPartnerName} onChange={e => setNewPartnerName(e.target.value)} placeholder="Nome" className="bg-white dark:bg-slate-900 p-4 rounded-2xl text-xs font-bold" />
                   <input value={newPartnerPass} onChange={e => setNewPartnerPass(e.target.value)} placeholder="Senha" type="text" className="bg-white dark:bg-slate-900 p-4 rounded-2xl text-xs font-bold" />
                   <div className="col-span-2 flex flex-col bg-white dark:bg-slate-900 p-5 rounded-2xl">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Comissão Profissional</span>
                         <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-1.5">Escolha a porcentagem</p>
                      </div>
                      <div className="relative mt-3">
                        <select value={newPartnerCommission} onChange={e => setNewPartnerCommission(parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3.5 pl-4 pr-10 text-sm font-bold outline-none appearance-none focus:ring-2 ring-[var(--primary-color)] text-[var(--primary-color)] transition-all">
                           {Array.from({ length: 19 }, (_, i) => 10 + i * 5).map(val => (
                             <option key={val} value={val}>{val}%</option>
                           ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={16} /></div>
                      </div>
                   </div>
                </div>
                <button onClick={handleAddPartner} className="w-full gold-gradient text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg">Cadastrar Parceira</button>
             </div>
             <div className="space-y-4">
                {(partners as Partner[]).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800 group transition-all hover:border-[var(--primary-color)]">
                    {editingPartnerIndex === i ? (
                      <div className="w-full flex flex-col gap-3">
                         <div className="flex flex-col sm:flex-row gap-2">
                            <input value={editPartnerName} onChange={e => setEditPartnerName(e.target.value)} placeholder="Nome" className="flex-1 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs font-bold border border-slate-100 dark:border-slate-800 outline-none focus:border-[var(--primary-color)]" />
                            <input value={editPartnerPass} onChange={e => setEditPartnerPass(e.target.value)} className="w-full sm:w-32 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs font-bold border border-slate-100 dark:border-slate-800 outline-none focus:border-[var(--primary-color)]" type="text" placeholder="Senha" />
                         </div>
                         <div className="flex flex-col gap-3 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Alterar Comissão</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="relative flex-1">
                                  <select value={editPartnerCommission} onChange={e => setEditPartnerCommission(parseInt(e.target.value))} className="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-3 pl-4 pr-10 text-sm font-bold outline-none appearance-none focus:ring-2 ring-[var(--primary-color)] text-[var(--primary-color)] transition-all">
                                     {Array.from({ length: 19 }, (_, i) => 10 + i * 5).map(val => (
                                       <option key={val} value={val}>{val}%</option>
                                     ))}
                                  </select>
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={16} /></div>
                               </div>
                               <button onClick={() => handleUpdatePartner(i)} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg active:scale-95 transition-all"><CheckCircle2 size={16} /></button>
                            </div>
                         </div>
                      </div>
                    ) : (
                      <>
                         <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 flex items-center justify-center"><HardHat size={20} /></div>
                            <div>
                               <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.name}</p>
                               <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 px-2 py-0.5 rounded-full">{p.commission}%</span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Login: {p.login}</span>
                               </div>
                            </div>
                         </div>
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { setEditingPartnerIndex(i); setEditPartnerName(p.name); setEditPartnerPass(p.password); setEditPartnerCommission(p.commission || 50); }} className="p-3 text-slate-400 hover:text-[var(--primary-color)]"><Edit2 size={16} /></button>
                            {/* Fix: use correct loop variable 'i' instead of undefined 'index' */}
                            <button onClick={() => handleDeletePartner(i)} className="p-3 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                         </div>
                      </>
                    )}
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* MODAL AJUSTES - COMPACTADO */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-center p-6 border-b dark:border-slate-800 shrink-0">
                <div>
                   <h2 className="text-lg font-bold dark:text-white uppercase tracking-tight">Ajustes Studio</h2>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Configurações visuais</p>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400"><X size={20} /></button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Studio</label>
                      <input value={studioName} onChange={e => setStudioName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-sm font-bold border-2 border-transparent focus:border-[var(--primary-color)] outline-none" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Subtítulo</label>
                      <input value={studioSubtitle} onChange={e => setStudioSubtitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-sm font-bold border-2 border-transparent focus:border-[var(--primary-color)] outline-none" />
                   </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                   <div className="flex items-center justify-between mb-4">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ícone de Marca</label>
                      <button 
                        onClick={() => setIsIconsExpanded(!isIconsExpanded)}
                        className="text-[9px] font-bold text-[var(--primary-color)] uppercase tracking-widest flex items-center gap-1"
                      >
                        {isIconsExpanded ? <><ChevronUp size={12} /> Menos</> : <><ChevronDown size={12} /> Todos</>}
                      </button>
                   </div>
                   <div className="flex flex-wrap justify-center gap-2">
                      {BRAND_ICON_OPTIONS.slice(0, isIconsExpanded ? 20 : 7).map(iconKey => (
                        <button key={iconKey} onClick={() => setStudioIcon(iconKey)} className={`p-2 rounded-xl transition-all ${studioIcon === iconKey ? 'bg-[var(--primary-color)] text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-400 hover:scale-110'}`}>
                           {React.cloneElement(BEAUTY_ICONS[iconKey] as React.ReactElement<any>, { size: 14 })}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Estilo Visual</label>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {COLOR_PALETTES.map(palette => (
                        <button key={palette.id} onClick={() => setCurrentTheme(palette)} className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all ${currentTheme.id === palette.id ? 'border-[var(--primary-color)] bg-white dark:bg-slate-800' : 'border-transparent bg-slate-50 dark:bg-slate-900'}`}>
                           <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: palette.id === 'custom' ? customColor : palette.primary }} />
                           <span className="text-[10px] font-bold truncate">{palette.name}</span>
                        </button>
                      ))}
                   </div>
                   
                   {currentTheme.id === 'custom' && (
                     <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                           <input 
                             type="color" 
                             value={customColor} 
                             onChange={(e) => setCustomColor(e.target.value)}
                             className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 bg-transparent outline-none"
                           />
                           <div className="flex-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 block">Cor Personalizada</span>
                              <div className="flex items-center gap-2">
                                 <PipetteIcon size={12} className="text-slate-400" />
                                 <span className="text-[10px] font-mono font-bold uppercase text-slate-600 dark:text-slate-300">{customColor}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                   )}
                </div>
             </div>

             <div className="p-6 border-t dark:border-slate-800 shrink-0">
                <button onClick={saveSettings} disabled={savingSettings} className="w-full gold-gradient text-white py-4 rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
                   {savingSettings ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /><span>Salvar Alterações</span></>}
                </button>
             </div>
          </div>
        </div>
      )}

      {isFormOpen && <AppointmentForm onClose={() => { setIsFormOpen(false); setEditingAppointment(null); }} onSubmit={handleSaveAppointment} onDelete={confirmDeleteAppointment} initialDate={selectedDate} availableProcedures={procedures} availableSecondaryProcedures={secondaryProcedures} editingData={editingAppointment} clients={clients} userTimes={userTimes} onUpdateUserTimes={setUserTimes} allAppointments={appointments} availablePartners={partners} />}
      {sharingAppointment && <ShareModal appointment={sharingAppointment} onClose={() => setSharingAppointment(null)} isManualShare={isManualShare} />}
      {appointmentToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-sm p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto"><AlertTriangle size={32} /></div>
            <div><h3 className="text-xl font-bold uppercase tracking-tight">Excluir?</h3><p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-2">Deseja mesmo remover este agendamento?</p></div>
            <div className="flex gap-3"><button onClick={() => setAppointmentToDelete(null)} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg">Não</button><button onClick={handleDeleteAppointment} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg">Sim</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
