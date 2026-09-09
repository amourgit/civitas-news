import * as React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Smile, Send, Mic, Square, X } from 'lucide-react';
import { Commentaire } from '../../../types/global.types';
import { Avatar } from '../../../components/ui/Avatar';
import { WhatsAppEmojiModal } from '../../../components/ui/WhatsAppEmojiModal';
import { toast } from '../../../hooks/useToast';
import { cn } from '../../../lib/utils';

// ----------------------------------------------------------------------
// Physique des transitions -- reprise à l'identique du composant fourni
// (même easing/durées) : c'est CETTE signature qui doit rester
// reconnaissable, pas juste la forme visuelle statique.
// ----------------------------------------------------------------------
const SPRING_TRANSITION =
  'max-width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
const SMOOTH_HEIGHT_TRANSITION = 'max-width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), height 0.15s ease-out';
const TRAY_HEIGHT = 64;

function useMinWidthMatch(query: string): boolean {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = () => setMatches(mql.matches);
    handler();
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

function quoteSnippet(text: string, max = 110) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

// ----------------------------------------------------------------------
// Morphing state text -- identique au composant fourni (largeur mesurée
// puis animée, crossfade zoom+fade sur le contenu qui change).
// ----------------------------------------------------------------------
function MorphingText({ text }: { text: string }) {
  const [width, setWidth] = useState<number | 'auto'>('auto');
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current) setWidth(spanRef.current.offsetWidth);
  }, [text]);

  return (
    <span
      className="relative inline-flex items-center justify-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
      style={{ width }}
    >
      <span ref={spanRef} className="invisible whitespace-nowrap px-0.5">
        {text}
      </span>
      <span
        key={text}
        className="absolute inset-0 flex items-center justify-center whitespace-nowrap animate-in fade-in zoom-in-95 duration-300"
      >
        {text}
      </span>
    </span>
  );
}

export interface NewsCommentDockProps {
  /** Commentaire actuellement ciblé par une réponse, ou `null` en mode commentaire libre. */
  replyTarget: Commentaire | null;
  /** Annule la réponse en cours (bouton X sur l'indexation, ou touche Échap). */
  onCancelReply: () => void;
  /** Envoi d'un commentaire racine (aucune cible). */
  onSubmitRoot: (text: string) => void | Promise<void>;
  /** Envoi d'une réponse au commentaire ciblé par `replyTarget`. */
  onSubmitReply: (text: string, parentId: string) => void | Promise<void>;
  placeholder?: string;
}

/**
 * Dock de commentaires fixé en bas de la page détails News -- remplace
 * visuellement le dock de navigation mobile sur cette page (voir
 * App.tsx : MobileDock masqué sur /news/:slug et /sujets/:slug).
 *
 * Reprend intégralement le shell/les animations du composant PromptInput
 * fourni par Samuel (pilule qui s'étire au clic, easing/durées identiques,
 * dégradés de fondu haut/bas sur le textarea, bouton d'action qui morphe
 * flèche <-> micro <-> stop) :
 * - Le "tiroir de pièces jointes" (glisse de derrière la pilule, hauteur
 *   0->auto animée) est repris tel quel mais réaffecté à l'indexation
 *   du commentaire visé par une réponse (un seul item, toujours visible
 *   -- pas de survol requis, pensé mobile) au lieu d'une galerie d'images :
 *   c'est cette réutilisation qui répond à la demande "l'apparition de
 *   l'indexation doit être animée et non brusque".
 * - Pas de sélecteur de modèle/effort (hors sujet ici) ; à la place, un
 *   simple bouton emoji (réutilise WhatsAppEmojiModal, déjà utilisé par
 *   CommentComposer/CommentBubble ailleurs dans ce fil).
 * - Le micro fait de la dictée vocale réelle (Web Speech API) directement
 *   dans le champ texte, avec le même visualiseur 5 barres (Web Audio
 *   analyser) que l'original ; sans support navigateur/permission, on
 *   prévient simplement par toast au lieu d'injecter un faux texte de
 *   démo (qui n'aurait aucun sens pour un vrai commentaire).
 */
