// ============================================================
// src/components/ui/MultiSelectChips.tsx
// Sélecteur multiple générique par puces (chips) : un bandeau de
// puces "sélectionnées" (défilement horizontal, bouton de retrait)
// au-dessus d'un pool de puces "disponibles" (cliquer pour ajouter),
// avec animation de layout partagé (Motion `layoutId`) faisant
// "voler" la puce d'un conteneur à l'autre.
//
// Design et animations repris à l'identique du composant `TagsSelector`
// fourni (mêmes rayons/ombres/espacements/transitions Motion) — seules
// différences volontaires, purement pour la RÉUTILISATION du composant :
//   - générique (`MultiSelectOption` au lieu d'un type "Tag" figé) et
//     entièrement CONTRÔLÉ (`selectedIds`/`onChange` au lieu d'un état
//     interne), pour pouvoir être piloté par un parent (état levé,
//     synchro URL, bouton "réinitialiser les filtres"...) ;
//   - `label` optionnel (au lieu du "TAGS" en dur) et pas de padding/
//     largeur de page imposés, pour s'intégrer dans n'importe quel
//     conteneur appelant (ex: un panneau de filtres compact où le
//     libellé du champ est déjà affiché par l'appelant) ;
//   - `isAvailable` par option (au lieu d'un `Set` d'ids séparé) pour
//     rester purement générique : un appelant peut estomper une option
//     (ex: aucun résultat actuel pour cette valeur) sans l'empêcher
//     d'être sélectionnée ;
//   - `layoutId` préfixé par une identité d'instance (`useId`), pour
//     que plusieurs `MultiSelectChips` puissent cohabiter sur la même
//     page (ex: un par champ de filtre) sans que leurs animations ne
//     se percutent en cas d'ids identiques entre deux champs ;
//   - variantes `dark:` ajoutées à côté de chaque classe claire déjà
//     présente (jamais en remplacement), pour rester lisible sur les
//     fonds sombres de l'app -- l'apparence en thème clair reste
//     pixel identique au design fourni.
// ============================================================

import * as React from 'react';
import { useEffect, useRef, useId } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

export interface MultiSelectOption {
  id: string;
  label: string;
  /**
   * `false` => option affichée en opacité réduite dans le pool
   * "disponible" (reste cliquable/sélectionnable). Omis ou `true` =>
   * pleinement visible. N'affecte jamais une option déjà sélectionnée.
   */
  isAvailable?: boolean;
}

export interface MultiSelectChipsProps {
  /** Libellé optionnel affiché au-dessus (fidèle au `motion.h2` "TAGS" d'origine). À omettre si l'appelant affiche déjà son propre libellé de champ. */
  label?: string;
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** `true` = reproduit le comportement d'origine (bandeau "sélectionnés" toujours affiché, même vide). Par défaut, masqué tant qu'aucune option n'est sélectionnée -- utile quand plusieurs instances sont empilées (panneau de filtres). */
  alwaysShowSelectedTray?: boolean;
  /** Texte affiché quand `options` est vide (ex: référentiel encore en chargement). */
  emptyLabel?: string;
  className?: string;
}

export function MultiSelectChips({
  label,
  options,
  selectedIds,
  onChange,
  alwaysShowSelectedTray = false,
  emptyLabel,
  className = '',
}: MultiSelectChipsProps) {
  const instanceId = useId();
  const selectedsContainerRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((opt) => selectedIds.includes(opt.id));
  const availableOptions = options.filter((opt) => !selectedIds.includes(opt.id));

  const removeSelectedTag = (id: string) => {
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  const addSelectedTag = (id: string) => {
    onChange([...selectedIds, id]);
  };

  useEffect(() => {
    if (selectedsContainerRef.current) {
      selectedsContainerRef.current.scrollTo({
        left: selectedsContainerRef.current.scrollWidth,
        behavior: 'smooth',
      });
    }
  }, [selectedIds]);

  return (
    <div className={`w-full flex flex-col ${className}`}>
      {label && (
        <motion.h2 layout className="text-xl font-semibold text-gray-900 dark:text-white">
          {label}
        </motion.h2>
      )}

      {(alwaysShowSelectedTray || selectedOptions.length > 0) && (
        <motion.div
          className="w-full flex items-center justify-start gap-1 sm:gap-1.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/15 h-10 sm:h-12 md:h-14 mt-1.5 sm:mt-2 mb-2 sm:mb-3 overflow-x-auto p-1 sm:p-1.5 rounded-xl sm:rounded-2xl no-scrollbar"
          ref={selectedsContainerRef}
          layout
        >
          {selectedOptions.map((opt) => (
            <motion.div
              key={opt.id}
              className="flex items-center gap-0.5 sm:gap-1 pl-2 sm:pl-2.5 md:pl-3 pr-0.5 sm:pr-1 py-0.5 sm:py-1 bg-white dark:bg-[#1A1F4D] shadow-md border border-gray-200 dark:border-white/15 h-full shrink-0 rounded-[10px] sm:rounded-xl md:rounded-[14px]"
              layoutId={`${instanceId}-${opt.id}`}
            >
              <motion.span
                layoutId={`${instanceId}-${opt.id}-label`}
                className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-white/90 font-medium whitespace-nowrap"
              >
                {opt.label}
              </motion.span>
              <button
                onClick={() => removeSelectedTag(opt.id)}
                aria-label={`Retirer ${opt.label}`}
                className="p-0.5 sm:p-1 rounded-full"
              >
                <X className="size-3.5 sm:size-4 md:size-5 text-gray-500 dark:text-white/60" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {availableOptions.length > 0 ? (
        <motion.div
          className="bg-white dark:bg-white/5 shadow-sm p-1.5 sm:p-2 border border-gray-200 dark:border-white/15 w-full rounded-xl sm:rounded-2xl"
          layout
        >
          <motion.div className="flex flex-wrap gap-1.5 sm:gap-2">
            {availableOptions.map((opt) => {
              const dimmed = opt.isAvailable === false;
              return (
                <motion.button
                  key={opt.id}
                  layoutId={`${instanceId}-${opt.id}`}
                  onClick={() => addSelectedTag(opt.id)}
                  title={dimmed ? 'Aucun résultat ne correspond actuellement à cette option' : undefined}
                  className={`flex items-center gap-0.5 sm:gap-1 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 bg-gray-100/60 dark:bg-white/10 shrink-0 transition-opacity rounded-[10px] sm:rounded-xl md:rounded-[14px] ${
                    dimmed ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  <motion.span
                    layoutId={`${instanceId}-${opt.id}-label`}
                    className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-white/80 font-medium whitespace-nowrap"
                  >
                    {opt.label}
                  </motion.span>
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>
      ) : (
        emptyLabel &&
        selectedOptions.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-white/40 italic">{emptyLabel}</p>
        )
      )}
    </div>
  );
}
