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
  
  // Cálculo do ganho da parceira
  const totalServiceValue = Number(appointment.totalValue || 0) + Number(appointment.deposit || 0);
  const partnerGain = totalServiceValue * (commissionPercentage / 100);

  return (
    <div className={`group bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[2rem] shadow-sm hover:shadow-md hover:border-[var(--primary-color)] transition-all duration-500 flex flex-col items-center text-center ${isHistory ? 'p-4' : 'p-6 sm:p-7'}`}>
      
      {/* Nome do Cliente */}
      <h3 className={`font-bold tracking-tight gold-text-gradient uppercase leading-tight mb-2 transition-transform duration-500 group-hover:scale-[1.01] ${isHistory ? 'text-lg' : 'text-xl sm:text-2xl'}`}>
        {appointment.clientName || 'Sem Nome'}
      </h3>

      {/* Info de Tempo e Data */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700/50">
          <Clock size={14} className="text-[var(--primary-color)]" />
          <span className={`font-semibold text-slate-500 dark:text-slate-400 uppercase ${isHistory ? 'text-[10px]' : 'text-xs'}`}>
            {formatTime(appointment.time)} {appointment.secondaryTime && `& ${formatTime(appointment.secondaryTime)}`}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700/50">
          <Calendar size={14} className="text-[var(--primary-color)]" />
          <span className={`font-semibold text-slate-500 dark:text-slate-400 uppercase ${isHistory ? 'text-[10px]' : 'text-xs'}`}>
            {formatDate(appointment.date)} ({getDayOfWeek(appointment.date)})
          </span>
        </div>
      </div>

      {/* Rótulo da Profissional (Oculto na visão da parceira para simplificar) */}
      {!isEmployeeView && appointment.partnerName && (
        <div className={`flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full border ${
          isDaniele 
            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30' 
            : 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30'
        }`}>
          {isDaniele ? <Crown size={10} className="text-amber-500" /> : <User size={10} className="text-indigo-500" />}
          <span className={`text-[9px] font-black uppercase tracking-tight ${
            isDaniele ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'
          }`}>
            {isDaniele ? 'Daniele Dias' : `Parceira: ${appointment.partnerName}`}
          </span>
        </div>
      )}

      {!isHistory && (
        <>
          {/* Procedimentos */}
          <div className="flex flex-col items-center gap-2 mb-5">
            <div className="flex flex-col items-center gap-1 px-4 py-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-[var(--primary-color)] opacity-70" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {appointment.procedure}
                </span>
              </div>
              {appointment.secondaryProcedure && (
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700 w-full justify-center">
                  <Sparkle size={10} className="text-emerald-500 opacity-70" />
                  <span className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest">
                    {appointment.secondaryProcedure}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Seção Financeira */}
          <div className="w-full flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mb-5">
            {!isEmployeeView ? (
              // Visão Master: Detalhes de sinal e total
              <>
                <div className="flex gap-6">
                  <div className="flex flex-col items-start">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Sinal</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">R$ {Number(appointment.deposit).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Procedimento</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">R$ {Number(appointment.totalValue).toFixed(2)}</span>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wider shadow-sm bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-600">
                  {appointment.paymentMethod}
                </div>
              </>
            ) : (
              // Visão Parceira: Valor comissionado que ela recebe (Simplificado)
              <div className="w-full flex items-center justify-center gap-4 bg-emerald-50/40 dark:bg-emerald-950/10 py-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20">
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-emerald-500">
                  <Banknote size={20} />
                </div>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                  R$ {partnerGain.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Dock de Ações - Oculto para parceiras */}
      {!isEmployeeView && (
        <div className="flex items-center justify-center gap-1 p-1 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner w-fit">
          {!isHistory && (
            <button 
              onClick={onShare} 
              className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"
              title="Enviar Confirmação"
            >
              <Share2 size={18} />
            </button>
          )}
          <button 
            onClick={onEdit} 
            className="p-2 text-slate-400 hover:text-[var(--primary-color)] hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"
            title="Editar"
          >
            <Edit2 size={18} />
          </button>
          <button 
            onClick={onDelete} 
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"
            title="Excluir"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AgendaItem;