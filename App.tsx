// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Calendar as CalendarIcon, Users, ChevronLeft, ChevronRight,
  Settings, Clock, X, Palette, MessageCircle, CheckCircle2, Share2, TrendingUp,
  CalendarDays, Loader2, LogOut, Briefcase, 
  Edit2, Search, List, Menu, BarChart3, 
  Scissors, Sparkles, Flower2, Crown, Heart, Fingerprint, Star, Brush, Gem, Smile,
  Coffee, Zap, Paintbrush, Hand, Eye, EyeOff, Droplets, Feather, Wand2, SprayCan, Diamond,
  Clover, Infinity, Waves, Shapes, PersonStanding, Footprints, Dna, Award,
  User, UserRound, Contact, SmilePlus, Lock, KeyRound, ArrowRight, Trash2, ChevronDown, ChevronUp,
  UserSearch, Sparkle, Pipette, Upload, Save, Receipt, Wallet, CalendarRange, Target, ShieldCheck,
  TrendingDown, Calendar as LucideCalendar, Hash, LayoutGrid, Banknote, Phone, History as HistoryIcon, UserPlus, HardHat, Key,
  AlertCircle, TrendingUp as TrendingUpIcon, Percent, AlertTriangle, Pipette as PipetteIcon,
  ShoppingBag, GripVertical, FileUp, Sun, Moon, Shield, UserCog, UserMinus, Unlock, ShieldAlert, Image as ImageIcon,
  CalendarOff, TimerOff, Smartphone
} from 'lucide-react';
import Cropper from 'cropperjs';
import { Appointment, Client, PaymentMethod, Partner, Expense, Procedure } from './types';
import { DEFAULT_PROCEDURES, DEFAULT_SECONDARY_PROCEDURES, COLOR_PALETTES, ThemePalette, MEI_LIMIT, DEFAULT_PARTNERS, PAYMENT_METHODS, STANDARD_TIMES, FREE_TIMES } from './constants';
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

const DURATION_OPTIONS = ["30min", "1h", "1h30", "2h", "2h30"];

const formatDurationDisplay = (d: string | number) => {
  const s = String(d);
  if (!s) return "";
  if (s.includes('h') || s.includes('min')) return s;
  return s + 'min';
};

