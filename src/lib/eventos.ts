/**
 * Regras de apresentação da agenda e o hook que carrega os eventos.
 *
 * Quem conversa com o Firestore é `src/lib/eventsService.ts`. Aqui só tratamos
 * o que a tela precisa: ordenar, formatar e guardar o estado de carregamento.
 */

import { useCallback, useEffect, useState } from 'react';
import type { Evento } from '../content/events';
import {
  ERRO_LEITURA,
  getAdminEvents,
  getPublicEvents,
  type DadosEvento,
} from './eventsService';

export type { DadosEvento };

export const EVENTO_NOVO: DadosEvento = {
  nome: '',
  descricao: '',
  data: '',
  hora: '',
  imagem: '',
  linkGoogleForms: '',
  ativo: true,
};

/* ==========================================================================
   Apresentação
   ========================================================================== */

/** Só consideramos link o que for realmente uma URL http(s). */
export function linkValido(url: string): boolean {
  return /^https?:\/\/\S+$/i.test(url.trim());
}

/**
 * '2026-09-15' → '15/09/2026'.
 * A conversão é feita na mão de propósito: `new Date('2026-09-15')` é lido como
 * UTC e, no nosso fuso, voltaria um dia.
 */
export function formatarData(data: string): string {
  const partes = data.split('-');
  if (partes.length !== 3) return data;

  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

const MESES_CURTOS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

/**
 * '2026-09-15' → { dia: '15', mes: 'set', ano: '2026' }.
 *
 * Serve ao bloco de data do card, onde o dia é o número grande e o mês é o
 * rótulo abaixo. Devolve `null` se a data não estiver no formato esperado —
 * nesse caso o card cai para a data por extenso, sem inventar nada.
 */
export function partesData(data: string) {
  const partes = data.split('-');
  if (partes.length !== 3) return null;

  const [ano, mes, dia] = partes;
  const nomeMes = MESES_CURTOS[Number(mes) - 1];
  if (!nomeMes) return null;

  return { dia, mes: nomeMes, ano };
}

const DIAS_DA_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

/**
 * '2026-09-15' → 'Terça-feira'. String vazia se a data não for válida.
 *
 * Saber o dia da semana muda o planejamento de quem vai ao evento, e é a única
 * informação da data que não dá para deduzir olhando o card.
 *
 * O `Date` é montado com o construtor de partes, não com a string: passar
 * '2026-09-15' direto seria lido como UTC e, no nosso fuso, voltaria um dia.
 */
export function diaDaSemana(data: string): string {
  const partes = partesData(data);
  if (!partes) return '';

  const referencia = new Date(
    Number(partes.ano),
    MESES_CURTOS.indexOf(partes.mes),
    Number(partes.dia),
  );

  return Number.isNaN(referencia.getTime()) ? '' : DIAS_DA_SEMANA[referencia.getDay()];
}

/** Eventos com data mais próxima primeiro; sem data, por último. */
export function ordenarEventos(eventos: Evento[]): Evento[] {
  return [...eventos].sort((a, b) => {
    if (!a.data !== !b.data) return a.data ? -1 : 1;
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    return a.hora.localeCompare(b.hora);
  });
}

/* ==========================================================================
   Carregamento
   ========================================================================== */

export interface AgendaCarregada {
  eventos: Evento[];
  carregando: boolean;
  erro: string;
  recarregar: () => Promise<void>;
}

/**
 * Carrega a agenda do Firestore.
 *
 * Em caso de falha os eventos já exibidos permanecem na tela — só entra a
 * mensagem de erro. Nada é gravado no navegador: o Firestore é a única fonte.
 *
 * @param publico true na página pública (só eventos ativos, consulta filtrada
 *                no servidor); false no painel (todos, exige login).
 */
export function useEventos(publico: boolean): AgendaCarregada {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro('');

    try {
      setEventos(await (publico ? getPublicEvents() : getAdminEvents()));
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : ERRO_LEITURA);
    } finally {
      setCarregando(false);
    }
  }, [publico]);

  useEffect(() => {
    void buscar();
  }, [buscar]);

  return { eventos, carregando, erro, recarregar: buscar };
}
