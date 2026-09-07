// ============================================================
// src/components/auth/AuthGlassKit.tsx
// Primitives purement visuelles pour LoginModal.tsx : bouton "verre
// dépoli", révélation en fondu/flou (BlurFade), rotation de messages
// (TextLoop), fond dégradé animé, et une petite pluie de confettis.
//
// Aucune logique métier ici -- uniquement du design, pensé pour tenir
// dans un popup COMPACT (pas plein écran). Palette alignée sur les
// tokens déjà définis dans src/index.css (--civitas-*), pas sur des
// variables shadcn (--background/--foreground/--color-primary...) qui
// n'existent pas dans ce projet.
//
// Toutes les classes sont préfixées `civ-auth-` pour ne jamais entrer
// en collision avec une classe existante ailleurs dans l'app.
// ============================================================

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
  Children,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/utils';
import { AnimatePresence, motion, type Variants, type Transition } from 'motion/react';

// ------------------------------------------------------------
// Styles injectés une seule fois par <AuthGlassStyles /> (voir
// LoginModal.tsx). `--civ-fg` / `--civ-bg` remplacent les
// `--foreground` / `--background` du design d'origine : ils pointent
// vers les tokens civitas existants, qui basculent déjà eux-mêmes
// clair/sombre via la classe `.dark` (voir src/index.css).
// ------------------------------------------------------------
export function AuthGlassStyles() {
  return (
    <style>{`
      .civ-auth-scope {
        --civ-fg: var(--civitas-text-primary);
        --civ-bg: var(--civitas-bg-surface);
      }
      @property --civ-angle-1 { syntax: "<angle>"; inherits: false; initial-value: -75deg; }
      @property --civ-angle-2 { syntax: "<angle>"; inherits: false; initial-value: -45deg; }

      .civ-auth-glass-btn-wrap { position: relative; z-index: 2; transform-style: preserve-3d; transition: transform 400ms cubic-bezier(0.25,1,0.5,1); border-radius: 9999px; }
      .civ-auth-glass-btn-wrap:has(.civ-auth-glass-btn:active) { transform: rotateX(20deg); }
      .civ-auth-glass-btn { -webkit-tap-highlight-color: transparent; position: relative; isolation: isolate; cursor: pointer; border-radius: 9999px; backdrop-filter: blur(clamp(1px, 0.125em, 4px)); transition: all 400ms cubic-bezier(0.25,1,0.5,1); background: linear-gradient(-75deg, oklch(from var(--civ-bg) l c h / 5%), oklch(from var(--civ-bg) l c h / 20%), oklch(from var(--civ-bg) l c h / 5%)); box-shadow: inset 0 0.125em 0.125em oklch(from var(--civ-fg) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--civ-bg) l c h / 50%), 0 0.2em 0.1em -0.1em oklch(from var(--civ-fg) l c h / 18%), 0 0 0.1em 0.2em inset oklch(from var(--civ-bg) l c h / 20%); }
      .civ-auth-glass-btn:hover:not(:disabled) { transform: scale(0.975); }
      .civ-auth-glass-btn:disabled { cursor: not-allowed; opacity: 0.55; }
      .civ-auth-glass-btn-text { position: relative; }
      .civ-auth-glass-btn::after { content: ""; position: absolute; z-index: 1; inset: 0; border-radius: 9999px; padding: 1px; box-sizing: border-box; background: conic-gradient(from var(--civ-angle-1) at 50% 50%, oklch(from var(--civ-fg) l c h / 45%) 0%, transparent 8% 40%, oklch(from var(--civ-fg) l c h / 45%) 50%, transparent 58% 92%, oklch(from var(--civ-fg) l c h / 45%) 100%); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; transition: --civ-angle-1 500ms ease; pointer-events: none; }
      .civ-auth-glass-btn:hover::after { --civ-angle-1: -125deg; }

      .civ-auth-glass-input-wrap { position: relative; z-index: 2; border-radius: 9999px; }
      .civ-auth-glass-input { display: flex; position: relative; width: 100%; align-items: center; gap: 0.4rem; border-radius: 9999px; padding: 0.2rem; backdrop-filter: blur(clamp(1px, 0.125em, 4px)); transition: all 300ms ease; background: linear-gradient(-75deg, oklch(from var(--civ-bg) l c h / 6%), oklch(from var(--civ-bg) l c h / 22%), oklch(from var(--civ-bg) l c h / 6%)); box-shadow: inset 0 0.1em 0.1em oklch(from var(--civ-fg) l c h / 5%), inset 0 -0.1em 0.1em oklch(from var(--civ-bg) l c h / 45%), 0 0.2em 0.1em -0.1em oklch(from var(--civ-fg) l c h / 15%); }
      .civ-auth-glass-input-wrap:focus-within .civ-auth-glass-input { box-shadow: inset 0 0.1em 0.1em oklch(from var(--civ-fg) l c h / 5%), inset 0 -0.1em 0.1em oklch(from var(--civ-bg) l c h / 45%), 0 0 0 0.14em oklch(from var(--civ-fg) l c h / 12%); }
      .civ-auth-glass-input::after { content: ""; position: absolute; z-index: 1; inset: 0; border-radius: 9999px; padding: 1px; box-sizing: border-box; background: conic-gradient(from var(--civ-angle-2) at 50% 50%, oklch(from var(--civ-fg) l c h / 40%) 0%, transparent 8% 40%, oklch(from var(--civ-fg) l c h / 40%) 50%, transparent 58% 92%, oklch(from var(--civ-fg) l c h / 40%) 100%); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; transition: --civ-angle-2 500ms ease; pointer-events: none; }
      .civ-auth-glass-input-wrap:focus-within .civ-auth-glass-input::after { --civ-angle-2: -125deg; }
      .civ-auth-glass-input-wrap.civ-auth-glass-input--error .civ-auth-glass-input::after { background: conic-gradient(from var(--civ-angle-2) at 50% 50%, oklch(from #ef4444 l c h / 55%) 0%, transparent 10% 40%, oklch(from #ef4444 l c h / 55%) 50%, transparent 58% 90%, oklch(from #ef4444 l c h / 55%) 100%); }

      .civ-auth-glass-input input { position: relative; z-index: 2; height: 2.5rem; flex: 1 1 auto; min-width: 0; background: transparent; border: 0; outline: none; color: var(--civ-fg); }
      .civ-auth-glass-input input::placeholder { color: oklch(from var(--civ-fg) l c h / 45%); }

      @media (hover: none) and (pointer: coarse) {
        .civ-auth-glass-btn::after { --civ-angle-1: -75deg !important; }
      }

      /* Variante non interactive (ex : bouton "bientôt disponible") --
         même matière verre dépoli que .civ-auth-glass-btn, sans les
         transitions de survol/clic réservées aux vrais boutons. */
      .civ-auth-glass-static { backdrop-filter: blur(clamp(1px, 0.125em, 4px)); background: linear-gradient(-75deg, oklch(from var(--civ-bg) l c h / 5%), oklch(from var(--civ-bg) l c h / 16%), oklch(from var(--civ-bg) l c h / 5%)); }
    `}</style>
  );
}

