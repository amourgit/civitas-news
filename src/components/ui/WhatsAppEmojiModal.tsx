import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Clock, Smile, ThumbsUp, Heart, Lightbulb, Flag, Check } from 'lucide-react';

export interface EmojiData {
  symbol: string;
  name: string;
  keywords: string[];
}

export interface EmojiCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  emojis: EmojiData[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'courants',
    title: 'Récents & Courants',
    icon: <Clock className="w-4 h-4" />,
    emojis: [
      { symbol: '👍', name: "J'aime", keywords: ['like', 'pouce', 'daccord', 'oui', 'bravo'] },
      { symbol: '❤️', name: 'Cœur', keywords: ['coeur', 'amour', 'love', 'jaime'] },
      { symbol: '👏', name: 'Bravo', keywords: ['applaudissements', 'bravo', 'félicitations'] },
      { symbol: '🎉', name: 'Fête', keywords: ['youpi', 'fête', 'joie', 'celebration'] },
      { symbol: '😮', name: 'Wow', keywords: ['surpris', 'etonne', 'wow', 'choc'] },
      { symbol: '🔥', name: 'Feu', keywords: ['tendance', 'hot', 'incroyable', 'top'] },
      { symbol: '💡', name: 'Idée', keywords: ['idee', 'lumiere', 'inspiration', 'solution'] },
      { symbol: '🇬🇦', name: 'Gabon', keywords: ['gabon', 'drapeau', 'patrie', 'libreville'] },
    ],
  },
  {
    id: 'emoticones',
    title: 'Émoticones & Visages',
    icon: <Smile className="w-4 h-4" />,
    emojis: [
      { symbol: '😀', name: 'Sourire', keywords: ['sourire', 'heureux'] },
      { symbol: '😃', name: 'Grand sourire', keywords: ['joie', 'sourire'] },
      { symbol: '😄', name: 'Rire aux yeux rieurs', keywords: ['rire', 'joie'] },
      { symbol: '😁', name: 'Éclat de rire', keywords: ['dents', 'rire'] },
      { symbol: '😆', name: 'Rire aux yeux fermés', keywords: ['mdr', 'lol'] },
      { symbol: '😅', name: 'Sourire avec sueur', keywords: ['soulagement', 'ouf'] },
      { symbol: '😂', name: 'Pleurs de joie', keywords: ['mdr', 'lol', 'rire'] },
      { symbol: '🤣', name: 'Rire aux larmes', keywords: ['pdr', 'mort de rire'] },
      { symbol: '😊', name: 'Sourire timide', keywords: ['doux', 'content'] },
      { symbol: '😇', name: 'Ange', keywords: ['innocent', 'ange'] },
      { symbol: '🙂', name: 'Sourire léger', keywords: ['bien', 'ok'] },
      { symbol: '🙃', name: 'Visage à l\'envers', keywords: ['ironie', 'blague'] },
      { symbol: '😉', name: 'Clin d\'œil', keywords: ['clin d\'oeil', 'complicite'] },
      { symbol: '😍', name: 'Yeux cœurs', keywords: ['amour', 'magnifique'] },
      { symbol: '🥰', name: 'Visage amoureux', keywords: ['tendresse', 'amour'] },
      { symbol: '😘', name: 'Bisou', keywords: ['bisou', 'bisous'] },
      { symbol: '😋', name: 'Gourmand', keywords: ['miam', 'delicieux'] },
      { symbol: '😎', name: 'Lunettes de soleil', keywords: ['cool', 'classe'] },
      { symbol: '🥳', name: 'Fête', keywords: ['anniversaire', 'fete'] },
      { symbol: '🤔', name: 'Pensif', keywords: ['reflexion', 'question'] },
      { symbol: '🧐', name: 'Monocle', keywords: ['inspecter', 'curieux'] },
      { symbol: '🤓', name: 'Nerd', keywords: ['expert', 'etude'] },
      { symbol: '🤩', name: 'Étoiles dans les yeux', keywords: ['impressionne', 'super'] },
      { symbol: '🤯', name: 'Tête explose', keywords: ['choc', 'incroyable'] },
      { symbol: '😳', name: 'Gêné', keywords: ['rougir', 'choc'] },
      { symbol: '🥺', name: 'Yeux suppliants', keywords: ['pardon', 'stp'] },
      { symbol: '😭', name: 'Pleurs', keywords: ['triste', 'chagrin'] },
      { symbol: '😱', name: 'Cri de peur', keywords: ['peur', 'effraye'] },
    ],
  },
  {
    id: 'mains',
    title: 'Gestes & Mains',
    icon: <ThumbsUp className="w-4 h-4" />,
    emojis: [
      { symbol: '👍', name: 'Pouce levé', keywords: ['pouce', 'daccord', 'oui', 'like'] },
      { symbol: '👎', name: 'Pouce baissé', keywords: ['desaccord', 'non', 'dislike'] },
      { symbol: '👊', name: 'Coup de poing', keywords: ['force', 'solidarite'] },
      { symbol: '✊', name: 'Poing levé', keywords: ['lutte', 'liberte', 'force'] },
      { symbol: '🤛', name: 'Poing gauche', keywords: ['check', 'salut'] },
      { symbol: '🤜', name: 'Poing droit', keywords: ['check', 'salut'] },
      { symbol: '👏', name: 'Applaudissements', keywords: ['bravo', 'felicitations'] },
      { symbol: '🙌', name: 'Mains levées', keywords: ['victoire', 'succes'] },
      { symbol: '👐', name: 'Mains ouvertes', keywords: ['accueil', 'partage'] },
      { symbol: '🤲', name: 'Paumes jointes', keywords: ['priere', 'demande'] },
      { symbol: '🤝', name: 'Poignée de main', keywords: ['accord', 'partenariat'] },
      { symbol: '🙏', name: 'Mains en prière', keywords: ['merci', 'priere', 'respect'] },
      { symbol: '✍️', name: 'Main qui écrit', keywords: ['ecriture', 'note'] },
      { symbol: '💪', name: 'Biceps contracté', keywords: ['force', 'courage', 'energie'] },
      { symbol: '👈', name: 'Doigt à gauche', keywords: ['gauche', 'voir'] },
      { symbol: '👉', name: 'Doigt à droite', keywords: ['droite', 'voir'] },
      { symbol: '👆', name: 'Doigt en haut', keywords: ['haut', 'attention'] },
      { symbol: '👇', name: 'Doigt en bas', keywords: ['bas', 'ci-dessous'] },
      { symbol: '✌️', name: 'Signe V', keywords: ['victoire', 'paix'] },
      { symbol: '🤞', name: 'Doigts croisés', keywords: ['chance', 'espoir'] },
    ],
  },
  {
    id: 'coeurs',
    title: 'Cœurs & Émotions',
    icon: <Heart className="w-4 h-4" />,
    emojis: [
      { symbol: '❤️', name: 'Cœur rouge', keywords: ['amour', 'coeur', 'rouge'] },
      { symbol: '🧡', name: 'Cœur orange', keywords: ['amitie', 'coeur'] },
      { symbol: '💛', name: 'Cœur jaune', keywords: ['soleil', 'joie', 'coeur'] },
      { symbol: '💚', name: 'Cœur vert', keywords: ['nature', 'espoir', 'coeur'] },
      { symbol: '💙', name: 'Cœur bleu', keywords: ['confiance', 'paix', 'coeur'] },
      { symbol: '💜', name: 'Cœur violet', keywords: ['civitas', 'noble', 'coeur'] },
      { symbol: '🖤', name: 'Cœur noir', keywords: ['sombre', 'coeur'] },
      { symbol: '🤍', name: 'Cœur blanc', keywords: ['purete', 'paix', 'coeur'] },
      { symbol: '🤎', name: 'Cœur marron', keywords: ['terre', 'coeur'] },
      { symbol: '💔', name: 'Cœur brisé', keywords: ['tristesse', 'rupture'] },
      { symbol: '❣️', name: 'Cœur point d\'exclamation', keywords: ['attraction', 'coeur'] },
      { symbol: '💕', name: 'Deux cœurs', keywords: ['amour', 'affection'] },
      { symbol: '💞', name: 'Cœurs tournants', keywords: ['emotions', 'amour'] },
      { symbol: '💓', name: 'Cœur battant', keywords: ['vie', 'passion'] },
      { symbol: '💗', name: 'Cœur grandissant', keywords: ['joie', 'amour'] },
      { symbol: '💖', name: 'Cœur étincelant', keywords: ['magie', 'amour'] },
      { symbol: '💘', name: 'Cœur transpercé', keywords: ['cupidon', 'coup de foudre'] },
    ],
  },
  {
    id: 'objets',
    title: 'Objets & Symboles',
    icon: <Lightbulb className="w-4 h-4" />,
    emojis: [
      { symbol: '💡', name: 'Ampoule', keywords: ['idee', 'innovation', 'lumiere'] },
      { symbol: '🔥', name: 'Feu', keywords: ['chaut', 'energie', 'tendance'] },
      { symbol: '✨', name: 'Étincelles', keywords: ['nouveau', 'magie', 'propre'] },
      { symbol: '⭐', name: 'Étoile', keywords: ['favori', 'top', 'brillant'] },
      { symbol: '🌟', name: 'Étoile brillante', keywords: ['excellence', 'star'] },
      { symbol: '🎯', name: 'Cible', keywords: ['objectif', 'precision'] },
      { symbol: '🏆', name: 'Trophée', keywords: ['gagnant', 'prix', 'victoire'] },
      { symbol: '🥇', name: 'Médaille d\'or', keywords: ['premier', 'champion'] },
      { symbol: '📢', name: 'Haut-parleur', keywords: ['annonce', 'news', 'information'] },
      { symbol: '💬', name: 'Bulle de discussion', keywords: ['message', 'debat', 'avis'] },
      { symbol: '📌', name: 'Punaise', keywords: ['epingler', 'important'] },
      { symbol: '✅', name: 'Coche verte', keywords: ['valide', 'reussi', 'ok'] },
      { symbol: '🚀', name: 'Fusée', keywords: ['lancement', 'rapidite', 'succes'] },
      { symbol: '📈', name: 'Courbe croissante', keywords: ['progression', 'hausse'] },
    ],
  },
  {
    id: 'gabon',
    title: 'Gabon & Citoyenneté',
    icon: <Flag className="w-4 h-4" />,
    emojis: [
      { symbol: '🇬🇦', name: 'Drapeau Gabonais', keywords: ['gabon', 'patrie', 'nation'] },
      { symbol: '🏛️', name: 'Bâtiment public', keywords: ['institution', 'etat', 'gouvernement'] },
      { symbol: '🗳️', name: 'Urne de vote', keywords: ['vote', 'democratie', 'election'] },
      { symbol: '📜', name: 'Parchemin', keywords: ['loi', 'texte', 'projet'] },
      { symbol: '⚖️', name: 'Balance de la justice', keywords: ['droit', 'equite', 'justice'] },
      { symbol: '🌴', name: 'Palmier', keywords: ['foret', 'nature', 'faune'] },
      { symbol: '🌊', name: 'Vague / Océan', keywords: ['mer', 'port-gentil', 'libreville'] },
      { symbol: '☀️', name: 'Soleil', keywords: ['avenir', 'lumiere', 'espoir'] },
      { symbol: '🤝', name: 'Union Citoyenne', keywords: ['dialogue', 'union', 'fraternite'] },
      { symbol: '🎓', name: 'Éducation', keywords: ['ecole', 'formation', 'jeunesse'] },
      { symbol: '🏥', name: 'Santé', keywords: ['hopital', 'soins', 'sante'] },
      { symbol: '🛡️', name: 'Protection', keywords: ['securite', 'souverainete'] },
    ],
  },
];

