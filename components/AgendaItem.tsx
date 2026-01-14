
import React, { useState } from 'react';
import { Trash2, Edit2, Calendar, Clock, Share2, Wallet, Sparkles, Sparkle, User, DollarSign, Crown, Lock, Banknote, Check, RefreshCcw } from 'lucide-react';
import { Appointment } from '../types';

interface AgendaItemProps {
  appointment: Appointment;
  procedureDurability?: number;
  onDelete: () => void;
  onEdit: () => void;
  onShare?: () => void;
  daysSinceLastVisit: number | null;
  isHistory?: boolean; 
  isEmployeeView?: boolean;
  commissionPercentage?: number;
  onUpdateTotal?: (id: string, newTotal: number) => void;
}

const AgendaItem: React.FC<AgendaItemProps> = ({ 
  appointment, 
  procedureDurability,
  onDelete, 
  onEdit, 
  onShare, 
  isHistory = false, 
  isEmployeeView = false,
  commissionPercentage = 50,
  onUpdateTotal
}) => {
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [tempTotal, setTempTotal] = useState(appointment.totalValue.toString());

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const getDayOfWeek = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T12:00:00');
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      return days[date.getDay()];
    } catch (e) {
      return '';
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--:--';
    return timeStr.includes(':00') ? timeStr.split(':')[0] + 'h' : timeStr.replace(':', 'h');
  };

  const calculateReturnDate = (dateStr: string, days: number) => {
    if (!dateStr || !days) return '';
    const date = new Date(dateStr + 'T12:00:00');
    date.setDate(date.getDate() + days);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}`;
  };

  const handleSaveTotal = () => {
    if (onUpdateTotal) {
      onUpdateTotal(appointment.id, parseFloat(tempTotal || '0'));
    }
    setIsEditingTotal(false);
  };

  const isDaniele = appointment.partnerName === 'Daniele Dias';
  
  const totalServiceValue = Number(appointment.totalValue || 0) + Number(appointment.deposit || 0);
  const partnerGain = totalServiceValue * (commissionPercentage / 100);

  return (
    <div className={`group bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800/60 rounded-[1.5rem] shadow-sm hover:shadow-md hover:border-[var(--primary-color)] transition-all duration-500 flex flex-col items-center text-center ${isHistory ? 'p-4' : 'p-4 sm:p-5'}`}>
      
      {/* Nome do Cliente */}
      <h3 className={`font-black tracking-tight gold-text-gradient uppercase leading-tight mb-2 transition-transform duration-500 group-hover:scale-[1.01] ${isHistory ? 'text-base' : 'text-lg sm:text-xl'}`}>
        {appointment.clientName || 'Sem Nome'}
      </h3>

      {/* Info de Tempo e Data */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-100 dark:border-slate-700">
          <Clock size={12} className="text-[var(--primary-color)]" />
          <span className="font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px]">
            {formatTime(appointment.time)} {appointment.secondaryTime && `& ${formatTime(appointment.secondaryTime)}`}
          </span>
        </div>
        
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-100 dark:border-slate-700">
          <Calendar size={12} className="text-[var(--primary-color)]" />
          <span className="font-bold text-slate-600 dark:text-slate-300 uppercase text-[9px]">
            {formatDate(appointment.date)} ({getDayOfWeek(appointment.date)})
          </span>
        </div>
      </div>

      {!isEmployeeView && appointment.partnerName && (
        <div className={`flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full border ${
          isDaniele 
            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30' 
            : 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30'
        }`}>
          {isDaniele ? <Crown size={10} className="text-amber-500" /> : <User size={10} className="text-indigo-500" />}
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {isDaniele ? 'Daniele Dias' : appointment.partnerName}
          </span>
        </div>
      )}

      {/* Procedimentos */}
      <div className="flex flex-col items-center gap-1 mb-4 w-full">
        <div className="flex flex-col items-center gap-0.5 px-3 py-1.5 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50 w-full max-w-[220px]">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-[var(--primary-color)]" />
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
              {appointment.procedure}
            </span>
          </div>

          {/* Retorno Sugerido - Agora em baixo do procedimento principal, mesma letra, cor vermelha e mantendo o fundo */}
          {!isHistory && procedureDurability && procedureDurability > 0 && (
            <div className="flex items-center gap-1.5 pt-0.5 border-t border-slate-100 dark:border-slate-700/50 w-full justify-center">
              <RefreshCcw size={10} className="text-red-500" />
              <span className="text-[10px] font-black uppercase tracking-wide text-red-500">
                Retorno: {calculateReturnDate(appointment.date, procedureDurability)}
              </span>
            </div>
          )}

          {appointment.secondaryProcedure && (
            <div className="flex items-center gap-1.5 pt-0.5 border-t border-slate-200 dark:border-slate-700 w-full justify-center">
              <Sparkle size={10} className="text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wide truncate">
                {appointment.secondaryProcedure}
              </span>
            </div>
          )}
        </div>
      </div>

      {!isHistory ? (
        <div className="w-full flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mb-4">
          {!isEmployeeView ? (
            <>
              <div className="flex gap-8 text-left items-start">
                {/* Coluna Sinal */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sinal</span>
                  <div className="flex items-center h-[34px]">
                    <span className="text-base font-black text-slate-700 dark:text-slate-200 leading-none">R$ {Number(appointment.deposit).toFixed(2)}</span>
                  </div>
                </div>

                {/* Coluna Total */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total</span>
                  <div className="h-[34px] flex items-center">
                    {isEditingTotal ? (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <input 
                          type="number" 
                          value={tempTotal} 
                          onChange={(e) => setTempTotal(e.target.value)}
                          className="w-28 p-1.5 text-sm font-black border-2 rounded-xl bg-white dark:bg-slate-800 outline-none border-emerald-500 shadow-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          autoFocus
                          onBlur={handleSaveTotal}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveTotal()}
                        />
                        <button 
                          onClick={handleSaveTotal} 
                          className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-lg hover:bg-emerald-600 active:scale-90 transition-all flex items-center justify-center"
                          title="Confirmar"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400 leading-none">R$ {Number(appointment.totalValue).toFixed(2)}</span>
                        <button 
                          onClick={() => setIsEditingTotal(true)}
                          className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-lg border border-emerald-100 dark:border-emerald-900/30 hover:scale-110 active:scale-95 transition-all shadow-sm flex items-center justify-center"
                          title="Editar valor total"
                        >
                          <Edit2 size={12} strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 self-center">
                {appointment.paymentMethod}
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-center gap-3 bg-emerald-50/40 dark:bg-emerald-950/10 py-3 rounded-[1.25rem] border border-emerald-100/50 dark:border-emerald-900/20 shadow-inner">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-emerald-500 border border-emerald-100/50">
                <Banknote size={16} />
              </div>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                R$ {partnerGain.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 mb-3 flex justify-between items-center px-1">
            <div className="flex flex-col items-start">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total</span>
               <div className="h-[34px] flex items-center">
                 {isEditingTotal && !isEmployeeView ? (
                   <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      <input 
                        type="number" 
                        value={tempTotal} 
                        onChange={(e) => setTempTotal(e.target.value)}
                        className="w-28 p-1.5 text-sm font-black border-2 rounded-xl bg-white dark:bg-slate-800 outline-none border-emerald-500 shadow-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        autoFocus
                        onBlur={handleSaveTotal}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTotal()}
                      />
                      <button 
                        onClick={handleSaveTotal} 
                        className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-lg hover:bg-emerald-600 active:scale-90 transition-all flex items-center justify-center"
                      >
                        <Check size={16} />
                      </button>
                   </div>
                 ) : (
                   <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-600 dark:text-slate-300 leading-none">R$ {(Number(appointment.totalValue) + Number(appointment.deposit)).toFixed(2)}</span>
                      {!isEmployeeView && (
                        <button 
                          onClick={() => setIsEditingTotal(true)}
                          className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-lg border border-emerald-100 dark:border-emerald-900/30 hover:scale-110 active:scale-95 transition-all shadow-sm flex items-center justify-center"
                        >
                          <Edit2 size={12} strokeWidth={3} />
                        </button>
                      )}
                   </div>
                 )}
               </div>
            </div>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-md border self-center">
              {appointment.paymentMethod}
            </div>
        </div>
      )}

      {!isEmployeeView && (
        <div className="flex items-center justify-center gap-1 p-0.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-700 shadow-inner w-fit mt-auto">
          {!isHistory && (
            <button 
              onClick={onShare} 
              className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all shadow-sm"
              title="Enviar Confirmação"
            >
              <Share2 size={16} />
            </button>
          )}
          <button 
            onClick={onEdit} 
            className="p-1.5 text-slate-400 hover:text-[var(--primary-color)] hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all shadow-sm"
            title="Editar completo"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={onDelete} 
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all shadow-sm"
            title="Excluir"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AgendaItem;