// ------------------------------------------------------------
// GlassButton -- remplace la version d'origine bâtie avec
// class-variance-authority (dépendance absente de ce projet) par un
// mapping de tailles manuel, strictement équivalent visuellement.
// ------------------------------------------------------------
type GlassButtonSize = 'default' | 'sm' | 'icon';

const sizeClasses: Record<GlassButtonSize, { btn: string; text: string }> = {
  default: { btn: 'text-sm font-semibold', text: 'block px-5 py-2.5' },
  sm: { btn: 'text-xs font-semibold', text: 'block px-3.5 py-2' },
  icon: { btn: 'h-9 w-9', text: 'flex h-9 w-9 items-center justify-center' },
};

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: GlassButtonSize;
  contentClassName?: string;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size = 'default', contentClassName, onClick, ...props }, ref) => {
    const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const button = e.currentTarget.querySelector('button');
      if (button && e.target !== button && !button.disabled) button.click();
    };
    return (
      <div className={cn('civ-auth-glass-btn-wrap', className)} onClick={handleWrapperClick}>
        <button
          ref={ref}
          className={cn('civ-auth-glass-btn relative', sizeClasses[size].btn)}
          onClick={onClick}
          {...props}
        >
          <span className={cn('civ-auth-glass-btn-text', sizeClasses[size].text, contentClassName)}>{children}</span>
        </button>
      </div>
    );
  }
);
GlassButton.displayName = 'GlassButton';

// ------------------------------------------------------------
// BlurFade -- révélation en fondu + flou léger au montage. Pas de
// déclenchement au scroll (useInView/IntersectionObserver) : dans un
// popup toujours entièrement visible à l'écran, ce serait une
// dépendance inutile (et absente de l'environnement de test jsdom du
// projet -- voir Header.test.tsx, qui monte ce popup directement).
// ------------------------------------------------------------
interface BlurFadeProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  yOffset?: number;
}

