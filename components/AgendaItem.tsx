import React from 'react';
import { Trash2, Edit2, Calendar, Clock, Share2, Wallet, Sparkles, Sparkle, User, DollarSign, Crown, Lock, Banknote } from 'lucide-react';
import { Appointment } from '../types';

interface AgendaItemProps {
  appointment: Appointment;
  onDelete: () => void;
  onEdit: () => void;
  onShare?: () => void;
  daysSinceLastVisit: number | null;
  isHistory?: boolean; 
  isEmployeeView?: boolean;
  commissionPercentage?: number;
}

const AgendaItem: React.FC<AgendaItemProps> = ({ 
  appointment, 
  onDelete, 
  onEdit, 
  onShare, 
  isHistory = false, 
  isEmployeeView = false,
  commissionPercentage = 50
}) => {
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

  const isDaniele = appointment.partnerName === 'Daniele Dias';
  
  const totalServiceValue = Number(appointment.totalValue || 0) + Number(appointment.deposit || 0);
  const partnerGain = totalServiceValue * (commissionPercentage / 100);

  return (
    <div className={`group bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800/60 rounded-[1.5rem] shadow-sm hover:shadow-md hover:border-[var(--primary-color)] transition-all duration-500 flex flex-col items-center text-center ${isHistory ? 'p-4' : 'p-4 sm:p-5'}`}>
      
      {/* Nome do Cliente - Mais compacto */}
      <h3 className={`font-black tracking-tight gold-text-gradient uppercase leading-tight mb-2 transition-transform duration-500 group-hover:scale-[1.01] ${isHistory ? 'text-base' : 'text-lg sm:text-xl'}`}>
        {appointment.clientName || 'Sem Nome'}
      </h3>

      {/* Info de Tempo e Data - Mais compacta */}
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

      {/* Procedimentos - Reduzidos */}
      <div className="flex flex-col items-center gap-1 mb-4 w-full">
        <div className="flex flex-col items-center gap-0.5 px-3 py-1.5 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50 w-full max-w-[220px]">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-[var(--primary-color)]" />
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
              {appointment.procedure}
            </span>
          </div>
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
        <>
          <div className="w-full flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mb-4">
            {!isEmployeeView ? (
              <>
                <div className="flex gap-4 text-left">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sinal</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">R$ {Number(appointment.deposit).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">R$ {Number(appointment.totalValue).toFixed(2)}</span>
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-600">
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
        </>
      ) : (
        <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800 mb-3 flex justify-between items-center px-1">
            <div className="flex flex-col items-start">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total</span>
               <span className="text-sm font-black text-slate-600 dark:text-slate-300">R$ {(Number(appointment.totalValue) + Number(appointment.deposit)).toFixed(2)}</span>
            </div>
            <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-md border">
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
            title="Editar"
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