export const NewsCommentDock: React.FC<NewsCommentDockProps> = ({
  replyTarget,
  onCancelReply,
  onSubmitRoot,
  onSubmitReply,
  placeholder = 'Partagez votre point de vue...',
}) => {
  const isSmUp = useMinWidthMatch('(min-width: 640px)');

  const [expanded, setExpanded] = useState(false);
  const [isSmoothResize, setIsSmoothResize] = useState(false);
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<number[]>(new Array(5).fill(0));

  const [containerHeight, setContainerHeight] = useState(88);
  const [textareaHeight, setTextareaHeight] = useState(44);
  const [isScrolling, setIsScrolling] = useState(false);

  const hasValue = value.trim() !== '';

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const topFadeRef = useRef<HTMLDivElement>(null);
  const bottomFadeRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const updateFades = () => {
    const el = textareaRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (topFadeRef.current) topFadeRef.current.style.opacity = Math.min(scrollTop / 20, 1).toString();
    if (bottomFadeRef.current) {
      const bottomScroll = scrollHeight - clientHeight - scrollTop;
      bottomFadeRef.current.style.opacity = Math.min(Math.max(bottomScroll - 16, 0) / 10, 1).toString();
    }
  };

  const handleValueChange = useCallback((val: string) => {
    setIsSmoothResize(true);
    setValue(val);
  }, []);

  const expand = () => {
    setIsSmoothResize(false);
    setExpanded(true);
  };

  const collapse = () => {
    setIsSmoothResize(false);
    setExpanded(false);
  };

  // --- Dictée vocale (Web Speech API) + visualiseur Web Audio réel ---
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsRecording(false);
    setAudioData(new Array(5).fill(0));
  }, []);

  const startRecording = useCallback(async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast('info', 'Dictée vocale indisponible', "Votre navigateur ne prend pas en charge la reconnaissance vocale. Écrivez votre commentaire directement.");
      return;
    }

    let stream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch {
      toast('error', 'Micro indisponible', "L'accès au microphone a été refusé ou n'est pas disponible.");
      return;
    }

    setIsSmoothResize(false);
    setExpanded(true);
    setIsRecording(true);

    if (stream) {
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVisualizer = () => {
        analyser.getByteFrequencyData(dataArray);
        const bands = new Array(5).fill(0);
        const step = Math.floor(dataArray.length / 5) || 1;
        for (let i = 0; i < 5; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) sum += dataArray[i * step + j] || 0;
          bands[i] = sum / step / 255;
        }
        setAudioData(bands);
        rafRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    let baseline = valueRef.current;

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      if (finalText) baseline += (baseline ? ' ' : '') + finalText.trim();
      handleValueChange((baseline + (interim ? ` ${interim}` : '')).trim());
    };
    recognition.onerror = () => stopRecording();
    recognition.onend = () => stopRecording();

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      stopRecording();
    }
  }, [handleValueChange, stopRecording]);

  useEffect(() => () => stopRecording(), [stopRecording]);

  // --- Expansion automatique : texte saisi OU réponse ciblée ---
  useEffect(() => {
    if ((hasValue || replyTarget) && !expanded) {
      setIsSmoothResize(false);
      setExpanded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasValue, replyTarget, expanded]);

  // --- Focus + petit rebond à chaque changement de cible de réponse ---
  // (indépendant de l'effet ci-dessus : `expanded` peut déjà valoir
  // `true`, donc ce useEffect séparé, gardé sur l'identité du
  // commentaire ciblé, est ce qui garantit le focus à CHAQUE sélection,
  // y compris en passant d'une cible à une autre pendant que le dock est
  // déjà ouvert).
  useEffect(() => {
    if (!replyTarget) return;
    setIsSmoothResize(false);
    const t = setTimeout(() => {
      textareaRef.current?.focus();
      const len = textareaRef.current?.value.length ?? 0;
      textareaRef.current?.setSelectionRange(len, len);
    }, 260);
    return () => clearTimeout(t);
  }, [replyTarget?.id]);

  useEffect(() => {
    if (expanded && !isRecording) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        const len = textareaRef.current?.value.length ?? 0;
        textareaRef.current?.setSelectionRange(len, len);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [expanded, isRecording]);

  // --- Auto-resize du textarea (isolé des changements du tiroir) ---
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const currentHeight = el.style.height;
    el.style.transition = 'none';
    el.style.height = '0px';
    const scrollHeight = el.scrollHeight;
    el.style.height = currentHeight;
    void el.offsetHeight;
    el.style.transition = '';

    const newHeight = Math.max(44, Math.min(scrollHeight, 160));
    el.style.height = `${newHeight}px`;
    setTextareaHeight(newHeight);
    setIsScrolling(scrollHeight > 160);
    setTimeout(updateFades, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, expanded]);

  useEffect(() => {
    setContainerHeight(Math.max(88, textareaHeight + 44));
    setTimeout(updateFades, 0);
  }, [textareaHeight]);

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (wrapperRef.current && wrapperRef.current.contains(e.relatedTarget as Node)) return;
    if (!hasValue && !replyTarget && !isRecording) collapse();
  };

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (replyTarget) await onSubmitReply(trimmed, replyTarget.id);
      else await onSubmitRoot(trimmed);
      setValue('');
      collapse();
    } catch {
      // Toast d'erreur déjà géré par useComments.ts -- on garde le texte
      // saisi pour que l'utilisateur ne le perde pas et puisse réessayer.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiSelect = (emojiSymbol: string) => {
    handleValueChange(value + emojiSymbol);
    textareaRef.current?.focus();
  };

  const showArrow = hasValue && !isRecording;
  const showStop = isRecording;
  const showMic = !hasValue && !isRecording;

  const onActionButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isRecording) stopRecording();
    else if (hasValue) handleSubmit();
    else startRecording();
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pointer-events-none"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div
        ref={wrapperRef}
        onBlur={handleBlur}
        className="relative flex flex-col w-full sm:w-auto pointer-events-auto"
        style={{
          maxWidth: isSmUp ? (expanded ? 480 : 320) : undefined,
          transition: isSmoothResize ? 'max-width 0.15s ease-out' : 'max-width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        {/* Tiroir d'indexation de réponse -- glisse de derrière la pilule
            principale, EXACTEMENT le mécanisme du tiroir de pièces jointes
            du composant fourni (hauteur 0->auto, translateY(100%)->0,
            opacité 0->1), réaffecté à l'aperçu du commentaire ciblé. */}
        <div
          aria-hidden={!replyTarget}
          style={{
            height: replyTarget && expanded ? TRAY_HEIGHT : 0,
            transition: isSmoothResize ? 'height 0.15s ease-out' : `height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)`,
          }}
          className="w-full relative z-0 overflow-hidden"
        >
          <div
            style={{
              position: 'absolute',
              bottom: -8,
              left: 20,
              right: 20,
              height: TRAY_HEIGHT,
              transform: replyTarget && expanded ? 'translateY(0)' : 'translateY(100%)',
              opacity: replyTarget && expanded ? 1 : 0,
              transition: isSmoothResize
                ? 'transform 0.15s ease-out, opacity 0.15s ease-out'
                : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease-out',
            }}
            className="rounded-t-2xl border border-b-0 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#12163a] px-2.5 pt-2 pb-3.5 flex items-start gap-2"
          >
            {replyTarget && (
              <>
                <span className="w-1 self-stretch rounded-full bg-[#5B4DFF] shrink-0" />
                <Avatar
                  src={replyTarget.auteur.avatar}
                  name={replyTarget.auteur.nomAffiche}
                  size="sm"
                  className="w-6 h-6 rounded-full shrink-0 mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <span className="font-extrabold text-[#5B4DFF] dark:text-sky-300 text-[11px] block truncate">
                    <MorphingText text={`Réponse à @${replyTarget.auteur.nomAffiche}`} />
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 block truncate">
                    {quoteSnippet(replyTarget.contenu)}
                  </span>
                </div>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onCancelReply()}
                  className="p-1 rounded-full bg-white/80 dark:bg-black/20 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white shadow-sm transition-all duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:scale-110 shrink-0"
                  aria-label="Annuler la réponse"
                  title="Annuler la réponse"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Carte principale */}
        <div
          onMouseDown={(e) => {
            const isTextarea = e.target === textareaRef.current;
            if (expanded && !isTextarea && !isRecording) {
              e.preventDefault();
              textareaRef.current?.focus();
            }
          }}
          style={{
            borderRadius: 24,
            height: expanded ? containerHeight : 48,
            transition: isSmoothResize ? SMOOTH_HEIGHT_TRANSITION : SPRING_TRANSITION,
            overflow: expanded ? 'visible' : 'hidden',
          }}
          className={cn(
            'relative w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1F4D] shadow-sm',
            'focus-within:border-[#5B4DFF]/50 focus-within:ring-1 focus-within:ring-[#5B4DFF]/30',
            'hover:border-gray-300 dark:hover:border-gray-600 z-10',
            expanded ? 'cursor-text' : 'cursor-default'
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            onScroll={updateFades}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
              if (e.key === 'Escape' && !hasValue) {
                if (replyTarget) onCancelReply();
                else collapse();
              }
            }}
            placeholder={replyTarget ? `Répondre à @${replyTarget.auteur.nomAffiche}...` : placeholder}
            aria-label="Écrire un commentaire"
            disabled={isRecording}
            style={{
              transition: isSmoothResize
                ? 'height 0.15s ease-out'
                : 'opacity 0.3s ease-out, transform 0.3s ease-out, height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
            className={cn(
              'absolute top-0 inset-x-0 z-[1] w-full resize-none bg-transparent pl-4 pr-12 py-3 text-xs sm:text-sm leading-[20px] text-gray-900 dark:text-white outline-none placeholder:font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 cursor-text',
              expanded ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none',
              isScrolling ? 'overflow-y-auto' : 'overflow-y-hidden',
              isRecording && 'pointer-events-none'
            )}
          />

          <div
            ref={topFadeRef}
            className="absolute left-4 right-12 top-0 z-[2] h-6 bg-gradient-to-b from-white dark:from-[#1A1F4D] via-white/90 dark:via-[#1A1F4D]/90 to-transparent pointer-events-none"
          />
          <div
            ref={bottomFadeRef}
            className="absolute left-4 right-12 z-[2] h-6 bg-gradient-to-t from-white dark:from-[#1A1F4D] via-white/90 dark:via-[#1A1F4D]/90 to-transparent pointer-events-none"
            style={{
              opacity: 0,
              top: `${textareaHeight - 24}px`,
              transition: isSmoothResize ? 'top 0.15s ease-out' : 'top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          />

          <button
            type="button"
            onClick={expand}
            style={{ transition: isSmoothResize ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
            className={cn(
              'absolute inset-x-0 top-0 z-[1] cursor-text pl-4 pr-12 py-[13px] text-left text-xs sm:text-sm font-medium leading-[17px] text-gray-400 dark:text-gray-500 outline-none',
              !expanded ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-105 translate-y-1 pointer-events-none'
            )}
            aria-label="Écrire un commentaire"
          >
            {placeholder}
          </button>

          {/* Ligne d'actions (emoji) -- masquée pendant l'enregistrement */}
          <div
            className={cn(
              'absolute bottom-2 left-3 right-12 z-[10] flex items-center gap-0 transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]',
              expanded && !isRecording ? 'opacity-100 blur-0 translate-y-0 pointer-events-auto' : 'opacity-0 blur-sm translate-y-2 pointer-events-none'
            )}
          >
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiModal(true);
              }}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-gray-500 dark:text-gray-400 transition-all duration-200 outline-none hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-amber-500 dark:hover:text-amber-400 cursor-default"
              title="Insérer un emoji"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Visualiseur audio (5 barres, niveaux réels via Web Audio) */}
          <div
            className={cn(
              'absolute right-12 bottom-2 z-[10] flex h-8 items-center justify-end gap-[3px] transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]',
              isRecording ? 'w-16 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-4 pointer-events-none'
            )}
          >
            {audioData.map((val, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-[#5B4DFF] transition-[height] duration-75 ease-out"
                style={{ height: `${Math.max(4, val * 24)}px` }}
              />
            ))}
          </div>

          {/* Bouton d'action -- morphe flèche <-> micro <-> stop, identique au composant fourni */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={onActionButtonClick}
            disabled={isSubmitting}
            aria-label={showArrow ? 'Envoyer le commentaire' : showStop ? "Arrêter la dictée" : 'Dicter le commentaire'}
            style={{ borderRadius: 9999 }}
            className="absolute right-2 bottom-2 z-[10] flex h-8 w-8 items-center justify-center bg-[#5B4DFF] hover:bg-[#4A3FE0] text-white transition-all duration-300 outline-none disabled:opacity-60 cursor-default"
          >
            <span className="relative flex h-full w-full items-center justify-center">
              <span
                className={cn(
                  'absolute inset-0 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]',
                  showArrow ? 'opacity-100 scale-100 rotate-0 blur-none' : 'opacity-0 scale-50 rotate-45 blur-[1px] pointer-events-none'
                )}
              >
                <Send className="w-3.5 h-3.5" />
              </span>
              <span
                className={cn(
                  'absolute inset-0 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]',
                  showMic ? 'opacity-100 scale-100 rotate-0 blur-none' : 'opacity-0 scale-50 -rotate-45 blur-[1px] pointer-events-none'
                )}
              >
                <Mic className="w-3.5 h-3.5" />
              </span>
              <span
                className={cn(
                  'absolute inset-0 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]',
                  showStop ? 'opacity-100 scale-100 rotate-0 blur-none' : 'opacity-0 scale-50 rotate-45 blur-[1px] pointer-events-none'
                )}
              >
                <Square className="w-3 h-3 fill-current" />
              </span>
            </span>
          </button>
        </div>
      </div>

      <WhatsAppEmojiModal isOpen={showEmojiModal} onClose={() => setShowEmojiModal(false)} onSelectEmoji={handleEmojiSelect} />
    </div>
  );
};

NewsCommentDock.displayName = 'NewsCommentDock';