const normalizeForLogin = (name: string) => {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
};

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
      const expenses = data.expenses ? Object.values(data.expenses) : [];
      const settings = data.settings || {
        studioName: "Daniele Dias Nails",
        studioSubtitle: "Studio Nails",
        studioIcon: "calendar",
        themeId: "gold",
        themeMode: "light",
        customColor: "#D4AF37",
        annualLimit: String(MEI_LIMIT),
        procedures: JSON.stringify(DEFAULT_PROCEDURES),
        secondaryProcedures: JSON.stringify(DEFAULT_SECONDARY_PROCEDURES),
        partners: JSON.stringify(DEFAULT_PARTNERS),
        masterUsername: 'danieledias',
        masterPassword: '@Dn201974',
        userTimes: STANDARD_TIMES.join(','),
        freeTimes: FREE_TIMES.join(','),
        blockedDays: "{}",
        blockedTimes: "{}"
      };
      result = { appointments, clients, expenses, userEmail: 'equipe@danielediasnails.com', settings };
    } else if (fnName === 'saveAppointment') {
      const app = args[0];
      const id = app.id || Math.random().toString(36).substr(2, 9);
      const newApp = { ...app, id, createdAt: app.createdAt || Date.now() };
      await fetch(getUrl(`v1/appointments/${id}`), { method: 'PUT', body: JSON.stringify(newApp) });
      
      if (app.clientName && app.clientName !== 'Sem Nome') {
        const clientKey = app.clientName.trim().replace(/[.#$[\]/]/g, '_');
        const clientData = { name: app.clientName, whatsapp: app.whatsapp, lastVisitDate: app.date };
        await fetch(getUrl(`v1/clients/${clientKey}`), { method: 'PATCH', body: JSON.stringify(clientData) });
      }
      
      result = newApp;
    } else if (fnName === 'saveExpense') {
      const exp = args[0];
      const id = exp.id || Math.random().toString(36).substr(2, 9);
      const newExp = { ...exp, id, createdAt: exp.createdAt || Date.now() };
      await fetch(getUrl(`v1/expenses/${id}`), { method: 'PUT', body: JSON.stringify(newExp) });
      result = newExp;
    } else if (fnName === 'deleteExpense') {
      await fetch(getUrl(`v1/expenses/${args[0]}`), { method: 'DELETE' });
      result = true;
    } else if (fnName === 'deleteAppointment') {
      await fetch(getUrl(`v1/appointments/${args[0]}`), { method: 'DELETE' });
      result = true;
    } else if (fnName === 'updateUserSettings') {
      await fetch(getUrl('v1/settings'), { method: 'PATCH', body: JSON.stringify(args[0]) });
      result = true;
    } else if (fnName === 'bulkSaveClients') {
      const updates: any = {};
      args[0].forEach((c: any) => { updates[c.name.replace(/[.#$[\]/]/g, '_')] = c; });
      await fetch(getUrl(`v1/clients`), { method: 'PATCH', body: JSON.stringify(updates) });
      result = true;
    } else if (fnName === 'deleteClient') {
      await fetch(getUrl(`v1/clients/${args[0].replace(/[.#$[\]/]/g, '_')}`), { method: 'DELETE' });
      result = true;
    } else if (fnName === 'updateClient') {
      await fetch(getUrl(`v1/clients/${args[0].replace(/[.#$[\]/]/g, '_')}`), { method: 'PATCH', body: JSON.stringify(args[1]) });
      result = true;
    }
    if (handler) handler(result);
  } catch (e) {
    console.error("Erro Firebase:", e);
    if (failureHandler) failureHandler(e);
  }
};

const createFirebaseChain = (handler?: Function, failureHandler?: Function) => {
  const chain: any = { withSuccessHandler: (h: Function) => createFirebaseChain(h, failureHandler), withFailureHandler: (f: Function) => createFirebaseChain(handler, f) };
  const functions = ['getUserData', 'saveAppointment', 'deleteAppointment', 'updateUserSettings', 'deleteClient', 'updateClient', 'bulkSaveClients', 'saveExpense', 'deleteExpense'];
  functions.forEach(fn => { chain[fn] = (...args: any[]) => executeFirebaseCall(fn, args, handler, failureHandler); });
  return chain;
};

(window as any).google = { script: { run: createFirebaseChain() } };
declare var google: any;

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const FULL_MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKS = ['Todo', 'S1', 'S2', 'S3', 'S4', 'S5'];
const DAYS_OF_MONTH = ['Todo', ...Array.from({ length: 31 }, (_, i) => (i + 1).toString())];
const DAYS_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 1 + i);

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('studio_auth_data');
    return saved ? JSON.parse(saved) : { isAuthenticated: false, role: null, username: null };
  });

  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Lógica de Instalação PWA
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  const [studioName, setStudioName] = useState('Daniele Dias Nails');
  const [studioSubtitle, setStudioSubtitle] = useState('Studio Nails');
  const [studioIcon, setStudioIcon] = useState('calendar');
  const [studioLogoUrl, setStudioLogoUrl] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<AppearanceMode>('light');
  const [customColor, setCustomColor] = useState('#D4AF37');
  const [annualLimit, setAnnualLimit] = useState(MEI_LIMIT);
  const [masterUsername, setMasterUsername] = useState('danieledias');
  const [masterPassword, setMasterPassword] = useState('@Dn201974');

  const [userTimes, setUserTimes] = useState<string[]>(STANDARD_TIMES);
  const [userFreeTimes, setUserFreeTimes] = useState<string[]>(FREE_TIMES);
  const [currentTheme, setCurrentTheme] = useState<ThemePalette>(COLOR_PALETTES[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [blockedDays, setBlockedDays] = useState<Record<string, string>>({});
  const [blockedTimes, setBlockedTimes] = useState<Record<string, string[]>>({});
  
  const [procedures, setProcedures] = useState<Procedure[]>(DEFAULT_PROCEDURES);
  const [secondaryProcedures, setSecondaryProcedures] = useState<Procedure[]>(DEFAULT_SECONDARY_PROCEDURES);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [preselectedTime, setPreselectedTime] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isClientsOpen, setIsClientsOpen] = useState(false);
  const [isProceduresOpen, setIsProceduresOpen] = useState(false);
  const [isTimesOpen, setIsTimesOpen] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const [isPartnersOpen, setIsPartnersOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isTimeBlockModalOpen, setIsTimeBlockModalOpen] = useState(false);
  const [isSlotsModalOpen, setIsSlotsModalOpen] = useState(false); 
  const [isMonthSlotsModalOpen, setIsMonthSlotsModalOpen] = useState(false);
  const [monthSlotsSearch, setMonthSlotsSearch] = useState('');
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [tempImageToCrop, setTempImageToCrop] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [sharingAppointment, setSharingAppointment] = useState<Appointment | null>(null);
  const [isManualShare, setIsManualShare] = useState(false);
  
  const [financeYear, setFinanceYear] = useState(new Date().getFullYear());
  const [financeMonth, setFinanceMonth] = useState(new Date().getMonth());
  const [financeDay, setFinanceDay] = useState(0); 
  const [financeWeek, setFinanceWeek] = useState(0); 
  
  const [expenseYear, setExpenseYear] = useState(new Date().getFullYear());
  const [expenseMonth, setExpenseMonth] = useState(new Date().getMonth());
  const [expenseDay, setExpenseDay] = useState(0);
  const [expenseWeek, setExpenseWeek] = useState(0);
  
  const [newExpName, setNewExpName] = useState('');
  const [newExpValue, setNewExpValue] = useState('');
  const [newExpPaymentMethod, setNewExpPaymentMethod] = useState<PaymentMethod>('Pix');
  const [newExpDate, setNewExpDate] = useState(new Date().toISOString().split('T')[0]);

  const [clientSearch, setClientSearch] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyMonth, setHistoryMonth] = useState(new Date().getMonth());
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [historyPartnerFilter, setHistoryPartnerFilter] = useState<string>('all');

  const [editingClientName, setEditingClientName] = useState<string | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const vcfInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);

  const [quickReportMonth, setQuickReportMonth] = useState(new Date().getMonth());
  const [quickReportYear, setQuickReportYear] = useState(new Date().getFullYear());
  const [isQuickValuesVisible, setIsQuickValuesVisible] = useState(false);

  const [newProcName, setNewProcName] = useState('');
  const [newProcDuration, setNewProcDuration] = useState('1h');
  const [newSecProcName, setNewSecProcName] = useState('');
  const [newSecProcDuration, setNewSecProcDuration] = useState('1h');

  const [editingProcIdx, setEditingProcIdx] = useState<number | null>(null);
  const [editingProcName, setEditingProcName] = useState('');
  const [editingProcDuration, setEditingProcDuration] = useState('');
  
  const [editingSecProcIdx, setEditingSecProcIdx] = useState<number | null>(null);
  const [editingSecProcName, setEditingSecProcName] = useState('');
  const [editingSecProcDuration, setEditingSecProcDuration] = useState('');

  const [newTime, setNewTime] = useState('08:00');
  const [newFreeTime, setNewFreeTime] = useState('08:00');
  const [editingStandardTimeIdx, setEditingStandardTimeIdx] = useState<number | null>(null);
  const [editingFreeTimeIdx, setEditingFreeTimeIdx] = useState<number | null>(null);
  const [tempTimeEditValue, setTempTimeEditValue] = useState('');

  const [isEditingAnnualLimit, setIsEditingAnnualLimit] = useState(false);
  const [tempAnnualLimit, setTempAnnualLimit] = useState('');

  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerPass, setNewPartnerPass] = useState('123');
  const [newPartnerCommission, setNewPartnerCommission] = useState(50);
  const [editingPartnerIdx, setEditingPartnerIdx] = useState<number | null>(null);
  const [editPartnerName, setEditPartnerName] = useState('');
  const [editPartnerPass, setEditPartnerPass] = useState('');
  const [editPartnerCommission, setEditPartnerCommission] = useState(50);
  const [editPartnerLogin, setEditPartnerLogin] = useState('');

  const [isFreeTimesExpanded, setIsFreeTimesExpanded] = useState(false);
  const [isOccupiedFreeTimesExpanded, setIsOccupiedFreeTimesExpanded] = useState(false);

  const [selectedTimesForBlocking, setSelectedTimesForBlocking] = useState<string[]>([]);

  const [calendarViewDate, setCalendarViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    localStorage.setItem('studio_values_visible', JSON.stringify(isQuickValuesVisible));
  }, [isQuickValuesVisible]);

  useEffect(() => {
    const savedCreds = localStorage.getItem('studio_remembered_creds');
    if (savedCreds) {
      try {
        const { user, pass } = JSON.parse(savedCreds);
        setLoginUser(user); setLoginPass(pass); setRememberMe(true);
      } catch (e) {}
    }
  }, []);

  // Monitorar evento de instalação PWA
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Verificar se já está instalado ou em iOS
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isStandalone) {
      setShowInstallBtn(false);
    } else if (isIOS) {
      setShowInstallBtn(true); // iOS sempre mostra pois o prompt nativo não existe
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
      alert('No iPhone, toque no ícone de compartilhar e selecione "Adicionar à Tela de Início" para instalar.');
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBtn(false);
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    let newAuth: AuthState | null = null;
    const normalizedTypedLogin = loginUser.trim().toLowerCase();
    if (normalizedTypedLogin === masterUsername.toLowerCase() && loginPass === masterPassword) {
      newAuth = { isAuthenticated: true, role: 'master', username: 'Daniele Dias' };
    } else {
      const foundPartner = (partners || []).find(p => p.login === normalizedTypedLogin && p.password === loginPass);
      if (foundPartner) newAuth = { isAuthenticated: true, role: 'partner', username: foundPartner.name };
    }
    if (newAuth) {
      setAuth(newAuth);
      if (rememberMe) {
        localStorage.setItem('studio_auth_data', JSON.stringify(newAuth));
        localStorage.setItem('studio_remembered_creds', JSON.stringify({ user: loginUser, pass: loginPass }));
      } else {
        localStorage.removeItem('studio_remembered_creds');
      }
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studio_auth_data');
    setAuth({ isAuthenticated: false, role: null, username: null });
    setIsMenuOpen(false);
  };

  const darkenColor = (hex: string) => {
    try {
      let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16);
      let b = parseInt(hex.slice(5, 7), 16);
      r = Math.max(0, r - 40); g = Math.max(0, g - 40); b = Math.max(0, b - 40);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (e) { return hex; }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
    const primary = currentTheme.id === 'custom' ? customColor : currentTheme.primary;
    const hover = currentTheme.id === 'custom' ? darkenColor(customColor) : currentTheme.hover;
    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--primary-hover', hover);
  }, [themeMode, currentTheme, customColor]);

  useEffect(() => {
    google.script.run.withSuccessHandler((data: any) => {
      if (data && !data.error) {
        if (data.settings) {
          setStudioName(data.settings.studioName || 'Daniele Dias Nails');
          setStudioSubtitle(data.settings.studioSubtitle || 'Studio Nails');
          setStudioIcon(data.settings.studioIcon || 'calendar');
          setStudioLogoUrl(data.settings.studioLogoUrl || null);
          setThemeMode((data.settings.themeMode as AppearanceMode) || 'light');
          setCustomColor(data.settings.customColor || '#D4AF37');
          setAnnualLimit(Number(data.settings.annualLimit) || MEI_LIMIT);
          setMasterUsername(data.settings.masterUsername || 'danieledias');
          setMasterPassword(data.settings.masterPassword || '@Dn201974');
          if (data.settings.userTimes) setUserTimes(data.settings.userTimes.split(',').filter(Boolean).sort());
          if (data.settings.freeTimes) setUserFreeTimes(data.settings.freeTimes.split(',').filter(Boolean).sort());
          if (data.settings.procedures) setProcedures(JSON.parse(data.settings.procedures));
          if (data.settings.secondaryProcedures) setSecondaryProcedures(JSON.parse(data.settings.secondaryProcedures));
          if (data.settings.partners) setPartners(typeof data.settings.partners === 'string' ? JSON.parse(data.settings.partners) : data.settings.partners);
          if (data.settings.blockedDays) setBlockedDays(JSON.parse(data.settings.blockedDays));
          if (data.settings.blockedTimes) setBlockedTimes(JSON.parse(data.settings.blockedTimes));
          const theme = COLOR_PALETTES.find(t => t.id === data.settings.themeId);
          if (theme) setCurrentTheme(theme);
        }
        if (auth.isAuthenticated) {
          setAppointments(data.appointments || []);
          setClients(data.clients || []);
          setExpenses(data.expenses || []);
        }
      }
      setLoading(false);
    }).getUserData();
  }, [auth.isAuthenticated]);

  const getWeekOfMonth = (date: Date) => Math.ceil(date.getDate() / 7);

  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter(exp => {
      const d = new Date(exp.date + 'T12:00:00');
      if (d.getFullYear() !== expenseYear || d.getMonth() !== expenseMonth) return false;
      if (expenseDay !== 0) return d.getDate() === expenseDay;
      if (expenseWeek !== 0) return getWeekOfMonth(d) === expenseWeek;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, expenseDay, expenseWeek, expenseMonth, expenseYear]);

  const expenseSummary = useMemo(() => {
    const total = filteredExpenses.reduce((sum, exp) => sum + Number(exp.value || 0), 0);
    return { count: filteredExpenses.length, total };
  }, [filteredExpenses]);

  const annualExpenseTotal = useMemo(() => {
    return (expenses || []).filter(exp => {
      const d = new Date(exp.date + 'T12:00:00');
      return d.getFullYear() === expenseYear;
    }).reduce((sum, exp) => sum + Number(exp.value || 0), 0);
  }, [expenses, expenseYear]);

  const chartDataWeeklyExpenses = useMemo<number[]>(() => {
    const days = [0, 0, 0, 0, 0, 0, 0];
    expenses.forEach(exp => {
      const d = new Date(exp.date + 'T12:00:00');
      if (d.getMonth() === expenseMonth && d.getFullYear() === expenseYear) {
        if (expenseWeek === 0 || getWeekOfMonth(d) === expenseWeek) {
          days[d.getDay()] += Number(exp.value || 0);
        }
      }
    });
    return days;
  }, [expenses, expenseMonth, expenseYear, expenseWeek]);

  const chartDataMonthlyExpenses = useMemo<number[]>(() => {
    const weeks = [0, 0, 0, 0, 0];
    expenses.forEach(exp => {
      const d = new Date(exp.date + 'T12:00:00');
      if (d.getMonth() === expenseMonth && d.getFullYear() === expenseYear) {
        const weekIdx = getWeekOfMonth(d) - 1;
        if (weekIdx >= 0 && weekIdx < 5) weeks[weekIdx] += Number(exp.value || 0);
      }
    });
    return weeks;
  }, [expenses, expenseMonth, expenseYear]);

  const filteredAppointments = useMemo(() => {
    let base = appointments || [];
    if (auth.role === 'partner') base = base.filter(app => app.partnerName === auth.username);
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      return base.filter(app => (app.clientName && app.clientName.toLowerCase().includes(q)) || (app.whatsapp && app.whatsapp.includes(q)) || (app.procedure && app.procedure.toLowerCase().includes(q)))
        .sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time));
    }
    return base.filter(app => app.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate, searchQuery, auth]);

  const slotsStatus = useMemo(() => {
    if (searchQuery.trim().length > 0) return { 
      available: { standard: [], free: [] }, 
      occupied: { standard: [], free: [] } 
    };
    const occupiedTimesSet = new Set<string>();
    filteredAppointments.forEach(app => {
      occupiedTimesSet.add(app.time);
      if (app.secondaryTime) occupiedTimesSet.add(app.secondaryTime);
    });
    
    if (blockedTimes[selectedDate]) {
      blockedTimes[selectedDate].forEach(t => occupiedTimesSet.add(t));
    }

    return {
      available: {
        standard: (userTimes || []).filter(t => !occupiedTimesSet.has(t)),
        free: (userFreeTimes || []).filter(t => !occupiedTimesSet.has(t))
      },
      occupied: {
        standard: (userTimes || []).filter(t => occupiedTimesSet.has(t)),
        free: (userFreeTimes || []).filter(t => occupiedTimesSet.has(t))
      }
    };
  }, [userTimes, userFreeTimes, filteredAppointments, searchQuery, blockedTimes, selectedDate]);

  const monthAvailability = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const results = [];
    
    const queryRaw = monthSlotsSearch.toLowerCase().trim();
    const timeQuery = queryRaw.replace('h', ':');

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      if (dateObj.getDay() === 0) continue; // Pula domingos

      const dateStr = dateObj.toISOString().split('T')[0];
      const isBlocked = !!blockedDays[dateStr];
      const dayApps = appointments.filter(a => a.date === dateStr);
      
      const occupiedTimesSet = new Set<string>();
      dayApps.forEach(app => {
        occupiedTimesSet.add(app.time);
        if (app.secondaryTime) occupiedTimesSet.add(app.secondaryTime);
      });
      
      if (blockedTimes[dateStr]) {
        blockedTimes[dateStr].forEach(t => occupiedTimesSet.add(t));
      }

      let availStandard = isBlocked ? [] : (userTimes || []).filter(t => !occupiedTimesSet.has(t));
      let availFree = isBlocked ? [] : (userFreeTimes || []).filter(t => !occupiedTimesSet.has(t));

      if (queryRaw) {
        availStandard = availStandard.filter(t => t.includes(timeQuery) || t.replace(':', 'h').includes(queryRaw));
        availFree = availFree.filter(t => t.includes(timeQuery) || t.replace(':', 'h').includes(queryRaw));
      }

      const dateMatch = queryRaw ? dateStr.includes(queryRaw) : true;
      const appMatch = queryRaw ? dayApps.some(a => 
        a.clientName.toLowerCase().includes(queryRaw) || 
        a.procedure.toLowerCase().includes(queryRaw) ||
        a.time.includes(timeQuery) ||
        (a.secondaryTime && a.secondaryTime.includes(timeQuery))
      ) : true;
      const timeMatch = queryRaw ? (availStandard.length > 0 || availFree.length > 0) : true;

      if (!queryRaw || dateMatch || appMatch || timeMatch) {
        results.push({
          date: dateStr,
          isBlocked,
          dayNum: day,
          available: { standard: availStandard, free: availFree },
          appointments: dayApps.sort((a, b) => a.time.localeCompare(b.time))
        });
      }
    }

    return results;
  }, [calendarViewDate, blockedDays, blockedTimes, appointments, userTimes, userFreeTimes, monthSlotsSearch]);

  const currentPartnerCommission = useMemo(() => {
    if (auth.role === 'partner' && auth.username) {
      const p = (partners || []).find(p => p.name === auth.username);
      return p?.commission || 50;
    }
    return 100;
  }, [auth, partners]);

  const quickSummary = useMemo(() => {
    let base = appointments || [];
    if (auth.role === 'partner') base = base.filter(app => app.partnerName === auth.username);
    const filtered = base.filter(app => {
      const d = new Date(app.date + 'T12:00:00');
      return d.getMonth() === quickReportMonth && d.getFullYear() === quickReportYear;
    });
    const total = filtered.reduce((sum, app) => {
      const val = (Number(app.totalValue || 0) + Number(app.deposit || 0));
      return sum + (val * (currentPartnerCommission / 100));
    }, 0);
    return { count: filtered.length, total };
  }, [appointments, quickReportMonth, quickReportYear, auth, currentPartnerCommission]);

  const monthlySummary = useMemo(() => {
    let base = appointments || [];
    if (auth.role === 'partner') base = base.filter(app => app.partnerName === auth.username);
    const filtered = base.filter(app => {
      const d = new Date(app.date + 'T12:00:00');
      if (d.getFullYear() !== financeYear || d.getMonth() !== financeMonth) return false;
      if (financeDay !== 0) return d.getDate() === financeDay;
      if (financeWeek !== 0) return getWeekOfMonth(d) === financeWeek;
      return true;
    });
    const total = filtered.reduce((sum, app) => sum + ((Number(app.totalValue || 0) + Number(app.deposit || 0)) * (currentPartnerCommission / 100)), 0);
    return { count: filtered.length, total };
  }, [appointments, financeDay, financeWeek, financeMonth, financeYear, auth, currentPartnerCommission]);

  const annualTotalRevenue = useMemo(() => {
    let base = appointments || [];
    if (auth.role === 'partner') base = base.filter(app => app.partnerName === auth.username);
    return base.filter(app => {
      const d = new Date(app.date + 'T12:00:00');
      return d.getFullYear() === financeYear;
    }).reduce((sum, app) => sum + ((Number(app.totalValue || 0) + Number(app.deposit || 0)) * (currentPartnerCommission / 100)), 0);
  }, [appointments, financeYear, auth, currentPartnerCommission]);

  const annualProgressPercent = useMemo(() => {
    if (!annualLimit || annualLimit <= 0) return 0;
    return Math.min(100, (annualTotalRevenue / annualLimit) * 100);
  }, [annualTotalRevenue, annualLimit]);

  const chartDataWeekly = useMemo<number[]>(() => {
    const days = [0, 0, 0, 0, 0, 0, 0];
    let base = auth.role === 'partner' ? appointments.filter(a => a.partnerName === auth.username) : appointments;
    base.forEach(app => {
      const d = new Date(app.date + 'T12:00:00');
      if (d.getMonth() === financeMonth && d.getFullYear() === financeYear) {
        if (financeWeek === 0 || getWeekOfMonth(d) === financeWeek) {
          days[d.getDay()] += (Number(app.totalValue || 0) + Number(app.deposit || 0)) * (currentPartnerCommission / 100);
        }
      }
    });
    return days;
  }, [appointments, financeMonth, financeYear, financeWeek, currentPartnerCommission, auth]);

  const chartDataMonthly = useMemo<number[]>(() => {
    const weeks = [0, 0, 0, 0, 0];
    let base = auth.role === 'partner' ? appointments.filter(a => a.partnerName === auth.username) : appointments;
    base.forEach(app => {
      const d = new Date(app.date + 'T12:00:00');
      if (d.getMonth() === financeMonth && d.getFullYear() === financeYear) {
        const weekIdx = getWeekOfMonth(d) - 1;
        if (weekIdx >= 0 && weekIdx < 5) weeks[weekIdx] += (Number(app.totalValue || 0) + Number(app.deposit || 0)) * (currentPartnerCommission / 100);
      }
    });
    return weeks;
  }, [appointments, financeMonth, financeYear, currentPartnerCommission, auth]);

  const handleSaveAppointment = (appData: Omit<Appointment, 'id' | 'createdAt'>) => {
    const tempId = editingAppointment?.id;
    google.script.run.withSuccessHandler((savedApp: Appointment) => {
      if (tempId) setAppointments(prev => (prev || []).map(a => a.id === tempId ? savedApp : a));
      else setAppointments(prev => [...(prev || []), savedApp]);
      
      if (savedApp.clientName && savedApp.clientName !== 'Sem Nome') {
        setClients(prev => {
          const normalizedName = savedApp.clientName.trim().toLowerCase();
          const exists = prev.some(c => c.name.trim().toLowerCase() === normalizedName);
          
          if (exists) {
            return prev.map(c => c.name.trim().toLowerCase() === normalizedName 
              ? { ...c, whatsapp: savedApp.whatsapp, lastVisitDate: savedApp.date } 
              : c
            );
          } else {
            return [...prev, { 
              name: savedApp.clientName, 
              whatsapp: savedApp.whatsapp, 
              lastVisitDate: savedApp.date 
            }];
          }
        });
      }

      setSharingAppointment(savedApp);
    }).saveAppointment({ ...appData, id: tempId });
    setIsFormOpen(false); setEditingAppointment(null); setPreselectedTime(null);
  };

  const persistSettings = (opts: any = {}) => {
    const settings = { 
      studioName, studioSubtitle, studioIcon, themeId: currentTheme.id, themeMode, customColor,
      annualLimit: opts.updatedAnnualLimit?.toString() || annualLimit.toString(),
      userTimes: opts.updatedTimes?.join(',') || userTimes.join(','),
      freeTimes: opts.updatedFreeTimes?.join(',') || userFreeTimes.join(','),
      procedures: opts.updatedProcedures ? JSON.stringify(opts.updatedProcedures) : JSON.stringify(procedures),
      secondaryProcedures: opts.updatedSecProcedures ? JSON.stringify(opts.updatedSecProcedures) : JSON.stringify(secondaryProcedures),
      partners: JSON.stringify(opts.updatedPartners || partners),
      blockedDays: JSON.stringify(opts.updatedBlockedDays || blockedDays),
      blockedTimes: JSON.stringify(opts.updatedBlockedTimes || blockedTimes),
      studioLogoUrl: opts.updatedLogoUrl || studioLogoUrl,
      masterUsername, masterPassword
    };
    google.script.run.updateUserSettings(settings);
  };

  const saveSettings = () => { setSavingSettings(true); persistSettings(); setIsSettingsOpen(false); setSavingSettings(false); };
  
  const handleUpdateClient = (oldName: string) => {
    const newData = { name: editClientName.trim(), whatsapp: editClientPhone.trim() };
    google.script.run.withSuccessHandler(() => {
      setClients(prev => prev.map(c => c.name === oldName ? { ...c, ...newData } : c));
      setEditingClientName(null);
    }).updateClient(oldName, newData);
  };

  const handleDeleteClient = (name: string) => {
    if (confirm(`Excluir cliente ${name}?`)) {
      google.script.run.withSuccessHandler(() => {
        setClients(prev => prev.filter(c => c.name !== name));
      }).deleteClient(name);
    }
  };

  const confirmDeleteAppointment = (id: string) => {
    setAppointmentToDelete(id);
    setIsFormOpen(false);
    setEditingAppointment(null);
  };

  const handleDeleteAppointment = () => {
    if (appointmentToDelete) {
      google.script.run.withSuccessHandler(() => {
        setAppointments(prev => (prev || []).filter(a => a.id !== appointmentToDelete));
        setAppointmentToDelete(null);
      }).deleteAppointment(appointmentToDelete);
    }
  };

  const handleAddExpense = () => {
    if (!newExpName || !newExpValue) return;
    const exp: Omit<Expense, 'id' | 'createdAt'> = {
      name: newExpName,
      value: parseFloat(newExpValue.replace(',', '.')),
      paymentMethod: newExpPaymentMethod,
      date: newExpDate,
    };
    google.script.run.withSuccessHandler((savedExp: Expense) => {
      setExpenses(prev => [...(prev || []), savedExp]);
      setNewExpName('');
      setNewExpValue('');
    }).saveExpense(exp);
  };

  const handleDeleteExpense = (id: string) => {
    google.script.run.withSuccessHandler(() => {
      setExpenses(prev => (prev || []).filter(e => e.id !== id));
    }).deleteExpense(id);
  };

  const handleVCFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const contacts: Client[] = [];
      const vcards = content.split('BEGIN:VCARD');
      vcards.forEach(vcard => {
        const fn = vcard.match(/FN:(.*)/)?.[1]?.trim();
        const tel = vcard.match(/TEL;[^:]*:(.*)/)?.[1]?.trim() || vcard.match(/TEL:(.*)/)?.[1]?.trim();
        if (fn && tel) {
          contacts.push({ name: fn, whatsapp: tel, lastVisitDate: '' });
        }
      });
      if (contacts.length > 0) {
        google.script.run.withSuccessHandler(() => {
          setClients(prev => [...prev, ...contacts]);
          alert(`${contacts.length} contatos importados!`);
        }).bulkSaveClients(contacts);
      }
    };
    reader.readAsText(file);
  };

  const groupedHistory = useMemo(() => {
    const filtered = (appointments || []).filter(app => {
      const d = new Date(app.date + 'T12:00:00');
      const matchesQuery = !historySearchQuery.trim() || 
        (app.clientName && app.clientName.toLowerCase().includes(historySearchQuery.toLowerCase())) ||
        (app.procedure && app.procedure.toLowerCase().includes(historySearchQuery.toLowerCase()));
      const matchesPartner = historyPartnerFilter === 'all' || app.partnerName === historyPartnerFilter;
      return d.getFullYear() === historyYear && d.getMonth() === historyMonth && matchesQuery && matchesPartner;
    });
    const grouped: Record<string, Appointment[]> = {};
    filtered.forEach(app => {
      if (!grouped[app.date]) grouped[app.date] = [];
      grouped[app.date].push(app);
    });
    const result: Record<string, Appointment[]> = {};
    Object.keys(grouped).sort((a, b) => b.localeCompare(a)).forEach(key => {
      result[key] = grouped[key].sort((a, b) => a.time.localeCompare(b.time));
    });
    return result;
  }, [appointments, historySearchQuery, historyMonth, historyYear, historyPartnerFilter]);

  const handleOpenAvailableTime = (time: string, date?: string) => { 
    if (date) setSelectedDate(date);
    setPreselectedTime(time); 
    setEditingAppointment(null); 
    setIsSlotsModalOpen(false); 
    setIsMonthSlotsModalOpen(false);
    setIsFreeTimesExpanded(false);
    setIsFormOpen(true); 
  };

  const handleAddProcedure = () => {
    if (!newProcName) return;
    const updated = [...procedures, { name: newProcName, duration: newProcDuration }];
    setProcedures(updated);
    setNewProcName('');
    persistSettings({ updatedProcedures: updated });
  };

  const handleDeleteProcedure = (idx: number) => {
    const updated = procedures.filter((_, i) => i !== idx);
    setProcedures(updated);
    persistSettings({ updatedProcedures: updated });
  };

  const handleUpdateProcedure = () => {
    if (editingProcIdx === null) return;
    const updated = [...procedures];
    updated[editingProcIdx] = { name: editingProcName, duration: editingProcDuration };
    setProcedures(updated);
    setEditingProcIdx(null);
    persistSettings({ updatedProcedures: updated });
  };

  const handleAddSecProcedure = () => {
    if (!newSecProcName) return;
    const updated = [...secondaryProcedures, { name: newSecProcName, duration: newSecProcDuration }];
    setSecondaryProcedures(updated);
    setNewSecProcName('');
    persistSettings({ updatedSecProcedures: updated });
  };

  const handleDeleteSecProcedure = (idx: number) => {
    const updated = secondaryProcedures.filter((_, i) => i !== idx);
    setSecondaryProcedures(updated);
    persistSettings({ updatedSecProcedures: updated });
  };

  const handleUpdateSecProcedure = () => {
    if (editingSecProcIdx === null) return;
    const updated = [...secondaryProcedures];
    updated[editingSecProcIdx] = { name: editingSecProcName, duration: editingSecProcDuration };
    setSecondaryProcedures(updated);
    setEditingSecProcIdx(null);
    persistSettings({ updatedSecProcedures: updated });
  };

  const handleAddTime = () => {
    if (!newTime || userTimes.includes(newTime)) return;
    const updated = [...userTimes, newTime].sort();
    setUserTimes(updated);
    persistSettings({ updatedTimes: updated });
  };

  const handleDeleteTime = (t: string) => {
    const updated = userTimes.filter(time => time !== t);
    setUserTimes(updated);
    persistSettings({ updatedTimes: updated });
  };

  const handleUpdateStandardTime = () => {
    if (editingStandardTimeIdx === null) return;
    const updated = [...userTimes];
    updated[editingStandardTimeIdx] = tempTimeEditValue;
    updated.sort();
    setUserTimes(updated);
    setEditingStandardTimeIdx(null);
    persistSettings({ updatedTimes: updated });
  };

  const handleAddFreeTime = () => {
    if (!newFreeTime || userFreeTimes.includes(newFreeTime)) return;
    const updated = [...userFreeTimes, newFreeTime].sort();
    setUserFreeTimes(updated);
    persistSettings({ updatedFreeTimes: updated });
  };

  const handleDeleteFreeTime = (t: string) => {
    const updated = userFreeTimes.filter(time => time !== t);
    setUserFreeTimes(updated);
    persistSettings({ updatedFreeTimes: updated });
  };

  const handleUpdateFreeTime = () => {
    if (editingFreeTimeIdx === null) return;
    const updated = [...userFreeTimes];
    updated[editingFreeTimeIdx] = tempTimeEditValue;
    updated.sort();
    setUserFreeTimes(updated);
    setEditingFreeTimeIdx(null);
    persistSettings({ updatedFreeTimes: updated });
  };

  const handleSaveAnnualLimit = () => {
    const newVal = parseFloat(tempAnnualLimit.replace(',', '.'));
    if (!isNaN(newVal)) {
      setAnnualLimit(newVal);
      persistSettings({ updatedAnnualLimit: newVal });
    }
    setIsEditingAnnualLimit(false);
  };

  const handleBlockDay = () => {
    const updated = { ...blockedDays, [selectedDate]: blockReason || 'Dia bloqueado pela administração' };
    setBlockedDays(updated);
    persistSettings({ updatedBlockedDays: updated });
    setIsBlockModalOpen(false);
    setBlockReason('');
  };

  const handleUnblockDay = () => {
    const updated = { ...blockedDays };
    delete updated[selectedDate];
    setBlockedDays(updated);
    persistSettings({ updatedBlockedDays: updated });
  };

  const handleBlockTime = (time: string) => {
    const current = blockedTimes[selectedDate] || [];
    if (current.includes(time)) return;
    const updated = { ...blockedTimes, [selectedDate]: [...current, time] };
    setBlockedTimes(updated);
    persistSettings({ updatedBlockedTimes: updated });
  };

  const handleUnblockTime = (time: string) => {
    const current = blockedTimes[selectedDate] || [];
    const updated = { ...blockedTimes, [selectedDate]: current.filter(t => t !== time) };
    setBlockedTimes(updated);
    persistSettings({ updatedBlockedTimes: updated });
  };

  const handleAddPartner = () => {
    if (!newPartnerName) return;
    const login = normalizeForLogin(newPartnerName);
    const updated = [...partners, { 
      name: newPartnerName, 
      login, 
      password: newPartnerPass, 
      commission: newPartnerCommission 
    }];
    setPartners(updated);
    setNewPartnerName('');
    setNewPartnerPass('123');
    setNewPartnerCommission(50);
    persistSettings({ updatedPartners: updated });
  };

  const handleDeletePartner = (idx: number) => {
    if (confirm(`Remover parceira ${partners[idx].name}?`)) {
      const updated = partners.filter((_, i) => i !== idx);
      setPartners(updated);
      persistSettings({ updatedPartners: updated });
    }
  };

  const handleUpdatePartner = () => {
    if (editingPartnerIdx === null) return;
    const updated = [...partners];
    updated[editingPartnerIdx] = { 
      ...updated[editingPartnerIdx],
      name: editPartnerName,
      login: editPartnerLogin,
      password: editPartnerPass,
      commission: editPartnerCommission
    };
    setPartners(updated);
    setEditingPartnerIdx(null);
    persistSettings({ updatedPartners: updated });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempImageToCrop(event.target?.result as string);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const initCropper = () => {
    if (cropImageRef.current) {
      if (cropperRef.current) cropperRef.current.destroy();
      cropperRef.current = new Cropper(cropImageRef.current, {
        aspectRatio: 1, 
        viewMode: 1,
        dragMode: 'move',
        cropBoxMovable: false, 
        cropBoxResizable: false,
        background: false,
        autoCropArea: 0.8,
        zoomable: true,
        scalable: false,
        toggleDragModeOnDblclick: false,
      });
    }
  };

  const handleSaveCrop = () => {
    if (cropperRef.current) {
      const canvas = cropperRef.current.getCroppedCanvas({ width: 400, height: 400 });
      const circleCanvas = document.createElement('canvas');
      const ctx = circleCanvas.getContext('2d');
      circleCanvas.width = 400;
      circleCanvas.height = 400;
      if (ctx) {
        ctx.beginPath();
        ctx.arc(200, 200, 200, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(canvas, 0, 0, 400, 400);
        const dataUrl = circleCanvas.toDataURL('image/png');
        setStudioLogoUrl(dataUrl);
        persistSettings({ updatedLogoUrl: dataUrl });
        setIsCropModalOpen(false);
        setTempImageToCrop(null);
      }
    }
  };

  const monthDays = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    
    return days;
  }, [calendarViewDate]);

  const isDayBlocked = auth.role === 'master' ? !!blockedDays[selectedDate] : false;

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-700">
      <div className="relative">
        <Loader2 className="w-14 h-14 animate-spin text-black dark:text-white" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 bg-black dark:bg-white rounded-full"></div>
        </div>
      </div>
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">Carregando...</p>
    </div>
  );

  if (!auth.isAuthenticated) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-sm space-y-8 animate-in fade-in zoom-in-95 duration-700 flex flex-col items-center">
        <div className="flex flex-col items-center text-center">
          <div className="text-[var(--primary-color)] mb-6 drop-shadow-sm">
             {React.cloneElement((BEAUTY_ICONS[studioIcon] || BEAUTY_ICONS['calendar']) as React.ReactElement<any>, { size: 64 })}
          </div>
          <h1 className="text-3xl font-black text-[var(--primary-color)] uppercase tracking-tighter leading-none">AGENDA SIMPLES</h1>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-[0.5em] mt-2 mb-4">A MAIS COMPLETA</p>
        </div>
        
        <form onSubmit={handleLogin} className="w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-10 rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] border border-white/40 dark:border-slate-800/40 space-y-8">
          <div className="space-y-4">
            <div className="relative group">
              <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 transition-colors group-focus-within:text-[var(--primary-color)]" size={18} />
              <input 
                type="text" 
                value={loginUser} 
                onChange={(e) => setLoginUser(e.target.value)} 
                placeholder="Seu usuário" 
                className="w-full bg-white/80 dark:bg-slate-950/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-6 pl-12 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[var(--primary-color)] transition-all placeholder:text-slate-400 shadow-sm" 
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 transition-colors group-focus-within:text-[var(--primary-color)]" size={18} />
              <input 
                type="password" 
                value={loginPass} 
                onChange={(e) => setLoginPass(e.target.value)} 
                placeholder="Sua senha" 
                className="w-full bg-white/80 dark:bg-slate-950/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-6 pl-12 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[var(--primary-color)] transition-all placeholder:text-slate-400 shadow-sm" 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative w-5 h-5">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                  className="peer hidden" 
                />
                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg peer-checked:bg-[var(--primary-color)] peer-checked:border-[var(--primary-color)] transition-all flex items-center justify-center group-hover:border-[var(--primary-color)]/50">
                  <CheckCircle2 size={12} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest group-hover:text-[var(--primary-color)] transition-colors">Salvar Acesso</span>
            </label>
          </div>

          <div className="space-y-4">
            <button type="submit" className="w-full gold-gradient text-white py-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-[0_10px_20px_-10px_rgba(212,175,55,0.4)] active:scale-95 hover:scale-[1.02] transition-all">
              Acessar
            </button>

            {showInstallBtn && (
              <button 
                type="button" 
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 hover:text-[var(--primary-color)] transition-all border border-slate-100 dark:border-slate-800 rounded-2xl active:scale-95"
              >
                <Smartphone size={14} />
                Instalar no Celular
              </button>
            )}
          </div>
          
          {loginError && (
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center animate-bounce">Credenciais incorretas</p>
          )}
        </form>

        <div className="flex flex-col items-center gap-2 mt-8 opacity-40">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">JG Creator</p>
          <div className="w-8 h-[1px] bg-slate-300 dark:bg-slate-700"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-inherit text-inherit pb-24 transition-colors duration-500">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-6 py-6 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <input type="file" ref={logoInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <div 
              onClick={() => auth.role === 'master' && logoInputRef.current?.click()} 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full gold-gradient flex items-center justify-center text-white shrink-0 shadow-lg cursor-pointer overflow-hidden border-2 border-white/20 hover:scale-105 active:scale-95 transition-all"
            >
              {studioLogoUrl ? (
                <img src={studioLogoUrl} className="w-full h-full object-cover" alt="Studio Logo" />
              ) : (
                React.cloneElement((BEAUTY_ICONS[studioIcon] || BEAUTY_ICONS['calendar']) as React.ReactElement<any>, { size: 32 })
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter gold-text-gradient uppercase leading-none truncate">{studioName}</h1>
              <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-slate-400 mt-2 truncate">{studioSubtitle}</p>
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(true)} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:scale-105 transition-all shrink-0"><Menu size={26} /></button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="flex flex-col items-center text-center space-y-1">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Profissional</span>
            <h2 className="text-3xl font-black gold-text-gradient uppercase tracking-tight">{auth.username}</h2>
          </div>
          <div className="w-full max-w-lg mx-auto flex items-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-[1.25rem] border border-slate-200/60 dark:border-slate-800/60 shadow-lg overflow-hidden flex-nowrap">
            <div className="flex items-center gap-1 p-1.5 bg-slate-50 dark:bg-slate-800/40 border-r shrink-0">
              <div className="relative">
                <select value={quickReportMonth} onChange={(e) => setQuickReportMonth(parseInt(e.target.value))} className="bg-white dark:bg-slate-800 text-[10px] font-black uppercase tracking-tighter h-8 pl-1.5 pr-4 rounded-lg appearance-none border-none outline-none cursor-pointer min-w-[45px]">
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
              </div>
              <div className="relative">
                <select value={quickReportYear} onChange={(e) => setQuickReportYear(parseInt(e.target.value))} className="bg-white dark:bg-slate-800 text-[10px] font-black uppercase tracking-tighter h-8 pl-1.5 pr-4 rounded-lg appearance-none border-none outline-none cursor-pointer min-w-[55px]">
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center gap-3 px-2 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0"><Users size={16} className="text-slate-400" /><span className="text-[14px] font-black text-slate-600 dark:text-slate-200">{isQuickValuesVisible ? quickSummary.count : '••'}</span></div>
              <div className="w-[1px] h-6 bg-slate-100 dark:bg-slate-800 shrink-0" />
              <div className="flex items-center gap-1.5 shrink-0 min-w-0"><Banknote size={16} className="text-emerald-500 shrink-0" /><span className="text-[14px] font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap truncate">{isQuickValuesVisible ? `R$ ${quickSummary.total.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '••••'}</span></div>
            </div>
            <button onClick={() => setIsQuickValuesVisible(!isQuickValuesVisible)} className="h-10 w-10 flex items-center justify-center border-l border-slate-100 dark:border-slate-800 shrink-0">{isQuickValuesVisible ? <Eye size={16} /> : <EyeOff size={16} />}</button>
          </div>
        </div>

        {auth.role === 'master' && (
          <div className="space-y-3">
            <button 
              onClick={() => { if(isDayBlocked){ alert('Este dia está bloqueado.'); return; } setEditingAppointment(null); setPreselectedTime(null); setIsFormOpen(true); }} 
              className={`w-full text-white font-bold px-4 py-5 rounded-2xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-tight text-sm hover:scale-[1.02] active:scale-95 transition-all group whitespace-nowrap ${isDayBlocked ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed grayscale' : 'gold-gradient'}`} 
              disabled={isDayBlocked}
            >
              <Plus size={24} />
              <span>Novo Agendamento</span>
            </button>
            <button 
              onClick={() => setIsMonthSlotsModalOpen(true)}
              className="w-full gold-gradient text-white font-bold px-4 py-5 rounded-2xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-tight text-sm hover:scale-[1.02] active:scale-95 transition-all group whitespace-nowrap"
            >
              <Clock size={24} className="group-hover:rotate-12 transition-transform" />
              <span>Horários Disponíveis do Mês</span>
            </button>
          </div>
        )}

        {!searchQuery.trim() && (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-700">
             <div className="p-6 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
                <button onClick={() => { const d = new Date(calendarViewDate); d.setMonth(d.getMonth() - 1); setCalendarViewDate(d); }} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"><ChevronLeft size={18} /></button>
                <div className="relative">
                  <button 
                    onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                    className="flex items-center gap-2 hover:opacity-70 transition-all p-1.5 rounded-xl group"
                  >
                    <CalendarRange size={18} className="text-[var(--primary-color)]" />
                    <span className="text-sm font-black uppercase tracking-widest">{FULL_MONTHS[calendarViewDate.getMonth()]} {calendarViewDate.getFullYear()}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isMonthPickerOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isMonthPickerOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] shadow-2xl z-[60] p-4 grid grid-cols-3 gap-2 animate-in fade-in zoom-in-95 duration-200">
                      {FULL_MONTHS.map((m, idx) => (
                        <button
                          key={m}
                          onClick={() => {
                            const d = new Date(calendarViewDate);
                            d.setMonth(idx);
                            setCalendarViewDate(d);
                            setIsMonthPickerOpen(false);
                          }}
                          className={`py-2 px-1 text-[9px] font-black uppercase rounded-xl transition-all border ${
                            calendarViewDate.getMonth() === idx 
                              ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-md' 
                              : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-[var(--primary-color)]/30 text-slate-500'
                          }`}
                        >
                          {MONTHS[idx]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => { const d = new Date(calendarViewDate); d.setMonth(d.getMonth() + 1); setCalendarViewDate(d); }} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"><ChevronRight size={18} /></button>
             </div>
             
             <div className="p-4 sm:p-6">
                <div className="grid grid-cols-7 mb-4">
                  {DAYS_ABBR.map(d => <div key={d} className="text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2 sm:gap-4">
                  {monthDays.map((dayNum, i) => {
                    if (dayNum === null) return <div key={`empty-${i}`} />;
                    
                    const dateObj = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), dayNum);
                    const key = dateObj.toISOString().split('T')[0];
                    const calIsSelected = selectedDate === key;
                    const calIsBlocked = auth.role === 'master' ? !!blockedDays[key] : false;
                    const calHasApps = (appointments || []).filter(a => {
                      if (a.date !== key) return false;
                      if (auth.role === 'partner') return a.partnerName === auth.username;
                      return true;
                    }).length > 0;
                    
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedDate(key);
                          if (auth.role === 'master' && !blockedDays[key]) {
                            setIsSlotsModalOpen(true);
                          }
                        }}
                        className={`aspect-square rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center relative transition-all border-2 ${
                          calIsSelected 
                            ? 'gold-gradient text-white border-transparent shadow-md scale-105 z-10' 
                            : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[var(--primary-color)]/30'
                        }`}
                      >
                        <span className={`text-xs sm:text-base font-black ${calIsBlocked && !calIsSelected ? 'text-red-500' : ''}`}>{dayNum}</span>
                        
                        <div className="flex gap-1 mt-1">
                          {calIsBlocked && (
                            <div className={`w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ${calIsSelected ? 'ring-2 ring-white' : ''}`} />
                          )}
                          {!calIsBlocked && calHasApps && (
                            <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${calIsSelected ? 'ring-2 ring-white' : ''}`} />
                          )}
                        </div>
                        
                        {calIsBlocked && calIsSelected && (
                          <div className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full text-white shadow-sm ring-2 ring-white">
                            <Lock size={8} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
             </div>
             
             <div className="border-t dark:border-slate-800">
                <div className="p-4 bg-slate-50/30 dark:bg-slate-800/20 flex justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Agendado</span>
                  </div>
                  {auth.role === 'master' && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bloqueado</span>
                    </div>
                  )}
                </div>

                <div className="h-[1px] bg-slate-100 dark:bg-slate-800 w-full" />

                <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 flex items-center justify-between gap-1">
                  <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center shadow-inner group transition-all hover:border-[var(--primary-color)]/30">
                       <span className="text-lg font-black text-[var(--primary-color)] leading-none">{(filteredAppointments || []).length}</span>
                    </div>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest text-center leading-tight truncate w-full">Agendados</span>
                  </div>

                  {auth.role === 'master' && (
                    <>
                      <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                        <button 
                          onClick={() => isDayBlocked ? handleUnblockDay() : setIsBlockModalOpen(true)}
                          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all border-2 shadow-sm ${
                            isDayBlocked 
                              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-500' 
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-red-200 hover:text-red-500'
                          }`}
                          title={isDayBlocked ? "Desbloquear Dia" : "Bloquear Dia"}
                        >
                          {isDayBlocked ? <Unlock size={20} /> : <CalendarOff size={20} />}
                        </button>
                        <span className={`text-[8px] font-black uppercase tracking-widest text-center leading-tight truncate w-full ${isDayBlocked ? 'text-red-500' : 'text-slate-400'}`}>
                          {isDayBlocked ? 'Desbloquear' : 'Bloquear Dia'}
                        </span>
                      </div>

                      {!isDayBlocked && (
                        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                          <button 
                            onClick={() => { setSelectedTimesForBlocking([]); setIsTimeBlockModalOpen(true); }}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all border-2 shadow-sm bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-red-200 hover:text-red-500"
                            title="Bloquear Horário"
                          >
                            <TimerOff size={20} />
                          </button>
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 text-center leading-tight truncate w-full">
                            Bloquear Horário
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
             </div>
          </div>
        )}

        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar por cliente..." className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl pl-12 pr-4 py-5 text-lg outline-none font-medium shadow-sm" />
        </div>

        {!searchQuery.trim() && (
          <div className="space-y-10 animate-in fade-in slide-in-from-top-4">
            
            {auth.role === 'master' && isDayBlocked && (
              <div className="bg-red-50 dark:bg-red-950/20 border-2 border-dashed border-red-200 dark:border-red-900/40 rounded-[2.5rem] p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto shadow-sm text-red-500">
                  <ShieldAlert size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase text-red-600 dark:text-red-400 tracking-widest">Dia Bloqueado</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2">{blockedDays[selectedDate]}</p>
                </div>
                <button onClick={handleUnblockDay} className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 hover:text-red-600 transition-colors">Remover Bloqueio</button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          {(filteredAppointments || []).length > 0 ? (filteredAppointments || []).map(app => (
            <AgendaItem key={app.id} appointment={app} onDelete={() => auth.role === 'master' && confirmDeleteAppointment(app.id)} onEdit={() => auth.role === 'master' && (setEditingAppointment(app), setIsFormOpen(true))} onShare={() => { setIsManualShare(true); setSharingAppointment(app); }} isEmployeeView={auth.role === 'partner'} commissionPercentage={auth.role === 'partner' ? currentPartnerCommission : ((partners || []).find(p => p.name === app.partnerName)?.commission || 100)} daysSinceLastVisit={null} />
          )) : <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 text-center text-slate-300 border-2 border-dashed border-slate-100 font-bold uppercase text-sm tracking-widest">Nenhum registro para esta data.</div>}
        </div>
      </main>

      {/* MODAL HORÁRIOS DISPONÍVEIS DO MÊS */}
      {isMonthSlotsModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
               <div className="flex flex-col">
                  <h3 className="text-xl font-black uppercase tracking-tight">Horários do Mês</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{FULL_MONTHS[calendarViewDate.getMonth()]} {calendarViewDate.getFullYear()}</p>
               </div>
               <button onClick={() => { setIsMonthSlotsModalOpen(false); setMonthSlotsSearch(''); }} className="p-2 text-slate-400 hover:scale-110 transition-transform"><X size={24} /></button>
            </div>

            <div className="px-8 pt-6 shrink-0">
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={monthSlotsSearch} 
                    onChange={(e) => setMonthSlotsSearch(e.target.value)} 
                    placeholder="Busque por horário, dia ou cliente..." 
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold outline-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 ring-[var(--primary-color)] transition-all"
                  />
               </div>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-10">
               {monthAvailability.map((day) => (
                 <div key={day.date} className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-4 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm py-2 z-10">
                       <div className="w-12 h-12 rounded-2xl gold-gradient flex flex-col items-center justify-center text-white shadow-md shrink-0">
                          <span className="text-lg font-black leading-none">{day.dayNum}</span>
                          <span className="text-[7px] font-bold uppercase tracking-widest">{DAYS_ABBR[new Date(day.date + 'T12:00:00').getDay()]}</span>
                       </div>
                       <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">{day.isBlocked ? 'BLOQUEADO' : `${day.available.standard.length + day.available.free.length} VAGOS`}</span>
                    </div>

                    {!day.isBlocked && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Vagos Padrão</p>
                           <div className="flex flex-wrap gap-2">
                              {day.available.standard.length > 0 ? day.available.standard.map(t => (
                                <button key={t} onClick={() => handleOpenAvailableTime(t, day.date)} className="px-2.5 py-1 rounded-lg border-2 border-dashed border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-500 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] transition-all">{t.replace(':', 'h')}</button>
                              )) : <span className="text-[8px] italic text-slate-200">Esgotado</span>}
                           </div>
                        </div>
                        <div className="space-y-3">
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Vagos Alternativo</p>
                           <div className="flex flex-wrap gap-2">
                              {day.available.free.length > 0 ? day.available.free.map(t => (
                                <button key={t} onClick={() => handleOpenAvailableTime(t, day.date)} className="px-2.5 py-1 rounded-lg border-2 border-dashed border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-500 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] transition-all">{t.replace(':', 'h')}</button>
                              )) : <span className="text-[8px] italic text-slate-200">Esgotado</span>}
                           </div>
                        </div>
                      </div>
                    )}

                    {day.appointments.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <p className="text-[8px] font-black text-[var(--primary-color)] uppercase tracking-widest ml-1">Agendamentos do Dia</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {day.appointments.map(app => (
                            <div key={app.id} className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 space-y-2">
                               <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                  <span className="text-[11px] font-black uppercase gold-text-gradient truncate pr-2">{app.clientName}</span>
                                  <div className="flex flex-col items-end shrink-0">
                                    <div className="flex items-center gap-1">
                                      <Clock size={8} className="text-slate-400" />
                                      <span className="text-[9px] font-bold text-slate-500">{app.time.replace(':', 'h')}</span>
                                    </div>
                                    {app.secondaryTime && (
                                      <div className="flex items-center gap-1">
                                        <Clock size={8} className="text-emerald-400" />
                                        <span className="text-[9px] font-bold text-emerald-500/70">{app.secondaryTime.replace(':', 'h')}</span>
                                      </div>
                                    )}
                                  </div>
                               </div>
                               <div className="space-y-1">
                                 <div className="flex items-center gap-1.5">
                                   <Sparkles size={10} className="text-[var(--primary-color)]" />
                                   <span className="text-[10px] font-medium text-slate-500 truncate">{app.procedure}</span>
                                 </div>
                                 {app.secondaryProcedure && (
                                   <div className="flex items-center gap-1.5 border-t border-slate-100/50 dark:border-slate-800/50 pt-1">
                                     <Sparkle size={10} className="text-emerald-500" />
                                     <span className="text-[10px] font-medium text-emerald-600/70 truncate">{app.secondaryProcedure}</span>
                                   </div>
                                 )}
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                 </div>
               ))}

               {monthAvailability.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-300 opacity-50">
                    <CalendarOff size={48} className="mb-4" />
                    <p className="font-bold uppercase tracking-widest text-xs">Nenhum horário disponível para a busca</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL BLOQUEAR HORÁRIO */}
      {isTimeBlockModalOpen && auth.role === 'master' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-sm shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
             <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
               <div className="flex flex-col">
                  <h3 className="text-xl font-black uppercase tracking-tight">Bloquear Horário</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{selectedDate.split('-').reverse().join('/')}</p>
               </div>
               <button onClick={() => { setIsTimeBlockModalOpen(false); setSelectedTimesForBlocking([]); }} className="p-2 text-slate-400 hover:scale-110 transition-transform"><X size={24} /></button>
             </div>
             
             <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-8">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horários Padrão Disponíveis:</p>
                   <div className="grid grid-cols-3 gap-2">
                      {slotsStatus.available.standard.sort().map(time => (
                        <button 
                          key={time} 
                          onClick={() => {
                            setSelectedTimesForBlocking(prev => 
                              prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
                            );
                          }}
                          className={`px-3 py-3 rounded-xl border-2 transition-all text-[11px] uppercase shadow-sm active:scale-95 font-bold ${
                            selectedTimesForBlocking.includes(time) 
                              ? 'bg-red-500 text-white border-red-600 border-solid' 
                              : 'border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:border-red-500 hover:text-red-500'
                          }`}
                        >
                          {time.replace(':', 'h')}
                        </button>
                      ))}
                      {slotsStatus.available.standard.length === 0 && (
                        <p className="col-span-3 text-center py-2 text-[9px] font-bold text-slate-300 uppercase">Esgotados</p>
                      )}
                   </div>
                </div>

                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horários Alternativos Disponíveis:</p>
                   <div className="grid grid-cols-3 gap-2">
                      {slotsStatus.available.free.sort().map(time => (
                        <button 
                          key={time} 
                          onClick={() => {
                            setSelectedTimesForBlocking(prev => 
                              prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
                            );
                          }}
                          className={`px-3 py-3 rounded-xl border-2 transition-all text-[11px] uppercase shadow-sm active:scale-95 font-bold ${
                            selectedTimesForBlocking.includes(time) 
                              ? 'bg-red-500 text-white border-red-600 border-solid' 
                              : 'border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:border-red-500 hover:text-red-500'
                          }`}
                        >
                          {time.replace(':', 'h')}
                        </button>
                      ))}
                      {slotsStatus.available.free.length === 0 && (
                        <p className="col-span-3 text-center py-2 text-[9px] font-bold text-slate-300 uppercase">Esgotados</p>
                      )}
                   </div>
                </div>

                {blockedTimes[selectedDate] && blockedTimes[selectedDate].length > 0 && (
                   <div className="space-y-4 pt-4 border-t dark:border-slate-800">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Remover Bloqueios de Hoje:</p>
                      <div className="flex flex-wrap gap-2">
                        {blockedTimes[selectedDate].map(time => (
                          <button 
                            key={time} 
                            onClick={() => handleUnblockTime(time)}
                            className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/20 border-2 border-amber-200 dark:border-amber-900/40 text-red-600 font-bold text-[11px] uppercase flex items-center gap-2"
                            title="Clique para desbloquear"
                          >
                            {time.replace(':', 'h')}
                            <X size={12} />
                          </button>
                        ))}
                      </div>
                   </div>
                )}
             </div>

             <div className="p-8 border-t dark:border-slate-800 flex gap-4">
                <button onClick={() => { setIsTimeBlockModalOpen(false); setSelectedTimesForBlocking([]); }} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl font-bold uppercase text-xs tracking-widest shadow-sm active:scale-95 transition-all">Cancelar</button>
                <button 
                  onClick={() => {
                    if (selectedTimesForBlocking.length > 0) {
                      const current = blockedTimes[selectedDate] || [];
                      const updated = { ...blockedTimes, [selectedDate]: [...current, ...selectedTimesForBlocking] };
                      setBlockedTimes(updated);
                      persistSettings({ updatedBlockedTimes: updated });
                    }
                    setIsTimeBlockModalOpen(false);
                    setSelectedTimesForBlocking([]);
                  }} 
                  className="flex-1 py-5 red-gradient text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  Bloquear
                </button>
             </div>
          </div>
        </div>
      )}

      {isSlotsModalOpen && auth.role === 'master' && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-l-[2.5rem] rounded-r-none w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar pr-2 animate-in zoom-in-95">
            <div className="flex justify-between items-center shrink-0">
               <div className="flex flex-col">
                 <h2 className="text-xl font-black uppercase tracking-tight">Disponibilidade</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{selectedDate.split('-').reverse().join('/')}</p>
               </div>
               <button onClick={() => { setIsSlotsModalOpen(false); setIsFreeTimesExpanded(false); }} className="p-2 text-slate-400 hover:scale-110 transition-transform"><X size={24} /></button>
            </div>

            <div className="space-y-10">
              {/* Horários Vagos */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 px-1">
                    <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em]">Horários Vagos</span>
                    <div className="h-[1px] flex-1 bg-emerald-100 dark:bg-emerald-950/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Padrão</p>
                    <div className="flex flex-wrap gap-2">
                      {slotsStatus.available.standard.length > 0 ? slotsStatus.available.standard.map(time => (
                        <button key={time} onClick={() => handleOpenAvailableTime(time)} className="px-3 py-1.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 font-bold hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] transition-all text-[11px] uppercase shadow-sm active:scale-95">
                          {time.replace(':', 'h')}
                        </button>
                      )) : <span className="text-[8px] text-slate-300 uppercase italic">Esgotado</span>}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Alternativo</p>
                    <div className="flex flex-wrap gap-2">
                      {slotsStatus.available.free.length > 0 ? (isFreeTimesExpanded ? slotsStatus.available.free : slotsStatus.available.free.slice(0, 6)).map(time => (
                        <button key={time} onClick={() => handleOpenAvailableTime(time)} className="px-3 py-1.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 font-bold hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] transition-all text-[11px] uppercase shadow-sm active:scale-95">
                          {time.replace(':', 'h')}
                        </button>
                      )) : <span className="text-[8px] text-slate-300 uppercase italic">Esgotado</span>}
                    </div>
                    {slotsStatus.available.free.length > 6 && (
                      <button 
                        onClick={() => setIsFreeTimesExpanded(!isFreeTimesExpanded)}
                        className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all border border-slate-100 dark:border-slate-100 flex items-center gap-1.5"
                      >
                        {isFreeTimesExpanded ? 'Recolher' : `+ ${slotsStatus.available.free.length - 6} mais`}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção: Agendamentos */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 px-1">
                    <span className="text-[11px] font-black text-[var(--primary-color)] uppercase tracking-[0.4em]">Agendamentos</span>
                    <div className="h-[1px] flex-1 bg-[var(--primary-color)]/10 dark:bg-amber-950/20" />
                </div>
                <div className="space-y-4">
                  {filteredAppointments.length > 0 ? filteredAppointments.map(app => (
                    <div key={app.id} className="p-4 rounded-3xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all group space-y-3">
                      {/* Cabeçalho: Nome e Ações */}
                      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 pb-2">
                        <div className="flex flex-col min-w-0">
                           <span className="text-sm font-black uppercase tracking-tight truncate gold-text-gradient">
                             {app.clientName}
                           </span>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                             Profissional: {app.partnerName || 'Daniele Dias'}
                           </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                           <button 
                             onClick={() => {
                               setEditingAppointment(app);
                               setIsSlotsModalOpen(false);
                               setIsFormOpen(true);
                             }}
                             className="p-2 text-slate-400 hover:text-[var(--primary-color)] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-100"
                             title="Editar"
                           >
                             <Edit2 size={14} />
                           </button>
                           <button 
                             onClick={() => {
                               setAppointmentToDelete(app.id);
                               setIsSlotsModalOpen(false);
                             }}
                             className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-100"
                             title="Excluir"
                           >
                             <Trash2 size={14} />
                           </button>
                        </div>
                      </div>

                      {/* Resumo dos Procedimentos */}
                      <div className="space-y-2">
                        {/* Procedimento 01 */}
                        <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                           <div className="flex flex-col items-center justify-center min-w-[45px] border-r border-slate-200 dark:border-slate-700/50 pr-2">
                             <Clock size={10} className="text-[var(--primary-color)] mb-0.5" />
                             <span className="text-[10px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-300">
                               {app.time.replace(':', 'h')}
                             </span>
                           </div>
                           <div className="flex flex-col min-w-0">
                             <div className="flex items-center gap-1.5">
                               <Sparkles size={11} className="text-[var(--primary-color)]" />
                               <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
                                 {app.procedure}
                               </span>
                             </div>
                           </div>
                        </div>

                        {/* Procedimento 02 (Opcional) */}
                        {app.secondaryTime && app.secondaryProcedure && (
                          <div className="flex items-center gap-3 bg-emerald-50/30 dark:bg-emerald-950/10 p-2 rounded-2xl border border-emerald-100/20 dark:border-emerald-900/20">
                             <div className="flex items-center gap-3 bg-emerald-50/30 dark:bg-emerald-950/10 p-2 rounded-2xl border border-emerald-100/20 dark:border-emerald-900/20">
                               <div className="flex flex-col items-center justify-center min-w-[45px] border-r border-emerald-100/50 dark:border-emerald-900/30 pr-2">
                                 <Clock size={10} className="text-emerald-500 mb-0.5" />
                                 <span className="text-[10px] font-black uppercase tracking-tight text-emerald-600 dark:text-emerald-400">
                                   {app.secondaryTime.replace(':', 'h')}
                                 </span>
                               </div>
                               <div className="flex flex-col min-w-0">
                                 <div className="flex items-center gap-1.5">
                                   <Sparkle size={11} className="text-emerald-500" />
                                   <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wide truncate">
                                     {app.secondaryProcedure}
                                   </span>
                                 </div>
                               </div>
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-300 border-2 border-dashed rounded-[2rem]">
                      <CalendarOff size={32} className="mb-2 opacity-20" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] ml-1">Nenhum horário ocupado</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Seção: Horários Bloqueados */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 px-1">
                    <span className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em]">Horários Bloqueados</span>
                    <div className="h-[1px] flex-1 bg-red-50 dark:bg-red-950/20" />
                </div>
                <div className="space-y-3">
                  {blockedTimes[selectedDate] && blockedTimes[selectedDate].length > 0 ? [...blockedTimes[selectedDate]].sort().map(time => (
                    <div key={time} className="flex items-center justify-between p-4 rounded-2xl border-2 border-dashed border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 transition-all">
                      <div className="flex items-center gap-4 min-w-0">
                         <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[10px] bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 shrink-0">
                           {time.replace(':', 'h')}
                         </div>
                         <div className="flex flex-col min-w-0">
                           <span className="text-xs font-black uppercase tracking-tight truncate text-red-600">
                             Horário Indisponível
                           </span>
                         </div>
                      </div>
                      <button 
                        onClick={() => handleUnblockTime(time)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all border border-red-100 bg-white"
                        title="Remover Bloqueio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )) : (
                    <span className="text-[8px] text-slate-300 uppercase italic ml-1">Nenhum bloqueio aplicado</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t dark:border-slate-800">
               <button 
                 onClick={() => { setIsSlotsModalOpen(false); setIsFreeTimesExpanded(false); setIsFormOpen(true); }}
                 className="w-full gold-gradient text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
               >
                 <Plus size={18} />
                 <span>Novo Agendamento</span>
               </button>
            </div>
          </div>
        </div>
      )}

      {isBlockModalOpen && auth.role === 'master' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-sm p-10 space-y-8 animate-in zoom-in-95">
             <div className="flex justify-between items-center">
               <div className="flex flex-col">
                  <h3 className="text-xl font-black uppercase tracking-tight">Bloquear Dia</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{selectedDate.split('-').reverse().join('/')}</p>
               </div>
               <button onClick={() => setIsBlockModalOpen(false)} className="p-2 text-slate-400"><X size={24} /></button>
             </div>
             <div className="space-y-4">
                <p className="text-sm text-slate-400 uppercase font-bold tracking-widest">Informe o motivo do bloqueio:</p>
                <textarea 
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ex: Treinamento, Folga, Reforma..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border p-4 rounded-2xl outline-none focus:ring-2 ring-red-500 font-bold text-sm h-32"
                />
             </div>
             <div className="flex gap-4">
                <button onClick={() => setIsBlockModalOpen(false)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl font-bold uppercase text-xs tracking-widest">Cancelar</button>
                <button onClick={handleBlockDay} className="flex-1 py-5 red-gradient text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-lg">Bloquear</button>
             </div>
          </div>
        </div>
      )}

      {isCropModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[4px] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
             <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
               <div>
                 <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight">Ajustar Foto da Logo</h2>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Arraste e use o zoom para enquadrar</p>
               </div>
               <button onClick={() => setIsCropModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
             </div>
             <div className="flex-1 p-6 bg-slate-200 dark:bg-slate-950 flex items-center justify-center overflow-hidden min-h-[300px]">
               <div className="w-full h-full max-h-[450px] relative">
                  <img ref={cropImageRef} src={tempImageToCrop || ''} onLoad={initCropper} className="max-w-full block" alt="Foto para recortar" />
               </div>
             </div>
             <div className="p-6 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex gap-4">
                <button onClick={() => setIsCropModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl font-bold uppercase text-xs tracking-widest active:scale-95 transition-all">Cancelar</button>
                <button onClick={handleSaveCrop} className="flex-1 py-4 gold-gradient text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Save size={18} />
                  <span>Salvar Logo</span>
                </button>
             </div>
          </div>
        </div>
      )}

      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-full max-w-[300px] bg-white dark:bg-slate-900 h-full shadow-2xl p-8 flex flex-col">
            <div className="flex justify-between items-center mb-12">
               <h2 className="text-3xl font-black dark:text-white uppercase tracking-[0.2em]">MENU</h2>
               <button onClick={() => setIsMenuOpen(false)} className="p-3 text-slate-400 hover:scale-110 transition-transform shrink-0"><X size={28} /></button>
            </div>
            <nav className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-4">
              {auth.role === 'master' ? (
                <>
                  {[
                    { label: 'Clientes', icon: <Users size={22} />, action: () => setIsClientsOpen(true) },
                    { label: 'Histórico', icon: <HistoryIcon size={22} />, action: () => setIsHistoryOpen(true) },
                    { label: 'Procedimentos', icon: <Sparkle size={22} />, action: () => setIsProceduresOpen(true) },
                    { label: 'Horários', icon: <Clock size={22} />, action: () => setIsTimesOpen(true) },
                    { label: 'Despesas', icon: <ShoppingBag size={22} />, action: () => setIsExpensesOpen(true) },
                    { label: 'Financeiro', icon: <Briefcase size={22} />, action: () => setIsFinanceOpen(true) },
                    { label: 'Parceiras', icon: <HardHat size={22} />, action: () => setIsPartnersOpen(true) },
                    { label: 'Ajustes', icon: <Settings size={22} />, action: () => setIsSettingsOpen(true) }
                  ].map((item, idx) => (
                    <button key={idx} onClick={() => { item.action(); setIsMenuOpen(false); }} className="w-full flex items-center gap-5 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:border-[var(--primary-color)] font-bold uppercase tracking-widest text-xs">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm text-[var(--primary-color)] shrink-0">{item.icon}</div>
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-dashed border-slate-200 text-center space-y-4 mb-6"><ShieldCheck size={40} className="mx-auto text-[var(--primary-color)]" /><p className="text-xs font-bold text-slate-400 uppercase">Acesso Profissional</p></div>
                  <button onClick={() => { setIsFinanceOpen(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-5 p-5 rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 font-bold uppercase tracking-widest text-xs"><div className="p-2.5 bg-white shadow-sm text-[var(--primary-color)] shrink-0"><Briefcase size={22} /></div><span>Meu Financeiro</span></button>
                </>
              )}
              <button onClick={handleLogout} className="w-full flex items-center gap-5 p-5 rounded-2xl bg-red-50 text-red-600 mt-8 border border-red-100 font-bold text-xs uppercase tracking-widest"><LogOut size={22} /><span>Sair</span></button>
            </nav>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-l-[2.5rem] rounded-r-none w-full max-lg shadow-2xl p-6 sm:p-8 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="flex justify-between items-center shrink-0">
               <div className="flex flex-col">
                 <h2 className="text-xl font-black uppercase tracking-tight">Ajustes</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Identidade & Visual</p>
               </div>
               <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-slate-400"><X size={24} /></button>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-2 ml-1">
                 <LayoutGrid size={16} className="text-[var(--primary-color)]" />
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidade</h4>
               </div>
               <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center text-white shrink-0 shadow-md overflow-hidden border-2 border-white/20">
                      {studioLogoUrl ? (
                        <img src={studioLogoUrl} className="w-full h-full object-cover" alt="Studio Logo" />
                      ) : (
                        React.cloneElement((BEAUTY_ICONS[studioIcon] || BEAUTY_ICONS['calendar']) as React.ReactElement<any>, { size: 28 })
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Logo do Studio</span>
                      <button 
                        onClick={() => logoInputRef.current?.click()} 
                        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest text-[var(--primary-color)] hover:bg-slate-50 transition-colors"
                      >
                        <ImageIcon size={14} />
                        Alterar Foto
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Studio</label>
                    <input 
                      value={studioName} 
                      onChange={e => setStudioName(e.target.value)} 
                      className="w-full bg-white dark:bg-slate-900 p-3.5 rounded-xl text-sm font-bold border outline-none shadow-sm focus:border-[var(--primary-color)] transition-all" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Slogan / Subtítulo</label>
                    <input 
                      value={studioSubtitle} 
                      onChange={e => setStudioSubtitle(e.target.value)} 
                      className="w-full bg-white dark:bg-slate-900 p-3.5 rounded-xl text-sm font-bold border outline-none shadow-sm focus:border-[var(--primary-color)] transition-all" 
                    />
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-2 ml-1">
                 <Palette size={16} className="text-[var(--primary-color)]" />
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estilo & Cores</h4>
               </div>
               <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Aparência Geral</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {id: 'light', label: 'Claro', icon: <Sun size={12} />},
                        {id: 'dark', label: 'Escuro', icon: <Moon size={12} />},
                        {id: 'system', label: 'Auto', icon: <LayoutGrid size={12} />}
                      ].map(m => (
                        <button 
                          key={m.id} 
                          onClick={() => setThemeMode(m.id as AppearanceMode)}
                          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-[9px] font-black uppercase transition-all ${themeMode === m.id ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-md' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800'}`}
                        >
                          {m.icon}
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Paleta de Cores</label>
                    <div className="grid grid-cols-3 gap-2 px-0.5">
                      {COLOR_PALETTES.map(palette => (
                        <button 
                          key={palette.id} 
                          onClick={() => setCurrentTheme(palette)} 
                          className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border transition-all text-[9px] font-black uppercase whitespace-nowrap ${currentTheme.id === palette.id ? 'border-[var(--primary-color)] bg-white dark:bg-slate-800 shadow-sm' : 'border-transparent bg-white/50 dark:bg-slate-900/50 text-slate-400'}`}
                        >
                          <div className="w-2.5 h-2.5 rounded-full shadow-inner shrink-0" style={{ backgroundColor: palette.id === 'custom' ? customColor : palette.primary }} />
                          <span className="truncate">{palette.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {currentTheme.id === 'custom' && (
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" />
                          <span className="text-[10px] font-mono font-bold uppercase">{customColor}</span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Escolha o tom</span>
                      </div>
                    </div>
                  )}
               </div>
            </div>

            <div className="pt-2 border-t dark:border-slate-800">
               <button 
                 onClick={saveSettings} 
                 disabled={savingSettings} 
                 className="w-full gold-gradient text-white py-4 rounded-xl font-bold uppercase text-[10px] tracking-[0.3em] shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
               >
                 {savingSettings ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /><span>Salvar Ajustes</span></>}
               </button>
            </div>
          </div>
        </div>
      )}

      {isPartnersOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-l-[2.5rem] rounded-r-none w-full max-w-2xl shadow-2xl p-6 sm:p-8 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="flex justify-between items-center shrink-0">
               <div className="flex flex-col">
                 <h2 className="text-xl font-black uppercase tracking-tight">Parceiras</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gestão de Equipe & Acessos</p>
               </div>
               <button onClick={() => setIsPartnersOpen(false)} className="p-2 text-slate-400 hover:scale-110 transition-transform"><X size={24} /></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <UserPlus size={18} className="text-[var(--primary-color)]" />
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nova Parceira</h3>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome</label>
                      <input value={newPartnerName} onChange={e => setNewPartnerName(e.target.value)} placeholder="Nome completo" className="w-full bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-bold border outline-none shadow-sm focus:border-[var(--primary-color)] transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Comissão (%)</label>
                      <input type="number" value={newPartnerCommission} onChange={e => setNewPartnerCommission(parseInt(e.target.value))} className="w-full bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-bold border outline-none shadow-sm focus:border-[var(--primary-color)] transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" value={newPartnerPass} onChange={e => setNewPartnerPass(e.target.value)} className="w-full bg-white dark:bg-slate-900 p-3 pl-10 rounded-xl text-sm font-bold border outline-none shadow-sm focus:border-[var(--primary-color)] transition-all" />
                    </div>
                  </div>
                  <button onClick={handleAddPartner} className="w-full gold-gradient text-white py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] shadow-lg active:scale-95 transition-all">Cadastrar Profissional</button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Users size={18} className="text-[var(--primary-color)]" />
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipe Ativa</h3>
                </div>
                <div className="space-y-3">
                  {partners.map((p, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800/40 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-[var(--primary-color)]/30">
                      {editingPartnerIdx === i ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input value={editPartnerName} onChange={e => setEditPartnerName(e.target.value)} placeholder="Nome" className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-sm font-bold border outline-none" />
                            <input value={editPartnerLogin} onChange={e => setEditPartnerLogin(e.target.value)} placeholder="Login" className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-sm font-bold border outline-none" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input value={editPartnerPass} onChange={e => setEditPartnerPass(e.target.value)} placeholder="Senha" className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-sm font-bold border outline-none" />
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border">
                              <Percent size={14} className="text-slate-400" />
                              <input type="number" value={editPartnerCommission} onChange={e => setEditPartnerCommission(parseInt(e.target.value))} className="bg-transparent text-sm font-bold outline-none w-full" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleUpdatePartner} className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl font-bold uppercase text-[9px] tracking-widest active:scale-95 transition-all">Salvar</button>
                            <button onClick={() => setEditingPartnerIdx(null)} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl font-bold uppercase text-[9px] tracking-widest active:scale-95 transition-all">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-full bg-[var(--primary-color)]/10 flex items-center justify-center text-[var(--primary-color)] shrink-0">
                              <User size={24} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black uppercase tracking-tight truncate">{p.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-[var(--primary-color)] uppercase">Login: {p.login}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                <span className="text-[10px] font-bold text-emerald-500 uppercase">{p.commission}% Comis.</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingPartnerIdx(i); setEditPartnerName(p.name); setEditPartnerLogin(p.login); setEditPartnerPass(p.password); setEditPartnerCommission(p.commission); }} className="p-3 text-slate-300 hover:text-[var(--primary-color)] hover:bg-var(--primary-color)/10 dark:hover:bg-slate-700 rounded-xl transition-all">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDeletePartner(i)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-xl transition-all">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isClientsOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-l-[2.5rem] rounded-r-none w-full max-w-2xl shadow-2xl p-6 sm:p-10 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <h2 className="text-2xl font-black uppercase tracking-tight">Clientes</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{clients?.length} registros encontrados</span>
              </div>
              <button onClick={() => setIsClientsOpen(false)} className="p-2 text-slate-400"><X size={28} /></button>
            </div>
            
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
                <input type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Procurar cliente..." className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 sm:p-5 pl-14 text-lg font-bold outline-none" />
              </div>
              <button onClick={() => vcfInputRef.current?.click()} className="p-4 sm:p-5 bg-[var(--primary-color)]/10 text-[var(--primary-color)] rounded-2xl hover:bg-[var(--primary-color)] hover:text-white transition-all group" title="Importar contatos (VCF)">
                <FileUp size={24} />
              </button>
              <input type="file" ref={vcfInputRef} onChange={handleVCFUpload} accept=".vcf" className="hidden" />
            </div>

            <div className="space-y-4">
              {(clients || []).filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map((c, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border group shadow-sm hover:border-[var(--primary-color)] transition-colors">
                  {editingClientName === c.name ? (
                    <div className="flex-1 flex gap-3">
                      <div className="flex-1 space-y-2">
                        <input value={editClientName} onChange={e => setEditClientName(e.target.value)} className="w-full bg-white dark:bg-slate-900 p-4 rounded-xl text-sm font-bold border" placeholder="Nome" />
                        <input value={editClientPhone} onChange={e => setEditClientPhone(e.target.value)} className="w-full bg-white dark:bg-slate-900 p-4 rounded-xl text-sm font-bold border" placeholder="WhatsApp" />
                      </div>
                      <button onClick={() => handleUpdateClient(c.name)} className="p-4 bg-emerald-500 text-white rounded-xl self-center shadow-md active:scale-95 transition-all"><CheckCircle2 size={20} /></button>
                      <button onClick={() => setEditingClientName(null)} className="p-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl self-center active:scale-95 transition-all"><X size={20} /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center min-w-0 overflow-hidden pr-4">
                        <div className="min-w-0">
                          <p className="text-base font-bold truncate text-slate-700 dark:text-slate-200">{c.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest truncate">{c.whatsapp}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => { setEditingClientName(c.name); setEditClientName(c.name); setEditClientPhone(c.whatsapp); }} className="p-3 text-slate-400 hover:text-[var(--primary-color)] hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteClient(c.name)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isHistoryOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-l-[2.5rem] rounded-r-none w-full max-w-4xl shadow-2xl p-6 sm:p-10 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar pr-2">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-black uppercase tracking-tight">Histórico</h2>
               <button onClick={() => setIsHistoryOpen(false)} className="p-2 text-slate-400"><X size={28} /></button>
             </div>
             
             <div className="space-y-3 mb-8 w-full">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" value={historySearchQuery} onChange={(e) => setHistorySearchQuery(e.target.value)} placeholder="Buscar por cliente..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 pl-10 text-[11px] font-bold outline-none focus:ring-2 ring-[var(--primary-color)] transition-all" />
                </div>
                
                <div className="flex items-center gap-2 flex-nowrap w-full">
                   <div className="relative flex-1 min-w-0">
                     <select value={historyPartnerFilter} onChange={(e) => setHistoryPartnerFilter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-2.5 px-3 text-[11px] font-bold outline-none appearance-none cursor-pointer truncate">
                       <option value="all">Profissionais</option>
                       <option value="Daniele Dias">Daniele Dias</option>
                       {(partners || []).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                     </select>
                     <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                   </div>
                   <div className="relative flex-[0.7] min-w-[65px]">
                     <select value={historyMonth} onChange={(e) => setHistoryMonth(parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-2.5 px-3 text-[11px] font-bold outline-none appearance-none cursor-pointer">
                       {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                     </select>
                     <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                   </div>
                   <div className="relative flex-[0.8] min-w-[75px]">
                     <select value={historyYear} onChange={(e) => setHistoryYear(parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-2.5 px-3 text-[11px] font-bold outline-none appearance-none cursor-pointer">
                       {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                     </select>
                     <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                   </div>
                </div>
             </div>

             <div className="space-y-12">
                {Object.keys(groupedHistory).length > 0 ? Object.entries(groupedHistory).map(([date, apps]) => (
                  <div key={date} className="space-y-6">
                    <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur py-4 px-6 rounded-[1.5rem] border-2 flex justify-between items-center shadow-md">
                      <div className="flex items-center gap-3 min-w-0"><CalendarDays size={18} className="text-[var(--primary-color)] shrink-0" /><h3 className="text-xs font-black uppercase tracking-[0.2em] truncate">{date.split('-').reverse().join('/')}</h3></div>
                      <span className="text-[10px] font-black text-slate-400 shrink-0">{(apps as Appointment[]).length} Atendimentos</span>
                    </div>
                    <div className="grid grid-cols-1 gap-6">{(apps as Appointment[]).map(app => <AgendaItem key={app.id} appointment={app} isHistory onDelete={() => confirmDeleteAppointment(app.id)} onEdit={() => { setEditingAppointment(app); setIsFormOpen(true); setIsHistoryOpen(false); }} daysSinceLastVisit={null} />)}</div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                    <HistoryIcon size={60} className="mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-sm">Nenhum registro encontrado</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {isProceduresOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-l-[2.5rem] rounded-r-none w-full max-w-2xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="flex justify-between items-center shrink-0">
               <h2 className="text-xl font-bold uppercase tracking-tight">Procedimentos</h2>
               <button onClick={() => setIsProceduresOpen(false)} className="p-2 text-slate-400"><X size={24} /></button>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                 <div className="flex items-center gap-2 px-1">
                    <Sparkles size={18} className="text-[var(--primary-color)]" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Principais</h3>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="flex gap-1.5 items-center">
                       <input 
                         value={newProcName} 
                         onChange={e => setNewProcName(e.target.value)} 
                         placeholder="Novo procedimento" 
                         className="flex-1 bg-white dark:bg-slate-900 p-2 rounded-xl text-[10px] font-bold border outline-none min-w-0" 
                       />
                       <select 
                         value={newProcDuration} 
                         onChange={e => setNewProcDuration(e.target.value)} 
                         className="bg-white dark:bg-slate-900 p-2 rounded-xl text-[10px] font-bold border outline-none min-[65px] appearance-none"
                       >
                          {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                       <button 
                         onClick={handleAddProcedure} 
                         className="p-2 gold-gradient text-white rounded-xl active:scale-95 transition-all shrink-0"
                       >
                         <Plus size={16} />
                       </button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    {procedures.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-100 shadow-sm min-h-[56px]">
                         {editingProcIdx === i ? (
                           <div className="flex-1 flex gap-1 items-center min-w-0">
                              <input 
                                value={editingProcName} 
                                onChange={e => setEditingProcName(e.target.value)} 
                                className="flex-1 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg text-[10px] font-bold border outline-none min-w-0" 
                              />
                              <select 
                                value={editingProcDuration} 
                                onChange={e => setEditingProcDuration(e.target.value)} 
                                className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg text-[10px] font-bold border outline-none min-w-[55px] appearance-none text-center"
                              >
                                 {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                              <button onClick={handleUpdateProcedure} className="p-1.5 bg-emerald-500 text-white rounded-lg shrink-0"><CheckCircle2 size={14} /></button>
                              <button onClick={() => setEditingProcIdx(null)} className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg shrink-0"><X size={14} /></button>
                           </div>
                         ) : (
                           <>
                             <div className="flex flex-col min-w-0"><span className="text-xs font-bold truncate">{p.name}</span><span className="text-[10px] text-slate-400 uppercase font-black">{formatDurationDisplay(p.duration)}</span></div>
                             <div className="flex items-center gap-0.5 shrink-0">
                               <button 
                                 onClick={() => { setEditingProcIdx(i); setEditingProcName(p.name); setEditingProcDuration(p.duration); }} 
                                 className="p-1.5 text-slate-300 hover:text-[var(--primary-color)] transition-colors"
                               >
                                 <Edit2 size={15} />
                               </button>
                               <button 
                                 onClick={() => handleDeleteProcedure(i)} 
                                 className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                               >
                                 <Trash2 size={15} />
                               </button>
                             </div>
                           </>
                         )}
                      </div>
                    ))}
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-2 px-1">
                    <Sparkle size={18} className="text-emerald-500" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Adicionais</h3>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="flex gap-1.5 items-center">
                       <input 
                         value={newSecProcName} 
                         onChange={e => setNewSecProcName(e.target.value)} 
                         placeholder="Novo adicional" 
                         className="flex-1 bg-white dark:bg-slate-900 p-2 rounded-xl text-[10px] font-bold border outline-none min-w-0" 
                       />
                       <select 
                         value={newSecProcDuration} 
                         onChange={e => setNewSecProcDuration(e.target.value)} 
                         className="bg-white dark:bg-slate-900 p-2 rounded-xl text-[10px] font-bold border outline-none min-[65px] appearance-none"
                       >
                          {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                       <button 
                         onClick={handleAddSecProcedure} 
                         className="p-2 bg-emerald-500 text-white rounded-xl active:scale-95 transition-all shrink-0"
                       >
                         <Plus size={16} />
                       </button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    {secondaryProcedures.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-100 shadow-sm min-h-[56px]">
                         {editingSecProcIdx === i ? (
                           <div className="flex-1 flex gap-1 items-center min-w-0">
                              <input 
                                value={editingSecProcName} 
                                onChange={e => setEditingSecProcName(e.target.value)} 
                                className="flex-1 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg text-[10px] font-bold border outline-none min-w-0" 
                              />
                              <select 
                                value={editingSecProcDuration} 
                                onChange={e => setEditingSecProcDuration(e.target.value)} 
                                className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg text-[10px] font-bold border outline-none min-w-[55px] appearance-none text-center"
                              >
                                 {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                              <button onClick={handleUpdateSecProcedure} className="p-1.5 bg-emerald-500 text-white rounded-lg shrink-0"><CheckCircle2 size={14} /></button>
                              <button onClick={() => setEditingSecProcIdx(null)} className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg shrink-0"><X size={14} /></button>
                           </div>
                         ) : (
                           <>
                             <div className="flex flex-col min-w-0"><span className="text-xs font-bold truncate">{p.name}</span><span className="text-[10px] text-slate-400 uppercase font-black">{formatDurationDisplay(p.duration)}</span></div>
                             <div className="flex items-center gap-0.5 shrink-0">
                               <button 
                                 onClick={() => { setEditingSecProcIdx(i); setEditingSecProcName(p.name); setEditingProcDuration(p.duration); }} 
                                 className="p-1.5 text-slate-300 hover:text-[var(--primary-color)] transition-colors"
                               >
                                 <Edit2 size={15} />
                               </button>
                               <button 
                                 onClick={() => handleDeleteSecProcedure(i)} 
                                 className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                               >
                                 <Trash2 size={15} />
                               </button>
                             </div>
                           </>
                         )}
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isTimesOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-l-[2.5rem] rounded-r-none w-full max-w-2xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="flex justify-between items-center shrink-0">
               <h2 className="text-xl font-bold uppercase tracking-tight">Horários</h2>
               <button onClick={() => setIsTimesOpen(false)} className="p-2 text-slate-400"><X size={24} /></button>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                 <div className="flex items-center gap-2 px-1">
                    <Clock size={18} className="text-[var(--primary-color)]" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Horários Padrão</h3>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="flex gap-1.5 items-center">
                       <input 
                         type="time"
                         value={newTime} 
                         onChange={e => setNewTime(e.target.value)} 
                         className="flex-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl text-sm font-bold border outline-none" 
                       />
                       <button 
                         onClick={handleAddTime} 
                         className="p-2.5 gold-gradient text-white rounded-xl active:scale-95 transition-all shrink-0"
                       >
                         <Plus size={20} />
                       </button>
                    </div>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {userTimes.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800/40 rounded-full border border-slate-100 dark:border-slate-100 shadow-sm min-h-[40px]">
                         {editingStandardTimeIdx === i ? (
                           <div className="flex items-center gap-1.5">
                             <input 
                               type="time" 
                               value={tempTimeEditValue} 
                               onChange={e => setTempTimeEditValue(e.target.value)} 
                               className="bg-slate-50 dark:bg-slate-900 p-1 rounded-md text-xs font-bold border outline-none w-20"
                             />
                             <button onClick={handleUpdateStandardTime} className="p-1 text-emerald-500 hover:scale-110 transition-transform"><CheckCircle2 size={14} /></button>
                             <button onClick={() => setEditingStandardTimeIdx(null)} className="p-1 text-slate-400 hover:scale-110 transition-transform"><X size={14} /></button>
                           </div>
                         ) : (
                           <>
                             <span className="text-xs font-bold">{t}</span>
                             <div className="flex items-center gap-1">
                               <button 
                                 onClick={() => { setEditingStandardTimeIdx(i); setTempTimeEditValue(t); }} 
                                 className="p-1 text-slate-300 hover:text-[var(--primary-color)] transition-colors"
                               >
                                 <Edit2 size={14} />
                               </button>
                               <button 
                                 onClick={() => handleDeleteTime(t)} 
                                 className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                               >
                                 <X size={14} />
                               </button>
                             </div>
                           </>
                         )}
                      </div>
                    ))}
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-2 px-1">
                    <Clock size={18} className="text-emerald-500" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Horários Alternativos</h3>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="flex gap-1.5 items-center">
                       <input 
                         type="time"
                         value={newFreeTime} 
                         onChange={e => setNewFreeTime(e.target.value)} 
                         className="flex-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl text-sm font-bold border outline-none" 
                       />
                       <button 
                         onClick={handleAddFreeTime} 
                         className="p-2.5 bg-emerald-500 text-white rounded-xl active:scale-95 transition-all shrink-0"
                       >
                         <Plus size={20} />
                       </button>
                    </div>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {userFreeTimes.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800/40 rounded-full border border-slate-100 dark:border-slate-100 shadow-sm min-h-[40px]">
                         {editingFreeTimeIdx === i ? (
                           <div className="flex items-center gap-1.5">
                             <input 
                               type="time" 
                               value={tempTimeEditValue} 
                               onChange={e => setTempTimeEditValue(e.target.value)} 
                               className="bg-slate-50 dark:bg-slate-900 p-1 rounded-md text-xs font-bold border outline-none w-20"
                             />
                             <button onClick={handleUpdateFreeTime} className="p-1 text-emerald-500 hover:scale-110 transition-transform"><CheckCircle2 size={14} /></button>
                             <button onClick={() => setEditingFreeTimeIdx(null)} className="p-1 text-slate-400 hover:scale-110 transition-transform"><X size={14} /></button>
                           </div>
                         ) : (
                           <>
                             <span className="text-xs font-bold">{t}</span>
                             <div className="flex items-center gap-1">
                               <button 
                                 onClick={() => { setEditingFreeTimeIdx(i); setTempTimeEditValue(t); }} 
                                 className="p-1 text-slate-300 hover:text-[var(--primary-color)] transition-colors"
                               >
                                 <Edit2 size={14} />
                               </button>
                               <button 
                                 onClick={() => handleDeleteTime(t)} 
                                 className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                               >
                                 <X size={14} />
                               </button>
                             </div>
                           </>
                         )}
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isExpensesOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-l-[2.5rem] rounded-r-none w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="flex justify-between items-center shrink-0">
               <div className="flex flex-col">
                 <h2 className="text-xl font-black uppercase tracking-tight">Despesas</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Análise de Gastos</p>
               </div>
               <button onClick={() => setIsExpensesOpen(false)} className="p-2 text-slate-400"><X size={24} /></button>
            </div>

            <div className="grid grid-cols-4 gap-2 shrink-0">
              {[
                {l: 'Dia', v: expenseDay, s: setExpenseDay, d: DAYS_OF_MONTH}, 
                {l: 'Semana', v: expenseWeek, s: setExpenseWeek, d: WEEKS}, 
                {l: 'Mês', v: expenseMonth, s: setExpenseMonth, d: MONTHS}, 
                {l: 'Ano', v: expenseYear, s: setExpenseYear, d: YEARS}
              ].map((f, i) => (
                <div key={i} className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{f.l}</label>
                  <div className="relative">
                    <select value={f.v} onChange={(e) => f.s(parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-2.5 text-[10px] font-bold outline-none appearance-none focus:ring-2 ring-red-500">
                      {f.d.map((val, idx) => <option key={idx} value={typeof val === 'string' && val === 'Todo' ? 0 : (i === 2 ? idx : (i === 3 ? val : idx))}>{val}</option>)}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={10} /></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 sm:p-6 red-gradient rounded-[2rem] text-white flex flex-col items-center text-center shadow-xl shrink-0 mx-2">
              <div className="bg-white/20 p-2.5 rounded-2xl mb-3"><ShoppingBag size={24} /></div>
              <span className="text-[9px] font-black uppercase tracking-[0.1em] opacity-80 whitespace-nowrap">Total de Despesas Mensais</span>
              <p className="text-3xl sm:text-4xl font-black tracking-tighter mt-0.5">R$ {expenseSummary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <div className="mt-4 px-6 py-1.5 bg-black/10 rounded-full border text-[9px] font-black uppercase tracking-[0.3em]">{expenseSummary.count} Lançamentos</div>
              
              <div className="mt-4 pt-4 border-t border-white/20 w-full max-w-[200px]">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-70">Gasto Total em {expenseYear}</span>
                <p className="text-lg font-black mt-0.5">R$ {annualExpenseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t dark:border-slate-800 px-2">
               <div className="flex items-center gap-2 mb-1"><Plus size={14} className="text-red-500" /><h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Novo Lançamento</h4></div>
               <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-[1.5rem] border space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <input value={newExpName} onChange={e => setNewExpName(e.target.value)} placeholder="Descrição da despesa" className="w-full bg-white dark:bg-slate-900 p-3 rounded-xl text-[11px] font-bold shadow-sm outline-none border focus:border-red-500" />
                    <input type="text" value={newExpValue} onChange={e => setNewExpValue(e.target.value)} placeholder="Valor R$ 0,00" className="w-full bg-white dark:bg-slate-900 p-3 rounded-xl text-[11px] font-bold shadow-sm outline-none border focus:border-red-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Pagamento</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PAYMENT_METHODS.map(m => (
                        <button key={m} type="button" onClick={() => setPaymentMethod(m as PaymentMethod)} className={`p-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border-2 ${paymentMethod === m ? 'border-red-500 bg-red-500 text-white shadow-lg' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400'}`}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleAddExpense} className="w-full red-gradient text-white py-3 rounded-xl font-bold uppercase text-[9px] tracking-widest shadow-md active:scale-95 transition-all">Adicionar</button>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t dark:border-slate-800">
              {[ 
                {l: 'Gastos Semanais', d: chartDataWeeklyExpenses, a: DAYS_ABBR}, 
                {l: 'Gastos Mensais', d: chartDataMonthlyExpenses, a: ['S1', 'S2', 'S3', 'S4', 'S5']}
              ].map((c, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center gap-2 ml-1"><BarChart3 size={16} className="text-red-500" /><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.l}</h4></div>
                  <div className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-100 space-y-3">
                    {c.d.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-8 text-[8px] font-black text-slate-400 uppercase">{c.a[idx]}</span>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full red-gradient rounded-full" style={{ width: `${(val / (Math.max(...c.d, 1))) * 100}%` }} />
                        </div>
                        <span className="text-[9px] font-bold min-w-[50px] text-right">R$ {val.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2 border-t dark:border-slate-800 px-2">
               <div className="flex items-center gap-2 ml-1"><List size={16} className="text-slate-400" /><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico</h4></div>
               <div className="space-y-3">
                  {(filteredExpenses || []).length > 0 ? (filteredExpenses || []).map(exp => (
                    <div key={exp.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/30 rounded-2xl border hover:border-red-200 transition-colors shadow-sm group">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate group-hover:text-red-600 transition-colors">{exp.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{exp.date.split('-').reverse().join('/')}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[8px] text-red-400 uppercase font-bold tracking-widest">{exp.paymentMethod}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-base font-black text-red-500 whitespace-nowrap">R$ {exp.value.toFixed(2)}</span>
                          <button onClick={() => handleDeleteExpense(exp.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                        </div>
                    </div>
                  )) : (
                    <div className="py-16 text-center border-2 border-dashed rounded-[1.5rem] text-slate-300 uppercase text-[10px] font-bold tracking-widest">Nenhuma despesa</div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {isFinanceOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-l-[2.5rem] rounded-r-none w-full max-lg shadow-2xl p-6 sm:p-8 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="flex justify-between items-center shrink-0">
               <div className="flex flex-col"><h2 className="text-xl font-black uppercase tracking-tight">Financeiro</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{auth.role === 'master' ? 'Relatório Geral' : `Relatório de ${auth.username}`}</p></div>
               <button onClick={() => setIsFinanceOpen(false)} className="p-2 text-slate-400"><X size={24} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 shrink-0">
              {[{l: 'Day', v: financeDay, s: setFinanceDay, d: DAYS_OF_MONTH}, {l: 'Semana', v: financeWeek, s: setFinanceWeek, d: WEEKS}, {l: 'Mês', v: financeMonth, s: setFinanceMonth, d: MONTHS}, {l: 'Ano', v: financeYear, s: setFinanceYear, d: YEARS}].map((f, i) => (
                <div key={i} className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{f.l}</label>
                  <div className="relative">
                    <select value={f.v} onChange={(e) => f.s(parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-2.5 text-[10px] font-bold outline-none appearance-none focus:ring-2 ring-[var(--primary-color)]">
                      {f.d.map((val, idx) => <option key={idx} value={typeof val === 'string' && val === 'Todo' ? 0 : (i === 2 ? idx : (i === 3 ? val : idx))}>{val}</option>)}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={10} /></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 sm:p-6 gold-gradient rounded-[2rem] text-white flex flex-col items-center text-center shadow-xl shrink-0 mx-2">
              <div className="bg-white/20 p-2.5 rounded-2xl mb-3"><Banknote size={24} /></div>
              <span className="text-[9px] font-black uppercase tracking-[0.1em] opacity-80 whitespace-nowrap">Faturamento Mensal</span>
              <p className="text-3xl sm:text-4xl font-black tracking-tighter mt-0.5">R$ {monthlySummary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <div className="mt-4 px-6 py-1.5 bg-black/10 rounded-full border text-[9px] font-black uppercase tracking-[0.3em]">{monthlySummary.count} Atendimentos</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[ {l: 'Faturamento Diário', d: chartDataWeekly, a: DAYS_ABBR}, {l: 'Faturamento Semanal', d: chartDataMonthly, a: ['S1', 'S2', 'S3', 'S4', 'S5']}].map((c, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center gap-2 ml-1"><BarChart3 size={16} className="text-[var(--primary-color)]" /><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.l}</h4></div>
                  <div className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 space-y-3">
                    {c.d.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2"><span className="w-8 text-[8px] font-black text-slate-400 uppercase">{c.a[idx]}</span><div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full gold-gradient rounded-full" style={{ width: `${(val / (Math.max(...c.d, 1))) * 100}%` }} /></div><span className="text-[9px] font-bold min-w-[50px] text-right">R$ {val.toFixed(0)}</span></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {auth.role === 'master' && (
              <div className="pt-6 border-t dark:border-slate-800 space-y-4 px-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-[var(--primary-color)]" />
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faturamento Anual {financeYear}</h4>
                    </div>
                    {auth.role === 'master' && (
                      <button 
                        onClick={() => { setIsEditingAnnualLimit(!isEditingAnnualLimit); setTempAnnualLimit(annualLimit.toString()); }} 
                        className="p-1.5 text-slate-400 hover:text-[var(--primary-color)] transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Faturado</span>
                        <span className="text-xl font-black text-slate-700 dark:text-slate-100">R$ {annualTotalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                      </div>
                      
                      {isEditingAnnualLimit ? (
                        <div className="flex items-center gap-1.5">
                          <div className="relative">
                            <input 
                              value={tempAnnualLimit} 
                              onChange={e => setTempAnnualLimit(e.target.value)} 
                              className="w-24 bg-white dark:bg-slate-900 border p-1 px-2 rounded-lg text-xs font-bold outline-none" 
                              placeholder="Nova meta"
                              autoFocus
                            />
                          </div>
                          <button onClick={handleSaveAnnualLimit} className="p-1.5 bg-emerald-500 text-white rounded-lg"><CheckCircle2 size={12} /></button>
                          <button onClick={() => setIsEditingAnnualLimit(false)} className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg"><X size={12} /></button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Meta Anual</span>
                          <span className="text-sm font-bold text-slate-400">R$ {annualLimit.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Progresso</span>
                        <span>{annualProgressPercent.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full gold-gradient rounded-full transition-all duration-1000 shadow-sm" 
                          style={{ width: `${annualProgressPercent}%` }} 
                        />
                      </div>
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isFormOpen && <AppointmentForm onClose={() => { setIsFormOpen(false); setEditingAppointment(null); setPreselectedTime(null); }} onSubmit={handleSaveAppointment} onDelete={confirmDeleteAppointment} initialDate={selectedDate} availableProcedures={procedures} availableSecondaryProcedures={secondaryProcedures} editingData={editingAppointment} clients={clients} userTimes={userTimes} freeTimes={userFreeTimes} onUpdateUserTimes={setUserTimes} allAppointments={appointments} availablePartners={partners} preselectedTime={preselectedTime} />}
      {sharingAppointment && <ShareModal appointment={sharingAppointment} onClose={() => setSharingAppointment(null)} isManualShare={isManualShare} />}
      {appointmentToDelete && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-sm p-10 text-center space-y-8">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-sm"><AlertTriangle size={40} /></div>
            <div><h3 className="text-2xl font-black uppercase tracking-tight">Excluir?</h3><p className="text-sm text-slate-400 uppercase font-bold tracking-widest mt-3">Deseja mesmo remover este agendamento?</p></div>
            <div className="flex gap-4"><button onClick={() => setAppointmentToDelete(null)} className="flex-1 py-5 bg-red-500 text-white rounded-2xl font-bold uppercase text-xs tracking-widest">Não</button><button onClick={handleDeleteAppointment} className="flex-1 py-5 bg-emerald-500 text-white rounded-2xl font-bold uppercase text-xs tracking-widest">Sim</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;