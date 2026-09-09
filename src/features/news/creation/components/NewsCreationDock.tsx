import React from 'react';
import { Check, Save, Eye } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

export interface NewsCreationDockProps {
  /** Bascule le libellé du bouton du milieu : "Enregistrer" (création) -> "Modifier" (édition). */
  isEditMode: boolean;
  isSubmitting: boolean;
  /** Action actuellement en vol -- pilote le spinner du SEUL bouton cliqué. */
  submittingAction: 'stay' | 'quit' | 'preview' | null;
  onSaveAndStay: () => void;
  onSaveAndQuit: () => void;
  onPreview: () => void;
}

/**
 * Dock d'actions fixé en bas de l'assistant de création/édition de News
 * (voir CreerNewsPage.tsx) -- remplace le dock de navigation mobile sur
 * cette page (voir App.tsx : MobileDock masqué sur /news/creer,
 * /sujets/creer et /news/modifier/:id), et reste visible quelle que
 * soit la taille d'écran (contrairement à MobileDock, mobile only) :
 * un formulaire aussi long a besoin de ses actions de sauvegarde
 * TOUJOURS accessibles, sans avoir à remonter en haut de page.
 *
 * Trois actions, hiérarchie visuelle croissante de gauche à droite :
 * - "Visualiser" (ghost) : enregistre puis ouvre l'aperçu (BottomSheet)
 *   SANS quitter l'assistant -- reste en arrière-plan sur cette page.
 * - "Enregistrer"/"Modifier" (secondary) : enregistre et reste sur la
 *   page pour continuer à éditer.
 * - "Enregistrer et quitter" (primary) : enregistre puis quitte
 *   l'assistant (liste News en création, fiche backoffice en édition).
 *
 * `overflow-x-auto` + `shrink-0` sur chaque bouton : filet de sécurité
 * sur les très petits écrans (les trois libellés français restent sur
 * une seule ligne, défilable au pire, plutôt que de casser en 2 lignes).
 */
export const NewsCreationDock: React.FC<NewsCreationDockProps> = ({
  isEditMode,
  isSubmitting,
  submittingAction,
  onSaveAndStay,
  onSaveAndQuit,
  onPreview,
}) => {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#1A1F4D]/95 backdrop-blur-md shadow-[0_-6px_24px_rgba(15,18,44,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<Eye className="w-3.5 h-3.5" />}
          isLoading={submittingAction === 'preview'}
          disabled={isSubmitting}
          onClick={onPreview}
          className="shrink-0"
        >
          Visualiser
        </Button>

        <div className="flex-1 min-w-2" />

        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<Save className="w-3.5 h-3.5" />}
          isLoading={submittingAction === 'stay'}
          disabled={isSubmitting}
          onClick={onSaveAndStay}
          className="shrink-0"
        >
          {isEditMode ? 'Modifier' : 'Enregistrer'}
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          icon={<Check className="w-3.5 h-3.5" />}
          isLoading={submittingAction === 'quit'}
          disabled={isSubmitting}
          onClick={onSaveAndQuit}
          className="shrink-0"
        >
          Enregistrer et quitter
        </Button>
      </div>
    </div>
  );
};

NewsCreationDock.displayName = 'NewsCreationDock';
