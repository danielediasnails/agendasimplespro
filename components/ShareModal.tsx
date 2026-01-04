
import React from 'react';
// Fix: 'MessageSquareCheck' does not exist in standard lucide-react; replaced with 'MessageSquare'.
import { X, CalendarCheck, SendHorizontal, MessageSquare } from 'lucide-react';
import { Appointment } from '../types';

interface ShareModalProps {
  appointment: Appointment;
  onClose: () => void;
  isManualShare?: boolean;
}

const ShareModal: React.FC<ShareModalProps> = ({ appointment, onClose, isManualShare = false }) => {
  const getDayOfWeek = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return days[date.getDay()];
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.includes(':00') ? timeStr.split(':')[0] + 'h' : timeStr.replace(':', 'h');
  };

  const [year, month, day] = appointment.date.split('-');
  const dayOfWeek = getDayOfWeek(appointment.date);
  const formattedTime = formatTime(appointment.time);

  // Mensagem para Confirmação Simples
  const getConfirmMessage = () => {
    return `Olá, posso confirmar seu agendamento (${day}/${month} ${dayOfWeek} ${formattedTime})?`;
  };

  // Mensagem para Cliente Novo
  const getNewClientMessage = () => {
    return `Agendado: ${day}/${month} - ${dayOfWeek} - ${formattedTime}`;
  };

  // Mensagem para Cliente Cadastrada
  const getRegisteredClientMessage = () => {
    return `Seja bem-vinda  
Agendado: ${day}/${month} - ${dayOfWeek} - ${formattedTime}. 
----------------------------------------------------------
Ficha de Anamnese
Para garantir a sua segurança, a qualidade dos nossos serviços, por favor, preencha este formulário com atenção. Acesse o link abaixo para preencher. Agradecemos a sua colaboração! 
https://forms.gle/r6fBDSjdstn6RfS19
----------------------------------------------------------
Endereço:
•⁠  ⁠Rua Francisco Antônio Miranda, 58 - Jardim Guarulhos - Guarulhos - SP, 07090-140.
(atrás do fórum civil)
*Ao chegar, pressione o número 6 no interfone preto, ao lado esquerdo da porta de vidro.*
----------------------------------------------------------
Por conta de alguns contratempos, não é permitido:
•⁠  ⁠Bebés e crianças; (somente acima de 12 anos)
•⁠  ⁠Animais;
•⁠  ⁠Comer durante o procedimento.
----------------------------------------------------------
ATRASOS
•⁠  ⁠Consideramos 15 minutos, em caso de algum imprevisto.
----------------------------------------------------------
PAGAMENTOS
•⁠  ⁠Pix, dinheiro ou Cartão (via cartão será repassada a taxa da máquina)
----------------------------------------------------------
SINAL
•⁠  ⁠Lembrando que caso desmarque não será devolvido e perderá o sinal. Dessa forma precisando de um novo sinal. Lei 13.455/17.
----------------------------------------------------------
Pedimos por favor, a sua colaboração e compreensão, são informações para o bem estar de ambas as partes.

 Muito Obrigado! `;
  };

  const handleShareWhatsApp = (messageType: 'confirm' | 'new' | 'registered') => {
    const phone = appointment.whatsapp.replace(/\D/g, '');
    let message = '';
    
    if (messageType === 'confirm') message = getConfirmMessage();
    else if (messageType === 'new') message = getNewClientMessage();
    else message = getRegisteredClientMessage();

    const text = encodeURIComponent(message);
    window.open(`https://wa.me/${phone.startsWith('55') ? phone : `55${phone}`}?text=${text}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight">
              {isManualShare ? 'Confirmar Envio' : 'Agendado com Sucesso!'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center shadow-inner">
            <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <div className="flex items-center gap-3">
                <CalendarCheck size={28} className="shrink-0" />
                <span className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">
                  {day}/{month} às {formattedTime}
                </span>
              </div>
              <span className="text-sm font-bold uppercase tracking-[0.2em] opacity-80 border-t border-emerald-200 dark:border-emerald-800/50 pt-2 w-full max-w-[200px]">
                {dayOfWeek}
              </span>
            </div>
          </div>

          <div className="space-y-3">
             <button 
                onClick={() => handleShareWhatsApp('confirm')}
                className="w-full flex items-center justify-center gap-3 p-5 gold-gradient text-white rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                <SendHorizontal size={22} />
                <span className="text-xs font-bold uppercase tracking-widest">Confirmar Cliente</span>
              </button>

             <button 
                onClick={() => handleShareWhatsApp('new')}
                className="w-full flex items-center justify-center gap-3 p-5 green-gradient text-white rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                <MessageSquare size={22} />
                <span className="text-xs font-bold uppercase tracking-widest">Cliente Nova</span>
              </button>

              <button 
                onClick={() => handleShareWhatsApp('registered')}
                className="w-full flex items-center justify-center gap-3 p-5 bg-slate-800 dark:bg-slate-700 text-white rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                <SendHorizontal size={22} />
                <span className="text-xs font-bold uppercase tracking-widest">Cliente Cadastrada</span>
              </button>
          </div>
        </div>

        <div className="p-5 bg-slate-50 dark:bg-slate-800/30 flex flex-col items-center gap-3">
          <button 
            onClick={onClose}
            className="text-[9px] font-bold text-slate-300 hover:text-slate-500 uppercase tracking-widest transition-colors"
          >
            Fechar sem enviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
