/**
 * Espaços do Santer Hub disponíveis para reserva.
 *
 * Cada sala tem o seu canal de reserva: a Master é agendada pelo eAgenda, a
 * Podcast pelo WhatsApp do Hub. Enquanto `linkAgendamento` não for uma URL
 * válida, o card exibe "Agendamento sob consulta" no lugar do botão — nunca um
 * link quebrado.
 */

import salaMaster from '../assets/espacos/sala-master.jpg';
import salaPodcast from '../assets/espacos/sala-podcast.jpg';

export interface Espaco {
  id: string;
  nome: string;
  capacidade: string;
  descricao: string;
  imagem: string;
  /** URL de reserva, ou o placeholder abaixo. */
  linkAgendamento: string;
  /** Por onde a reserva é feita — define o texto e o ícone do botão. */
  canal: 'eagenda' | 'whatsapp';
}

/** Placeholder usado enquanto o link de agendamento não existe. */
export const AGENDAMENTO_PENDENTE = 'INSERIR_LINK_AGENDAMENTO';

/** WhatsApp oficial para reserva dos espaços. */
export const WHATSAPP_RESERVA = 'https://wa.me/554797880359';

/** Agendamento da Sala Master — sistema eAgenda da Santer. */
export const EAGENDA_SALA_MASTER =
  'https://santerempreendimentos.eagenda.com.br/agendamentos/incluir/santerempreendimentos/horarios?cl=salamaster';

/** Texto do botão de reserva conforme o canal. */
export const RESERVA = {
  eagenda: 'Reservar no eAgenda',
  whatsapp: 'Reservar pelo WhatsApp',
} as const;

export const ESPACOS: Espaco[] = [
  {
    id: 'sala-master',
    nome: 'Sala Master',
    capacidade: 'Até 12 pessoas',
    descricao:
      'Sala executiva para reuniões e fechamentos estratégicos, com ambiente privativo e display interativo.',
    imagem: salaMaster,
    linkAgendamento: EAGENDA_SALA_MASTER,
    canal: 'eagenda',
  },
  {
    id: 'sala-podcast',
    nome: 'Sala Podcast',
    capacidade: 'Até 4 pessoas',
    descricao:
      'Estúdio para gravação de conteúdo profissional, com isolamento acústico e equipamentos de áudio e vídeo.',
    imagem: salaPodcast,
    linkAgendamento: WHATSAPP_RESERVA,
    canal: 'whatsapp',
  },
];
