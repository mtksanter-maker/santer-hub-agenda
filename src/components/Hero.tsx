import { useEffect, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { site } from '../content/site';
import { useTheme } from '../context/ThemeContext';

export default function Hero() {
  const { theme } = useTheme();
  const [mostrarVideo, setMostrarVideo] = useState(false);

  // O vídeo institucional só é carregado onde ele agrega: telas grandes,
  // sem preferência por menos movimento e sem economia de dados.
  useEffect(() => {
    const telaGrande = window.matchMedia('(min-width: 768px)').matches;
    const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const economiaDeDados =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ===
      true;
    setMostrarVideo(telaGrande && !menosMovimento && !economiaDeDados);
  }, []);

  return (
    <section
      id="topo"
      className="relative isolate flex min-h-[85svh] items-center justify-center overflow-hidden px-5 sm:px-8 pt-24 pb-16"
    >
      <div className="gradient-mesh" aria-hidden="true" />

      {mostrarVideo && (
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            tabIndex={-1}
            className="h-full w-full object-cover"
            style={{ opacity: theme === 'dark' ? 0.4 : 0.32 }}
          >
            <source src={site.videoHeroUrl} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-surface/50 via-surface/70 to-surface" />
        </div>
      )}

      <div className="relative w-full max-w-3xl text-center animate-fade-in">
        <h1 className="flex justify-center">
          <img
            src={site.logoUrl}
            alt={site.nome}
            width={560}
            height={150}
            fetchPriority="high"
            className="logo-marca w-full max-w-[280px] sm:max-w-[380px] md:max-w-[460px] h-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </h1>

        <p className="mt-8 font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">
          {site.tagline}
        </p>

        <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-on-surface-variant">
          {site.chamadaHero}
        </p>

        <div className="mt-10 flex justify-center">
          <a
            href="#agenda"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-9 py-4 text-sm font-bold uppercase tracking-wider text-on-primary transition-transform hover:scale-[1.03] active:scale-[0.98] focus-ring"
          >
            Ver agenda
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
