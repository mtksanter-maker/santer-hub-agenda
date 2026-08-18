/**
 * Espaços do Santer Hub disponíveis para reserva.
 *
 * O agendamento é feito por uma ferramenta externa. Enquanto `linkAgendamento`
 * não for uma URL válida, o card exibe "Agendamento sob consulta" no lugar do
 * botão — nunca um link quebrado.
 */

export interface Espaco {
  id: string;
  nome: string;
  capacidade: string;
  descricao: string;
  imagem: string;
  /** URL do sistema externo de agendamento, ou o placeholder abaixo. */
  linkAgendamento: string;
}

/** Placeholder usado enquanto o link de agendamento não existe. */
export const AGENDAMENTO_PENDENTE = 'INSERIR_LINK_AGENDAMENTO';

export const ESPACOS: Espaco[] = [
  {
    id: 'sala-master',
    nome: 'Sala Master',
    capacidade: 'Até 12 pessoas',
    descricao:
      'Sala executiva para reuniões e fechamentos estratégicos, com ambiente privativo e display interativo.',
    imagem:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD8hrhar4sNdTgHZE3jq9Kxtkp60pb1HQV5xT4MocdLBivtuIGzgupyDFhI1HDu5yS4BAuhQezsR_Dac0TzRkY7cQASNYnua-ADsjMUw13k0_gJHcV6eXkmG6xsGbdQnupJZEE67yVv-sEDAWdHDeFsET2qkc_sUE6RDj8RKwO5t20iJ216oE6up6vZIVvRW84WTWKY_0ltPHxL3JKA_TMyWF9QiZDKzfIHD0ZR2qxLgwg7Y-6bHkML',
    linkAgendamento: AGENDAMENTO_PENDENTE,
  },
  {
    id: 'sala-podcast',
    nome: 'Sala Podcast',
    capacidade: 'Até 4 pessoas',
    descricao:
      'Estúdio para gravação de conteúdo profissional, com isolamento acústico e equipamentos de áudio e vídeo.',
    imagem:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC73zbvUZ7MU290n1G5uo8JdO9RZof32gfVefdgfuPRnUF90D07Qm1FwwZ7lbTyxJDbZgiltH8c90_JBqDWZOiIp5i_eAtArwOy7Gj3nxJDuYtONt_RG6fmP7LgqdmEFRxTXqrCPo6XbHp7wmk88D85ybrmjqUiF4GKDmR99ckNzhKn1d2gJ83shM4Kcq6_TOUfX2W4yCZLb7NuGRTtEEOIlBXzS75x__xZFSVehVxy66Z_y2HpH-Xm',
    linkAgendamento: AGENDAMENTO_PENDENTE,
  },
];
