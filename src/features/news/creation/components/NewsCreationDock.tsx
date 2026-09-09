import React from 'react';
import { Save, Eye, X, LogOut } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Tooltip } from '../../../../components/ui/Tooltip';

export interface NewsCreationDockProps {
  /** Bascule l'infobulle du bouton "Enregistrer" : "Enregistrer" (création) -> "Modifier" (édition). */
  isEditMode: boolean;
  isSubmitting: boolean;
  /** Action actuellement en vol -- pilote le spinner du SEUL bouton cliqué. */
  submittingAction: 'stay' | 'quit' | null;
  onSaveAndStay: () => void;
  onSaveAndQuit: () => void;
  onPreview: () => void;
  onCancel: () => void;
}

/**
 * Dock d'actions fixé en bas de l'assistant de création/édition de News
 * (voir CreerNewsPage.tsx) -- remplace le dock de navigation mobile sur
 * cette page (voir App.tsx : MobileDock masqué sur /news/creer,
 * /sujets/creer et /news/modifier/:id), et reste TOUJOURS visible quelle
 * que soit la taille d'écran, desktop/PC compris (contrairement à
 * MobileDock, mobile only) : un formulaire aussi long a besoin de ses
 * actions de sauvegarde toujours accessibles, sans avoir à remonter en
 * haut de page.
 *
 * Boutons en ICÔNES SEULES (pas de libellé texte) -- avec Tooltip au
 * survol/focus pour l'accessibilité -- afin que les quatre actions
 * tiennent sans jamais faire déborder la barre en scroll horizontal :
 * - "Annuler" (ghost, teinté danger) : quitte SANS rien enregistrer.
 * - "Visualiser" (ghost) : aperçu local instantané (voir
 *   NewsPreviewModal.tsx) -- n'enregistre RIEN, ce n'est pas son travail.
 * - "Enregistrer"/"Modifier" (secondary) : enregistre et reste sur la
 *   page -- en création, vide le formulaire pour en accueillir une
 *   nouvelle ; en édition, le contenu reste affiché tel quel.
 * - "Enregistrer et quitter" (primary, icônes Save + LogOut réunies
 *   dans le même bouton) : enregistre puis quitte l'assistant (liste
 *   News en création, fiche backoffice en édition).
 *
 * Chaque bouton ne fait STRICTEMENT que ce qui le concerne : jamais
 * d'enregistrement caché derrière "Annuler" ou "Visualiser".
 *
 * `overflow-x-auto` + `shrink-0` sur chaque bouton : filet de sécurité
 * sur les très petits écrans (les icônes, bien plus compactes que les
 * anciens libellés français, ne devraient plus jamais y recourir).
 */
export const NewsCreationDock: React.FC<NewsCreationDockProps> = ({
  isEditMode,
  isSubmitting,
  submittingAction,
  onSaveAndStay,
  onSaveAndQuit,
  onPreview,
  onCancel,
}) => {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#1A1F4D]/95 backdrop-blur-md shadow-[0_-6px_24px_rgba(15,18,44,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar">
        <Tooltip content="Annuler" position="top">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<X className="w-4 h-4" />}
            disabled={isSubmitting}
            onClick={onCancel}
            className="shrink-0 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            aria-label="Annuler et quitter sans enregistrer"
          />
        </Tooltip>

        <div className="flex-1 min-w-2" />

        <Tooltip content="Visualiser" position="top">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            disabled={isSubmitting}
            onClick={onPreview}
            className="shrink-0"
            aria-label="Visualiser un aperçu"
          />
        </Tooltip>

        <Tooltip content={isEditMode ? 'Modifier' : 'Enregistrer'} position="top">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Save className="w-4 h-4" />}
            isLoading={submittingAction === 'stay'}
            disabled={isSubmitting}
            onClick={onSaveAndStay}
            className="shrink-0"
            aria-label={isEditMode ? 'Modifier' : 'Enregistrer'}
          />
        </Tooltip>

        <Tooltip content="Enregistrer et quitter" position="top">
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={(
              <span className="flex items-center gap-0.5">
                <Save className="w-4 h-4" />
                <LogOut className="w-3.5 h-3.5" />
              </span>
            )}
            isLoading={submittingAction === 'quit'}
            disabled={isSubmitting}
            onClick={onSaveAndQuit}
            className="shrink-0"
            aria-label="Enregistrer et quitter"
          />
        </Tooltip>
      </div>
    </div>
  );
};

NewsCreationDock.displayName = 'NewsCreationDock';
