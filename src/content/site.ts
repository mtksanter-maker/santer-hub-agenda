/**
 * Configuração geral do site.
 *
 * Este arquivo centraliza textos institucionais, links e assets da marca.
 * Campos deixados como string vazia ('') simplesmente NÃO são exibidos na
 * página — nunca geram botões ou links quebrados.
 */

export const site = {
  nome: 'Santer Hub',
  tagline: 'Capacitação. Conexão. Resultado.',

  /** Frase de abertura do Hero. */
  chamadaHero: [
    'Um ecossistema criado para desenvolver parceiros,',
    'fortalecer conexões e acelerar a performance imobiliária',
    'através de relacionamento, conteúdo e capacitação contínua.',
  ],

  /** Texto institucional curto (seção "O Hub"). */
  textoInstitucional:
    'O Santer Hub é um espaço criado para fortalecer o relacionamento e o desenvolvimento dos parceiros imobiliários da Santer.',

  /** Texto de apoio do rodapé. */
  textoRodape:
    'O primeiro hub de negócios imobiliários do Brasil. O Santer HUB nasce para evidenciar o que sempre acreditamos: o parceiro imobiliário é o protagonista da nossa jornada. Este espaço é a materialização da metodologia e da cultura organizacional da Santer Empreendimentos: relevante, inquieta e em constante evolução.',

  // ---------------------------------------------------------------------------
  // Assets da marca
  // ---------------------------------------------------------------------------
  /** Logo do Santer Hub — usado no Hero e no rodapé. */
  logoUrl: 'https://i.imgur.com/FyEzFUM.png',

  /**
   * Logo institucional da Santer — usado no menu (no lugar do logo do Hub) e
   * no rodapé, ao lado dele.
   */
  logoSanterUrl: 'https://i.imgur.com/jCjAJUF.png',

  /**
   * Vídeo institucional usado como fundo do Hero (somente em telas grandes).
   *
   * É o mesmo asset do Cloudinary, servido com a transformação `q_auto,w_1280`:
   * 657 KB em vez dos 3,9 MB do original, sem diferença perceptível como fundo.
   * Remova o trecho `q_auto,w_1280/` da URL para voltar ao arquivo original.
   */
  videoHeroUrl:
    'https://res.cloudinary.com/vvumzxhi/video/upload/q_auto,w_1280/v1783365332/Santer_Hub_institutional_video_1080p_202607031643_mejhzi.mp4',

  // ---------------------------------------------------------------------------
  // Contato
  // ---------------------------------------------------------------------------
  endereco: 'Av. Emanoel Pinto, 1294 - Centro, Balneário Piçarras - SC, 88380-000',
  email: 'hub@santerempreendimentos.com.br',

  /**
   * Links opcionais. Preencha para que apareçam no site.
   *
   * INSERIR_WHATSAPP_OFICIAL  -> ex.: 'https://wa.me/5547900000000'
   * INSERIR_LINK_INSTAGRAM    -> ex.: 'https://instagram.com/perfil-oficial'
   * INSERIR_SITE_INSTITUCIONAL-> ex.: 'https://santerempreendimentos.com.br'
   */
  whatsapp: '',
  instagram: '',
  siteInstitucional: '',
} as const;

/** URL do Google Maps derivada do endereço acima. */
export const mapaUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  site.endereco,
)}`;
