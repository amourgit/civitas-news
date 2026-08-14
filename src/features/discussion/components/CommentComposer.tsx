import React, { useState, useRef, useEffect } from 'react';
import { WhatsAppEmojiModal } from '../../../components/ui/WhatsAppEmojiModal';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smile,
  Send,
  Mic,
  X,
  Trash2,
  Play,
  Pause,
} from 'lucide-react';

export interface CommentComposerProps {
  onSubmit: (text: string) => void | Promise<void>;
  replyToName?: string;
  onCancelReply?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  compact?: boolean;
}

export const CommentComposer: React.FC<CommentComposerProps> = ({
  onSubmit,
  replyToName,
  onCancelReply,
  autoFocus = false,
  placeholder = "Écrire un commentaire...",
  compact = false,
}) => {
  const [text, setText] = useState('');
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  // Vrai le temps de la requête réelle vers le backend (voir
  // handleSubmit) -- empêche un double-envoi et donne un retour visuel
  // pendant que le commentaire part réellement en arrière-plan.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformBars, setWaveformBars] = useState<number[]>([
    35, 65, 40, 85, 50, 95, 40, 75, 60, 90, 45, 70, 35, 80, 55, 95, 65, 45, 30, 60
  ]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Clean up audio & timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
    };
  }, []);

  // Format duration MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Start audio recording mode
  const startRecording = async () => {
    setIsRecording(true);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioUrl(null);
    audioChunksRef.current = [];

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
      }
    } catch {
      // Microphone fallback if denied or unavailable in sandbox
    }

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    waveIntervalRef.current = setInterval(() => {
      setWaveformBars(
        Array.from({ length: 20 }, () => Math.floor(Math.random() * 75) + 25)
      );
    }, 100);
  };

  // Pause or resume recording
  const togglePauseRecording = () => {
    if (!isRecording) return;

    if (isPaused) {
      setIsPaused(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      waveIntervalRef.current = setInterval(() => {
        setWaveformBars(
          Array.from({ length: 20 }, () => Math.floor(Math.random() * 75) + 25)
        );
      }, 100);
    } else {
      setIsPaused(true);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    }
  };

  // Cancel recording and reset
  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
    setIsPlaying(false);
    setRecordingTime(0);
    setAudioUrl(null);
  };

  // Send audio recording
  const sendAudioRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    const durationStr = formatDuration(recordingTime);
    onSubmit(`🎙️ Message vocal (${durationStr})`);

    cancelRecording();
  };

  // Playback recorded audio
  const togglePlayAudio = () => {
    if (!audioUrl) return;

    if (isPlaying) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  // Auto-resize text area
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
    }
  };

  const handleEmojiSelect = (emojiSymbol: string) => {
    setText((prev) => prev + emojiSymbol);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Requête réelle vers le backend (voir useComments.ts) -- on
      // n'efface le champ QU'APRÈS confirmation du succès, pour ne
      // jamais faire croire à un envoi qui a en réalité échoué.
      await onSubmit(trimmed);
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch {
      // Le toast d'erreur est déjà affiché par l'appelant (voir
      // useComments.ts:toastEchec) -- on garde volontairement le texte
      // saisi pour que l'utilisateur ne perde pas son message et puisse
      // simplement réessayer.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full relative font-sans">
      {/* WhatsApp Replying Banner Header */}
      <AnimatePresence>
        {replyToName && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 5 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: 5 }}
            className="mb-1 bg-[#F0F2F5] dark:bg-[#202C33] rounded-xl px-2.5 py-1.5 border-l-4 border-[#00A884] shadow-sm flex items-center justify-between gap-2 text-[11px]"
          >
            <div className="min-w-0 flex-1">
              <span className="font-bold text-[#00A884] block truncate">
                Réponse à @{replyToName}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                {placeholder}
              </span>
            </div>
            {onCancelReply && (
              <button
                type="button"
                onClick={onCancelReply}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                title="Annuler"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Bar: WhatsApp Style Input / Audio Recorder */}
      {isRecording ? (
        /* AUDIO RECORDING MODE BAR */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="flex items-center gap-2 bg-white dark:bg-[#202C33] rounded-2xl border border-gray-200/80 dark:border-gray-700/80 px-2.5 py-1.5 shadow-sm min-h-[38px]"
        >
          {/* Delete Button */}
          <button
            type="button"
            onClick={cancelRecording}
            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition-colors shrink-0"
            title="Supprimer la note vocale"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Pause / Resume or Play Recording */}
          <button
            type="button"
            onClick={audioUrl ? togglePlayAudio : togglePauseRecording}
            className="p-1.5 text-[#00A884] hover:bg-[#00A884]/10 rounded-full transition-colors shrink-0"
            title={audioUrl ? (isPlaying ? 'Pause' : 'Écouter') : isPaused ? 'Reprendre' : 'Mettre en pause'}
          >
            {audioUrl ? (
              isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />
            ) : isPaused ? (
              <Play className="w-4 h-4 ml-0.5" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>

          {/* Recording Timer & Red Pulsating Dot */}
          <div className="flex items-center gap-1.5 shrink-0 min-w-[50px]">
            <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`} />
            <span className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200">
              {formatDuration(recordingTime)}
            </span>
          </div>

          {/* Animated Waveform Sound Bars */}
          <div className="flex-1 flex items-center justify-center gap-0.5 h-6 overflow-hidden px-1">
            {waveformBars.map((height, idx) => (
              <motion.div
                key={idx}
                animate={{ height: isPaused ? '25%' : `${height}%` }}
                transition={{ duration: 0.1 }}
                className={`w-1 rounded-full ${
                  isPaused
                    ? 'bg-gray-300 dark:bg-gray-600'
                    : 'bg-[#00A884]'
                }`}
              />
            ))}
          </div>

          {/* Send Recorded Audio Button */}
          <button
            type="button"
            onClick={sendAudioRecording}
            className="w-8 h-8 rounded-full bg-[#00A884] hover:bg-[#008f6f] text-white flex items-center justify-center shrink-0 shadow-sm transition-all active:scale-95"
            title="Envoyer la note vocale"
          >
            <Send className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </motion.div>
      ) : (
        /* STANDARD TEXT INPUT BAR */
        <form onSubmit={handleSubmit} className="flex items-end gap-1.5">
          {/* Main WhatsApp Compact Input Pill */}
          <div className="flex-1 bg-white dark:bg-[#202C33] rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex items-end px-2.5 py-1 min-h-[38px] transition-all focus-within:ring-1 focus-within:ring-[#00A884]/50">
            {/* Smile Emoji Toggle Button */}
            <button
              type="button"
              onClick={() => setShowEmojiModal(true)}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-full transition-colors shrink-0 mb-0.5"
              title="Sélecteur d'emojis WhatsApp"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Text Input Area */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={placeholder}
              rows={1}
              className="flex-1 bg-transparent border-none text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none px-2 py-1 max-h-[80px] leading-relaxed custom-scrollbar"
            />
          </div>

          {/* WhatsApp Circular Green Action Button (Send or Mic) */}
          {text.trim() ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-9 h-9 rounded-full bg-[#00A884] hover:bg-[#008f6f] text-white flex items-center justify-center shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              title="Envoyer le message"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="w-9 h-9 rounded-full bg-[#00A884] hover:bg-[#008f6f] text-white flex items-center justify-center shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Enregistrer un message vocal"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </form>
      )}

      {/* WhatsApp Emoji Modal */}
      <WhatsAppEmojiModal
        isOpen={showEmojiModal}
        onClose={() => setShowEmojiModal(false)}
        onSelectEmoji={handleEmojiSelect}
      />
    </div>
  );
};

