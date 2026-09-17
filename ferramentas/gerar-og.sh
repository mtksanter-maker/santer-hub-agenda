#!/usr/bin/env bash
#
# Gera a imagem de compartilhamento do site — `public/og.png`.
#
# É a imagem que WhatsApp, LinkedIn, Facebook e X mostram quando alguém manda
# o link do Hub. O arquivo final é versionado no repositório; este script
# existe para recriá-lo quando a marca, a frase ou o layout mudarem, sem
# depender de nenhum editor de imagem.
#
#   bash ferramentas/gerar-og.sh
#
# Precisa de rsvg-convert (librsvg) e do ImageMagick, e baixa da internet os
# dois logos e a fonte Manrope. Nada é instalado no sistema: a fonte é usada a
# partir de uma pasta temporária, via um fontconfig próprio.
set -euo pipefail

cd "$(dirname "$0")/.."
DESTINO='public/og.png'

# 1200×630 é o formato que os robôs de preview esperam (a proporção 1,91:1 do
# Facebook/WhatsApp). Sair dela é receber a imagem cortada.
LARGURA=1200
ALTURA=630

# As cores são as mesmas de src/index.css — se o tema mudar lá, atualize aqui.
SURFACE='#0a141d'   # --surface, o fundo da página
PRIMARY='#95e1ff'   # --primary, o ciano da marca
ON_SURFACE='#e2eaf5'
ON_VARIANTE='#a9b8c4'

TAGLINE='Capacitação. Conexão. Resultado.'
RODAPE='AGENDA DE EVENTOS'

LOGO_HUB='https://i.imgur.com/FyEzFUM.png'
LOGO_SANTER='https://i.imgur.com/jCjAJUF.png'
FONTE='https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf'

for programa in rsvg-convert convert curl base64; do
  command -v "$programa" >/dev/null || { echo "Falta o programa '$programa'." >&2; exit 1; }
done

TRABALHO="$(mktemp -d)"
trap 'rm -rf "$TRABALHO"' EXIT

echo '1/4 baixando logos e a fonte'
curl -fsSL -m 60 -o "$TRABALHO/hub-original.png" "$LOGO_HUB"
curl -fsSL -m 60 -o "$TRABALHO/santer-original.png" "$LOGO_SANTER"
curl -fsSL -m 60 -o "$TRABALHO/Manrope.ttf" "$FONTE"

# Os originais são muito maiores do que o necessário (o da Santer tem 15382px
# de largura). Reduzir antes de embutir mantém o SVG — e o PNG final — leves,
# e com o dobro do tamanho de exibição a arte continua nítida em tela retina.
echo '2/4 preparando as imagens'
convert "$TRABALHO/hub-original.png" -resize 1240x -strip "$TRABALHO/hub.png"
convert "$TRABALHO/santer-original.png" -resize 320x -strip "$TRABALHO/santer.png"

# A fonte é lida de uma pasta temporária: gerar a imagem não deve mexer nas
# fontes instaladas na máquina de quem roda o script.
mkdir -p "$TRABALHO/fc/cache"
cat > "$TRABALHO/fc/fonts.conf" <<XML
<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>$TRABALHO</dir>
  <cachedir>$TRABALHO/fc/cache</cachedir>
  <include ignore_missing="yes">/etc/fonts/conf.d</include>
</fontconfig>
XML
export FONTCONFIG_FILE="$TRABALHO/fc/fonts.conf"

# Os logos entram embutidos em base64, e não como link para o arquivo: assim o
# SVG é um arquivo único e o rasterizador não depende de caminho relativo.
HUB_B64="$(base64 -w0 "$TRABALHO/hub.png")"
SANTER_B64="$(base64 -w0 "$TRABALHO/santer.png")"

# O logo do Hub tem proporção 2216:600. A largura de 620px (52% da imagem)
# deixa margem de sobra dos dois lados: na miniatura do WhatsApp, que é
# pequena, uma marca muito grande encosta nas bordas e perde o ar.
HUB_L=620
HUB_A=168
HUB_X=$(( (LARGURA - HUB_L) / 2 ))
HUB_Y=168

echo '3/4 desenhando'
cat > "$TRABALHO/og.svg" <<XML
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="$LARGURA" height="$ALTURA" viewBox="0 0 $LARGURA $ALTURA">
  <defs>
    <!--
      A luz da marca, subindo da base — a mesma leitura do Hero do site, onde
      o azul nasce embaixo e o topo fica escuro para a marca respirar.
      
      Não é a conversão literal do gradiente do CSS. A variável hero-fundo
      descreve uma elipse de 125% da caixa pensada para uma tela alta; numa
      imagem 1200x630, que é mais larga do que alta, o extremo da elipse cai
      fora do quadro e sobra como duas manchas tortas nos cantos de baixo.
      Aqui a luz é uma elipse deitada, centrada abaixo da borda inferior:
      simétrica, e com o clarão onde ele deve estar.
    -->
    <radialGradient id="luz" gradientUnits="userSpaceOnUse"
      cx="600" cy="700" r="640"
      gradientTransform="translate(600 700) scale(1.35 0.62) translate(-600 -700)">
      <stop offset="0" stop-color="$PRIMARY" stop-opacity="0.62"/>
      <stop offset="0.45" stop-color="#0b3a5c" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#0b3a5c" stop-opacity="0"/>
    </radialGradient>
    <!-- O halo ciano atrás da marca, como o brilho hub-logo-shadow do site. -->
    <filter id="brilho" x="-30%" y="-80%" width="160%" height="260%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
  </defs>

  <rect width="$LARGURA" height="$ALTURA" fill="#01070c"/>
  <rect width="$LARGURA" height="$ALTURA" fill="url(#luz)"/>

  <g opacity="0.55" filter="url(#brilho)">
    <image x="$HUB_X" y="$HUB_Y" width="$HUB_L" height="$HUB_A"
           xlink:href="data:image/png;base64,$HUB_B64"/>
  </g>
  <image x="$HUB_X" y="$HUB_Y" width="$HUB_L" height="$HUB_A"
         xlink:href="data:image/png;base64,$HUB_B64"/>

  <text x="600" y="425" text-anchor="middle" font-family="Manrope"
        font-weight="600" font-size="36" letter-spacing="0.4" fill="$ON_SURFACE">$TAGLINE</text>

  <!-- Filete e assinatura: separam a marca do "o que é isto". -->
  <line x1="180" y1="516" x2="1020" y2="516" stroke="$PRIMARY" stroke-opacity="0.18" stroke-width="1"/>
  <text x="180" y="564" font-family="Manrope" font-weight="700" font-size="17"
        letter-spacing="3.4" fill="$ON_VARIANTE">$RODAPE</text>
  <image x="884" y="537" width="136" height="36" opacity="0.9"
         xlink:href="data:image/png;base64,$SANTER_B64"/>
</svg>
XML

rsvg-convert "$TRABALHO/og.svg" -w "$LARGURA" -h "$ALTURA" -o "$TRABALHO/og-bruto.png"

# Achatar a transparência é o ponto principal: a imagem antiga era um PNG com
# fundo transparente e letras brancas, e os robôs de preview achatam alpha em
# branco — branco sobre branco, uma imagem vazia. Aqui o fundo é opaco.
echo '4/4 finalizando'
convert "$TRABALHO/og-bruto.png" -background "$SURFACE" -alpha remove -alpha off \
  -strip -quality 92 "$DESTINO"

identify -format '%f  %wx%h  %[channels]  %b\n' "$DESTINO"
