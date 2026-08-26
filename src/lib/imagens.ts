/**
 * Upload das imagens de capa dos eventos para o Cloud Storage do Firebase.
 *
 * Só o painel importa este arquivo — e o painel já é carregado sob demanda.
 * Assim o SDK do Storage (cerca de 30 KB) fica fora do pacote da página
 * pública, que apenas exibe a URL final gravada no evento.
 *
 * As imagens vão para a pasta `eventos/` do bucket. O nome é gerado aqui e
 * nunca reaproveita o nome do arquivo original: dois administradores enviando
 * "capa.jpg" no mesmo dia não podem sobrescrever um ao outro.
 *
 * Quem autoriza a gravação são as Storage Rules (veja `storage.rules`), não
 * este código: a leitura é pública e a escrita exige usuário autenticado.
 */

import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { app } from './firebase';

/** Formatos aceitos. Mantemos a lista curta e conhecida dos navegadores. */
const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/** Atributo `accept` do input de arquivo — mesma lista, no formato do HTML. */
export const ACEITA = TIPOS_ACEITOS.join(',');

/** 5 MB. Acima disso a capa demora a carregar no celular de quem visita. */
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

export const ERRO_TIPO = 'Formato não aceito. Envie um JPG, PNG, WebP ou AVIF.';
export const ERRO_TAMANHO = 'A imagem passa de 5 MB. Reduza o arquivo e tente de novo.';
export const ERRO_ENVIO = 'Não foi possível enviar a imagem. Tente de novo.';

/** Extensão a partir do tipo do arquivo, sem confiar no nome que veio. */
function extensao(tipo: string): string {
  return tipo === 'image/jpeg' ? 'jpg' : tipo.replace('image/', '');
}

/**
 * Envia a imagem e devolve a URL pública, pronta para gravar no evento.
 *
 * Lança `Error` com mensagem de tela quando o arquivo não serve ou o envio
 * falha — o formulário mostra a mensagem como está.
 */
export async function enviarImagemEvento(arquivo: File): Promise<string> {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) throw new Error(ERRO_TIPO);
  if (arquivo.size > TAMANHO_MAXIMO) throw new Error(ERRO_TAMANHO);

  const nome = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensao(arquivo.type)}`;
  const destino = ref(getStorage(app), `eventos/${nome}`);

  try {
    await uploadBytes(destino, arquivo, { contentType: arquivo.type });
    return await getDownloadURL(destino);
  } catch (erro) {
    if (import.meta.env.DEV) console.error('[imagens] enviarImagemEvento', erro);
    throw new Error(ERRO_ENVIO);
  }
}