export interface WhatsAppEmojiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emojiSymbol: string) => void;
  selectedEmoji?: string | null;
}

export const WhatsAppEmojiModal: React.FC<WhatsAppEmojiModalProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
  selectedEmoji,
}) => {
  const [activeTab, setActiveTab] = useState<string>('courants');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Search filter across all categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return EMOJI_CATEGORIES;

    const query = searchQuery.toLowerCase();
    return EMOJI_CATEGORIES.map((cat) => ({
      ...cat,
      emojis: cat.emojis.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.symbol.includes(query) ||
          e.keywords.some((kw) => kw.toLowerCase().includes(query))
      ),
    })).filter((cat) => cat.emojis.length > 0);
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        {/* Modal Window Container (WhatsApp styling: rounded, clean tabs, dark mode) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-[#1A1F4D] border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-3 sm:p-4 bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">😀</span>
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white font-display">
                  Réagir au commentaire
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  Choisissez une émoticône WhatsApp
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un emoji (ex: cœur, bravo, gabo...)"
                className="w-full pl-8 pr-8 py-1.5 bg-gray-100 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/50 border border-transparent dark:border-gray-700/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Categorized Tabs Bar (WhatsApp Icon Navigation) */}
          {!searchQuery && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50/50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800/60 shrink-0 overflow-x-auto no-scrollbar">
              {EMOJI_CATEGORIES.map((cat) => {
                const isActive = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveTab(cat.id);
                      const el = document.getElementById(`emoji-cat-${cat.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`flex items-center justify-center p-2 rounded-xl transition-all relative ${
                      isActive
                        ? 'text-[#5B4DFF] dark:text-sky-400 bg-purple-50 dark:bg-purple-950/60 font-bold'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                    }`}
                    title={cat.title}
                  >
                    {cat.icon}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#5B4DFF] dark:bg-sky-400 rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Vertical Scrollable Emojis Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[320px] sm:max-h-[360px] custom-scrollbar">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400 font-medium">
                Aucun emoji trouvé pour &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <div key={cat.id} id={`emoji-cat-${cat.id}`} className="space-y-2">
                  <div className="sticky top-0 bg-white/95 dark:bg-[#1A1F4D]/95 backdrop-blur-sm py-1 z-10 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between border-b border-gray-100 dark:border-gray-800/40">
                    <span>{cat.title}</span>
                    <span className="text-[10px] text-gray-400 font-normal">{cat.emojis.length}</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
                    {cat.emojis.map((emoji) => {
                      const isSelected = selectedEmoji === emoji.symbol;
                      return (
                        <button
                          key={`${cat.id}-${emoji.symbol}-${emoji.name}`}
                          onClick={() => {
                            onSelectEmoji(emoji.symbol);
                            onClose();
                          }}
                          className={`relative flex flex-col items-center justify-center p-2 rounded-xl text-xl sm:text-2xl transition-all hover:scale-125 hover:bg-purple-50 dark:hover:bg-purple-950/50 active:scale-95 group ${
                            isSelected
                              ? 'bg-purple-100 dark:bg-purple-900/60 ring-2 ring-[#5B4DFF] dark:ring-sky-400'
                              : 'bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100/60 dark:border-gray-800/60'
                          }`}
                          title={emoji.name}
                        >
                          <span>{emoji.symbol}</span>
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 bg-[#5B4DFF] text-white p-0.5 rounded-full text-[8px]">
                              <Check className="w-2 h-2" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-2.5 bg-gray-50 dark:bg-gray-900/80 border-t border-gray-100 dark:border-gray-800 text-center text-[10px] text-gray-400 font-semibold shrink-0">
            Cliquez sur un emoji pour réagir instantanément
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
