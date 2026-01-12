
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, User, Sparkles, DollarSign, Clock, CheckCircle2, Phone, Search, History, Wallet, Plus, Trash2, AlertTriangle, Sparkle, HardHat, ChevronDown } from 'lucide-react';
import { TimeMode, Appointment, Client, PaymentMethod, Partner, Procedure } from '../types';
import { PAYMENT_METHODS } from '../constants';

interface AppointmentFormProps {
  onClose: () => void;
  onSubmit: (app: Omit<Appointment, 'id' | 'createdAt'>) => void;
  onDelete?: (id: string) => void;
  initialDate: string;
  availableProcedures: Procedure[];
  availableSecondaryProcedures: Procedure[];
  editingData?: Appointment | null;
  clients: Client[];
  userTimes: string[];
  freeTimes: string[];
  onUpdateUserTimes: (newTimes: string[]) => void;
  allAppointments: Appointment[];
  availablePartners: Partner[];
  preselectedTime?: string | null;
}

const formatDurationDisplay = (d: string | number) => {
  const s = String(d);
  if (!s) return "";
  if (s.includes('h') || s.includes('min')) return s;
  return s + 'min';
};

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  onClose, 
  onSubmit, 
  onDelete,
  initialDate, 
  availableProcedures, 
  availableSecondaryProcedures,
  editingData, 
  clients,
  userTimes,
  freeTimes,
  onUpdateUserTimes,
  allAppointments,
  availablePartners,
  preselectedTime
}) => {
  const partnersList = useMemo(() => ['Daniele Dias', ...availablePartners.map(p => p.name)], [availablePartners]);
  const standardTimesList = useMemo(() => userTimes && userTimes.length > 0 ? userTimes : ['08:00', '10:30', '13:30', '16:00', '18:00'], [userTimes]);
  const freeTimesList = useMemo(() => freeTimes && freeTimes.length > 0 ? freeTimes : ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'], [freeTimes]);
  
  const [date, setDate] = useState(initialDate);
  const [clientName, setClientName] = useState('');
  const [whatsapp, setWhatsapp] = useState(''); 
  const [timeMode, setTimeMode] = useState<TimeMode>(TimeMode.STANDARD);
  const [timeMode2, setTimeMode2] = useState<TimeMode>(TimeMode.STANDARD);
  const [time, setTime] = useState(preselectedTime || standardTimesList[0]);
  const [time2, setTime2] = useState('');
  const [procedure, setProcedure] = useState(availableProcedures[0]?.name || '');
  const [secondaryProcedure, setSecondaryProcedure] = useState('');
  const [partnerName, setPartnerName] = useState(partnersList[0]); 
  const [deposit, setDeposit] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    if (editingData) {
      setDate(editingData.date);
      setClientName(editingData.clientName || '');
      setWhatsapp(editingData.whatsapp || '');
      setProcedure(editingData.procedure || '');
      setSecondaryProcedure(editingData.secondaryProcedure || '');
      setPartnerName(editingData.partnerName || partnersList[0]);
      
      const isStandard = standardTimesList.includes(editingData.time);
      if (isStandard) setTimeMode(TimeMode.STANDARD);
      else setTimeMode(TimeMode.FREE);
      setTime(editingData.time || standardTimesList[0]);

      if (editingData.secondaryTime) {
        const isStandard2 = standardTimesList.includes(editingData.secondaryTime);
        if (isStandard2) setTimeMode2(TimeMode.STANDARD);
        else setTimeMode2(TimeMode.FREE);
        setTime2(editingData.secondaryTime);
      } else {
        setTime2('');
      }

      setDeposit(editingData.deposit ? editingData.deposit.toString() : '');
      setTotalValue(editingData.totalValue ? editingData.totalValue.toString() : '');
      setPaymentMethod(editingData.paymentMethod as PaymentMethod || 'Pix');
    } else if (preselectedTime) {
      setTime(preselectedTime);
      const isStandard = standardTimesList.includes(preselectedTime);
      setTimeMode(isStandard ? TimeMode.STANDARD : TimeMode.FREE);
    }
  }, [editingData, partnersList, standardTimesList, preselectedTime]);

  useEffect(() => {
    if (clientName && clientName.length > 1 && !editingData) {
      const filtered = clients.filter(c => 
        c.name.toLowerCase().includes(clientName.toLowerCase())
      );
      setFilteredClients(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [clientName, clients, editingData]);

  const handleSelectClient = (client: Client) => {
    setClientName(client.name);
    setWhatsapp(client.whatsapp);
    setShowSuggestions(false);
  };

  const checkTimeConflict = (t: string) => {
    if (!t) return false;
    return allAppointments.some(a => 
      a.date === date && 
      a.partnerName === partnerName &&
      a.id !== editingData?.id &&
      (a.time === t || a.secondaryTime === t)
    );
  };

  const hasConflictPrimary = checkTimeConflict(time);
  const hasConflictSecondary = secondaryProcedure && time2 ? (checkTimeConflict(time2) || (time === time2)) : false;
  const anyConflict = hasConflictPrimary || hasConflictSecondary;

  const handleManualSubmit = () => {
    if (anyConflict) {
      alert("Não é possível agendar: horário já ocupado para esta profissional.");
      return;
    }

    if (!clientName) {
      alert("Por favor, preencha o nome da cliente.");
      return;
    }

    if (date < todayStr && !editingData) {
      alert("Não é possível realizar agendamentos em datas retroativas.");
      return;
    }

    onSubmit({
      date,
      clientName: clientName || 'Sem Nome',
      whatsapp: whatsapp || '',
      time: time || '00:00',
      procedure: procedure || 'Sem Procedimento',
      secondaryProcedure: secondaryProcedure || undefined,
      secondaryTime: (secondaryProcedure && time2) ? time2 : undefined,
      deposit: Number(deposit) || 0,
      totalValue: Number(totalValue) || 0,
      paymentMethod,
      partnerName: partnerName
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingData && onDelete) {
      onDelete(editingData.id);
    }
  };

  const timesToDisplay = timeMode === TimeMode.STANDARD ? standardTimesList : freeTimesList;
  const timesToDisplay2 = timeMode2 === TimeMode.STANDARD ? standardTimesList : freeTimesList;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 uppercase">{editingData ? 'Editar Horário' : 'Novo Agendamento'}</h2>
            <p className="text-[9px] font-medium uppercase text-slate-400 dark:text-slate-500 tracking-[0.3em] mt-1.5">{editingData ? 'Atualize as informações' : 'Cadastro de Cliente'}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="date" 
                  value={date} 
                  min={editingData ? undefined : todayStr}
                  onChange={(e) => setDate(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 ring-[var(--primary-color)] transition-all min-w-0" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Profissional</label>
              <div className="relative">
                <HardHat className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select value={partnerName} onChange={(e) => setPartnerName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl p-4 pl-12 text-sm font-bold outline-none appearance-none focus:ring-2 ring-[var(--primary-color)] transition-all min-w-0">
                  {partnersList.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} onFocus={() => setShowSuggestions(true)} placeholder="Nome da cliente" className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 ring-[var(--primary-color)] transition-all" />
              </div>
              {showSuggestions && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-top-2">
                  {filteredClients.map((c, i) => (
                    <button key={i} type="button" onClick={() => handleSelectClient(c)} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-none">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-600 flex items-center justify-center text-slate-400 text-xs font-bold">{c.name.charAt(0)}</div>
                      <div className="text-left"><p className="text-sm font-bold text-slate-700 dark:text-slate-200">{c.name}</p><p className="text-[10px] text-slate-400">{c.whatsapp}</p></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(00) 00000-0000" className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 ring-[var(--primary-color)] transition-all" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t dark:border-slate-800">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Procedimento</label>
              <div className="relative">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select value={procedure} onChange={(e) => setProcedure(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl p-4 pl-12 text-sm font-bold outline-none appearance-none focus:ring-2 ring-[var(--primary-color)] transition-all">
                  {availableProcedures.map(p => <option key={p.name} value={p.name}>{p.name} ({formatDurationDisplay(p.duration)})</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Horário</label>
                <button type="button" onClick={() => setTimeMode(timeMode === TimeMode.STANDARD ? TimeMode.FREE : TimeMode.STANDARD)} className={`text-[10px] font-black uppercase px-4 py-1 rounded-xl border transition-all shadow-sm active:scale-95 ${timeMode === TimeMode.STANDARD ? 'text-[var(--primary-color)] bg-[var(--primary-color)]/10 border-[var(--primary-color)]/20' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                  {timeMode === TimeMode.STANDARD ? 'Padrão' : 'Alternativo'}
                </button>
              </div>
              <div className="relative">
                <Clock className={`absolute left-4 top-1/2 -translate-y-1/2 ${hasConflictPrimary ? 'text-red-500' : 'text-slate-400'}`} size={18} />
                <select value={time} onChange={(e) => setTime(e.target.value)} className={`w-full bg-slate-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl p-4 pl-12 text-sm font-bold outline-none appearance-none focus:ring-2 transition-all ${hasConflictPrimary ? 'ring-2 ring-red-500 text-red-500' : 'ring-[var(--primary-color)]'}`}>
                  {timesToDisplay.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
              {hasConflictPrimary && (
                <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-1 ml-1 flex items-center gap-1">
                  <AlertTriangle size={10} /> Horário já ocupado
                </p>
              )}
            </div>
          </div>

          {/* Procedimento Adicional Section */}
          <div className="pt-6 border-t dark:border-slate-800 space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                   <Plus size={14} className="text-[var(--primary-color)]" /> Procedimento Adicional
                </label>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <div className="relative">
                      <Sparkle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        value={secondaryProcedure} 
                        onChange={(e) => {
                          setSecondaryProcedure(e.target.value);
                          if (!time2 && e.target.value) setTime2(standardTimesList[0]);
                        }} 
                        className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl p-4 pl-12 text-sm font-bold outline-none appearance-none focus:ring-2 ring-[var(--primary-color)] transition-all"
                      >
                        <option value="">Selecione...</option>
                        {availableSecondaryProcedures.map(p => <option key={p.name} value={p.name}>{p.name} ({formatDurationDisplay(p.duration)})</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Horário</label>
                      <button type="button" onClick={() => setTimeMode2(timeMode2 === TimeMode.STANDARD ? TimeMode.FREE : TimeMode.STANDARD)} className={`text-[10px] font-black uppercase px-4 py-1 rounded-xl border transition-all shadow-sm active:scale-95 ${timeMode2 === TimeMode.STANDARD ? 'text-[var(--primary-color)] bg-[var(--primary-color)]/10 border-[var(--primary-color)]/20' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                        {timeMode2 === TimeMode.STANDARD ? 'Padrão' : 'Alternativo'}
                      </button>
                   </div>
                   <div className="relative">
                      <Clock className={`absolute left-4 top-1/2 -translate-y-1/2 ${hasConflictSecondary ? 'text-red-500' : 'text-slate-400'}`} size={18} />
                      <select 
                        value={time2} 
                        onChange={(e) => setTime2(e.target.value)} 
                        disabled={!secondaryProcedure}
                        className={`w-full bg-slate-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl p-4 pl-12 text-sm font-bold outline-none appearance-none focus:ring-2 transition-all ${hasConflictSecondary ? 'ring-2 ring-red-500 text-red-500' : 'ring-[var(--primary-color)]'} ${!secondaryProcedure ? 'opacity-50' : ''}`}
                      >
                        <option value="">Horário Adicional...</option>
                        {timesToDisplay2.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                   </div>
                   {hasConflictSecondary && (
                      <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-1 ml-1 flex items-center gap-1">
                        <AlertTriangle size={10} /> Conflito no 2º horário
                      </p>
                   )}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-slate-800">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sinal</label>
              <div className="relative">
                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="number" step="0.01" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="0,00" className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 ring-amber-500 transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Valor Total</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="number" step="0.01" value={totalValue} onChange={(e) => setTotalValue(e.target.value)} placeholder="0,00" className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 ring-emerald-500 transition-all" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Método de Pagamento</label>
            <div className="grid grid-cols-3 gap-3">
              {PAYMENT_METHODS.map(m => (
                <button key={m} type="button" onClick={() => setPaymentMethod(m as PaymentMethod)} className={`p-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border-2 ${paymentMethod === m ? 'border-[var(--primary-color)] bg-[var(--primary-color)] text-white shadow-lg' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-6">
            {editingData && onDelete && (
              <button 
                type="button" 
                onClick={handleDeleteClick} 
                className="p-5 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl hover:bg-red-100 dark:hover:bg-red-950/40 transition-all active:scale-95 shrink-0"
              >
                <Trash2 size={24} />
              </button>
            )}
            <button 
              type="button" 
              disabled={anyConflict}
              onClick={handleManualSubmit}
              className={`flex-1 text-white py-5 rounded-2xl font-bold uppercase text-[12px] tracking-[0.1em] shadow-xl transition-all flex items-center justify-center gap-2 ${
                anyConflict 
                  ? 'bg-slate-300 cursor-not-allowed opacity-50' 
                  : editingData ? 'green-gradient hover:scale-[1.02] active:scale-95' : 'gold-gradient hover:scale-[1.02] active:scale-95'
              }`}
            >
              <CheckCircle2 size={20} />
              {editingData ? 'Salvar Alterações' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;
