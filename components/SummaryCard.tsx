
import React, { ReactNode } from 'react';

interface SummaryCardProps {
  title: string;
  primaryValue: string;
  secondaryValue: string;
  secondaryLabel: string;
  icon: ReactNode;
  accentColor: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, primaryValue, secondaryValue, secondaryLabel, icon, accentColor }) => {
  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden transition-all hover:scale-[1.01]">
      <div 
        className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-[0.03] dark:opacity-[0.06] transition-all group-hover:scale-125" 
        style={{ backgroundColor: accentColor }}
      ></div>
      
      <div className="flex items-start justify-between mb-8">
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-white dark:group-hover:bg-slate-700 transition-all border border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-800">
          {icon}
        </div>
        <div className="text-right">
          <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-600 tracking-[0.2em]">{title}</span>
          <div className="w-8 h-0.5 bg-slate-100 dark:bg-slate-800 mt-1 ml-auto rounded-full group-hover:w-full group-hover:bg-emerald-500 transition-all"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100/50 dark:border-slate-700/30 transition-all group-hover:bg-white dark:group-hover:bg-slate-800">
          <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Faturamento
          </span>
          <span className="block text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight leading-none whitespace-nowrap">
            {primaryValue}
          </span>
        </div>
        
        <div className="space-y-1.5 p-4 bg-amber-50/30 dark:bg-amber-900/10 rounded-2xl border border-amber-100/30 dark:border-amber-800/20 transition-all group-hover:bg-white dark:group-hover:bg-slate-800">
          <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {secondaryLabel}
          </span>
          <span className="block text-2xl font-bold text-[var(--primary-color)] tracking-tight leading-none">
            {secondaryValue}
          </span>
        </div>
      </div>
      
      <div className="w-1.5 h-1.5 rounded-full absolute bottom-4 left-1/2 -translate-x-1/2 opacity-20" style={{ backgroundColor: accentColor }}></div>
    </div>
  );
};

export default SummaryCard;
