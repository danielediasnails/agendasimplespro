
import React from 'react';
import { X, MessageCircle, UserCheck, UserPlus, CalendarCheck, AlertCircle, Send } from 'lucide-react';
import { Appointment } from '../types';

interface ShareModalProps {
  appointment: Appointment;
  onClose: () => void;
  isManualShare?: boolean; // Prop para identificar se veio do botão compartilhar da lista
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
  const formattedDate = `${day}/${month}`;
  const dayOfWeek = getDayOfWeek(appointment.date);
  const formattedTime = formatTime(appointment.time);

  const FOOTER = `----------------------------------------------------------
Ficha de Anamnese
Para garantir a sua segurança, a qualidade dos nossos serviços, por favor, preencha este formulário com atenção. Acesse o link abaixo para preencher. Agradecemos a sua colaboração!
https://forms.gle/r6fBDSjdstn6RfS19
----------------------------------------------------------
Endereço:
•⁠  ⁠Rua Francisco Antônio Miranda, 58 - Jardim Guarulhos - Guarulhos - SP, 07090-140.
(atrás do fórum civil)
Ao chegar, pressione o número 6 no interfone preto, ao lado esquerdo da porta de vidro.
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
•⁠  ⁠Somente via cartão será repassada a taxa da máquina.
----------------------------------------------------------
SINAL
•⁠  ⁠Lembrando que caso desmarque não será devolvido e perderá o sinal. Dessa forma precisando de um novo sinal. Lei 13.455/17.
----------------------------------------------------------
Pedimos por favor, a sua colaboração e compreensão, são informações para o bem estar de ambas as partes.

Muito Obrigado!`;

  const generateMessage = (isNewClient: boolean) => {
    const baseHeader = `Agendado: ${formattedDate} - ${dayOfWeek} - ${formattedTime}`;
    
    // Se for compartilhamento MANUAL (botão da lista)
    if (isManualShare) {
      return `Oi, posso confirmar seu horário ${formattedDate}, ${dayOfWeek} e ${formattedTime}?`;
    }

    // Se for logo APÓS AGENDAR
    if (isNewClient) {
      const header = `Seja bem-vinda \n${baseHeader}`;
      return `${header}\n\n${FOOTER}`;
    } else {
      // Para cliente da casa após agendar, removemos a pergunta e deixamos só o cabeçalho
      return baseHeader;
    }
  };

  const handleSend = (isNewClient: boolean) => {
    const message = generateMessage(isNewClient);
    const encoded = encodeURIComponent(message);
    const phone = appointment.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encoded}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        
        <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">
              {isManualShare ? 'Enviar Confirmação' : 'Agendado com Sucesso!'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {isManualShare ? 'Deseja confirmar este horário?' : 'Como deseja enviar o agendamento?'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-4">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 mb-2">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <CalendarCheck size={20} />
              <span className="text-sm font-bold uppercase tracking-tight">{formattedDate} • {dayOfWeek} • {formattedTime}</span>
            </div>
          </div>

          {isManualShare ? (
            /* BOTÃO ÚNICO PARA COMPARTILHAMENTO MANUAL - AGORA VERDE E SIMPLIFICADO */
            <button 
              onClick={() => handleSend(false)}
              className="w-full flex items-center gap-4 p-6 green-gradient text-white rounded-2xl hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all group text-left"
            >
              <div className="p-3 bg-white/20 rounded-xl text-white">
                <Send size={24} />
              </div>
              <div>
                <span className="block text-sm font-bold uppercase tracking-tight">Enviar Confirmação</span>
              </div>
            </button>
          ) : (
            /* DOIS BOTÕES PARA PÓS-AGENDAMENTO */
            <>
              <button 
                onClick={() => handleSend(false)}
                className="w-full flex items-center gap-4 p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-[var(--primary-color)] hover:shadow-lg transition-all group text-left"
              >
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 group-hover:text-[var(--primary-color)] transition-colors">
                  <UserCheck size={24} />
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">Cliente da Casa</span>
                  <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Somente os dados do horário</span>
                </div>
              </button>

              <button 
                onClick={() => handleSend(true)}
                className="w-full flex items-center gap-4 p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all group text-left"
              >
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 group-hover:text-emerald-500 transition-colors">
                  <UserPlus size={24} />
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">Cliente Nova</span>
                  <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Boas-vindas + Instruções Completas</span>
                </div>
              </button>
            </>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <AlertCircle size={12} />
            {isManualShare ? 'Envia uma mensagem curta de confirmação' : 'Ambas as opções incluem data e horário'}
          </div>
          <button 
            onClick={onClose}
            className="text-[10px] font-bold text-slate-300 hover:text-slate-500 uppercase tracking-widest transition-colors"
          >
            Fechar sem enviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
