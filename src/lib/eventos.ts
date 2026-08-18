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
