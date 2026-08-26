/**
 * Formato de um evento da agenda.
 *
 * Os eventos NÃO ficam neste arquivo: a fonte oficial é a coleção `eventos` do
 * Cloud Firestore, lida e gravada por `src/lib/eventsService.ts`. Aqui mora só
 * o tipo compartilhado pelo site e pelo painel.
 *
 * Cada documento do Firestore tem exatamente estes sete campos. O ID do
 * documento é o `id` do evento.
 */

export interface Evento {
  /** ID do documento no Firestore, gerado automaticamente na criação. */
  id: string;
  nome: string;
  /** Opcional. */
  descricao?: string;
  /** 'AAAA-MM-DD'. */
  data: string;
  /** 'HH:MM'. */
  hora: string;
  /** URL da imagem de capa do card. Obrigatória ao criar/editar pelo painel. */
  imagem: string;
  /** Link do formulário externo de inscrição. */
  linkGoogleForms: string;
  /** Inativo continua no painel, mas não aparece no site público. */
  ativo: boolean;
}