export function BlurFade({ children, className, duration = 0.35, delay = 0, yOffset = 6 }: BlurFadeProps) {
  const variants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: 'blur(6px)' },
    visible: { y: 0, opacity: 1, filter: 'blur(0px)' },
  };
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={variants}
      transition={{ delay, duration, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ------------------------------------------------------------
// TextLoop -- fait défiler un tableau d'éléments en boucle. Utilisé
// pour le message de chargement pendant une connexion/inscription en
// cours (durée réelle inconnue -> boucle continue tant que
// `submitting` est vrai côté LoginModal, pas de durée figée).
// ------------------------------------------------------------
interface TextLoopProps {
  children: ReactNode[];
  className?: string;
  interval?: number;
  transition?: Transition;
}

export function TextLoop({ children, className, interval = 1.4, transition = { duration: 0.3 } }: TextLoopProps) {
  const [index, setIndex] = useState(0);
  const items = Children.toArray(children);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, interval * 1000);
    return () => clearInterval(id);
  }, [items.length, interval]);

  const variants: Variants = {
    initial: { y: 12, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -12, opacity: 0 },
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={index} initial="initial" animate="animate" exit="exit" transition={transition} variants={variants}>
          {items[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ------------------------------------------------------------
// AuthGradientBackground -- version compacte (proportionnée à une
// carte de popup, pas à une page entière) du fond dégradé animé,
// recoloré avec la palette de marque civitas (voir src/index.css)
// plutôt que des variables shadcn absentes de ce projet.
// ------------------------------------------------------------
export function AuthGradientBackground() {
  return (
    <>
      <style>{`
        @keyframes civAuthFloat1 { 0% { transform: translate(0,0); } 50% { transform: translate(-8px, 8px); } 100% { transform: translate(0,0); } }
        @keyframes civAuthFloat2 { 0% { transform: translate(0,0); } 50% { transform: translate(8px, -8px); } 100% { transform: translate(0,0); } }
      `}</style>
      <svg width="100%" height="100%" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="civAuthGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--civitas-purple)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--civitas-purple-accent)" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="civAuthGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--civitas-navy-light)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--civitas-purple)" stopOpacity="0.3" />
          </linearGradient>
          <filter id="civAuthBlur1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30" /></filter>
          <filter id="civAuthBlur2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22" /></filter>
        </defs>
        <g style={{ animation: 'civAuthFloat1 18s ease-in-out infinite' }}>
          <ellipse cx="90" cy="420" rx="150" ry="110" fill="url(#civAuthGrad1)" filter="url(#civAuthBlur1)" transform="rotate(-25 90 420)" />
        </g>
        <g style={{ animation: 'civAuthFloat2 22s ease-in-out infinite' }}>
          <circle cx="330" cy="70" r="110" fill="url(#civAuthGrad2)" filter="url(#civAuthBlur2)" opacity="0.8" />
        </g>
      </svg>
    </>
  );
}

// ------------------------------------------------------------
// MiniConfetti -- petite pluie de confettis autonome (canvas 2D), sans
// dépendance externe (canvas-confetti n'est pas installé dans ce
// projet ; en ajouter un ici aurait désynchronisé bun.lock /
// package-lock.json et risqué de casser le build Vercel). Expose la
// même forme d'API que la référence : `ref.current.fire()`.
// ------------------------------------------------------------
export interface MiniConfettiHandle {
  fire: () => void;
}

const CONFETTI_COLORS = ['#5B4DFF', '#7B61FF', '#F59E0B', '#16A34A'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vr: number;
  life: number;
}

export const MiniConfetti = forwardRef<MiniConfettiHandle, { className?: string }>(({ className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    for (const p of particles) {
      p.vy += 0.12; // gravité
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;
      p.life -= 1;
      ctx.save();
      ctx.globalAlpha = Math.max(p.life / 90, 0);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
      ctx.restore();
    }
    particlesRef.current = particles.filter((p) => p.life > 0);

    if (particlesRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = null;
    }
  }, []);

  const fire = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const origins = [
      { x: rect.width * 0.08, dir: 1 },
      { x: rect.width * 0.92, dir: -1 },
    ];
    const newParticles: Particle[] = [];
    for (const origin of origins) {
      for (let i = 0; i < 26; i += 1) {
        const angle = (Math.random() * 50 - 25 + (origin.dir === 1 ? -35 : 35)) * (Math.PI / 180);
        const speed = 4 + Math.random() * 5;
        newParticles.push({
          x: origin.x,
          y: rect.height * 0.92,
          vx: Math.sin(angle) * speed * origin.dir * -1,
          vy: -Math.cos(angle) * speed,
          size: 5 + Math.random() * 4,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          rotation: Math.random() * 360,
          vr: Math.random() * 12 - 6,
          life: 70 + Math.random() * 30,
        });
      }
    }
    particlesRef.current = particlesRef.current.concat(newParticles);
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  useImperativeHandle(ref, () => ({ fire }), [fire]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
});
MiniConfetti.displayName = 'MiniConfetti';
