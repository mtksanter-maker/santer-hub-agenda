/**
 * Envio da imagem de capa para o servidor do próprio site.
 *
 * O Cloud Storage do Firebase exigiria o plano Blaze, então quem guarda o
 * arquivo é a hospedagem: `upload.php` recebe, valida, redimensiona e devolve
 * a URL — que é tudo o que o evento guarda.
 *
 * O caminho é relativo de propósito. O painel vive na raiz do site publicado
 * e um caminho absoluto quebraria no GitHub Pages, onde o site mora numa
 * subpasta (lá o upload não funciona de qualquer forma: não há PHP). Como
 * consequência aceita, abrir o painel pela cópia do Pages e tentar enviar
 * uma imagem vai falhar — o Pages é cópia de segurança, não o lugar de
 * trabalho.
 */
import { tokenAtual } from './auth';

const ENDPOINT = 'upload.php';

/** Atributo `accept` do input de arquivo. Os mesmos tipos que o PHP aceita. */
export const ACEITA = 'image/jpeg,image/png,image/webp,image/avif';

/** 5 MB — o mesmo teto do servidor, checado aqui só para avisar antes. */
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

export const ERRO_TAMANHO = 'A imagem passa de 5 MB. Reduza o arquivo e tente de novo.';
export const ERRO_ENVIO = 'Não foi possível enviar a imagem. Tente de novo.';

/**
 * Envia a imagem e devolve a URL pública, pronta para gravar no evento.
 *
 * Lança `Error` com mensagem pronta para a tela: o formulário mostra o que
 * vier daqui sem reescrever nada.
 */
export async function enviarImagemEvento(arquivo: File): Promise<string> {
  if (arquivo.size > TAMANHO_MAXIMO) throw new Error(ERRO_TAMANHO);

  const corpo = new FormData();
  corpo.append('imagem', arquivo);

  // Buscar o token FORA do try de rede, de propósito: tokenAtual() lança sua
  // própria mensagem ("Sua sessão expirou...") quando a sessão caiu, e essa
  // mensagem precisa chegar intacta à tela. Se entrar no try, o catch abaixo
  // — que existe para falha real de rede — a rotula como "rede" e a
  // substitui pelo texto genérico, escondendo o motivo verdadeiro.
  const token = await tokenAtual();

  let resposta: Response;
  try {
    resposta = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: corpo,
    });
  } catch (erro) {
    if (import.meta.env.DEV) console.error('[imagens] rede', erro);
    throw new Error(ERRO_ENVIO);
  }

  // O servidor manda a mensagem já pronta para a pessoa ler; só caímos no
  // texto genérico quando a resposta não é o JSON que combinamos.
  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok || typeof dados?.url !== 'string') {
    throw new Error(typeof dados?.erro === 'string' ? dados.erro : ERRO_ENVIO);
  }

  return dados.url;
}
