// ============================================================
// src/pages/CreerNewsPage.tsx
// Assistant de création/édition de News -- refonte complète : plus de
// wizard à étapes, une seule page où les sections s'enchaînent
// librement vers le bas (titre, métadonnées, contenu, couverture,
// médias), sans carte/bordure/fond propre à chacune -- seul le fond
// de page (voir DefaultBackground) reste visible. Le niveau 1 de la
// topbar porte la bascule Standard/Avancé (voir ModeToggle), le
// niveau 2 le "bref" de diffusion façon Facebook (voir
// CreationTopbarBrief). Toute la logique de données vit dans
// useNewsCreationForm -- cette page se contente de l'assembler.
// ============================================================

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSetTopbarContent } from '../context/TopbarSlotsContext';
import { useNewsCreationForm } from '../features/news/creation/useNewsCreationForm';
import type { CreationMode } from '../features/news/creation/types';
import { ModeToggle } from '../features/news/creation/components/ModeToggle';
import { CreationTopbarBrief } from '../features/news/creation/components/CreationTopbarBrief';
import { AdvancedModePlaceholder } from '../features/news/creation/components/AdvancedModePlaceholder';
import { TitleField } from '../features/news/creation/components/TitleField';
import { MetaFieldsRow } from '../features/news/creation/components/MetaFieldsRow';
import { ContentEditorField } from '../features/news/creation/components/ContentEditorField';
import { ShortDescriptionField } from '../features/news/creation/components/ShortDescriptionField';
import { CoverImageField } from '../features/news/creation/components/CoverImageField';
import { MediaGallerySection } from '../features/news/creation/components/MediaGallerySection';
import { NewsCreationDock } from '../features/news/creation/components/NewsCreationDock';
import { NewsPreviewModal } from '../features/news/creation/components/NewsPreviewModal';
import { buildPreviewNews } from '../features/news/creation/buildPreviewNews';

export default function CreerNewsPage() {
  const [mode, setMode] = useState<CreationMode>('standard');
  const form = useNewsCreationForm();
  const selectedOrganisation = form.organisations.find((o) => o.id === form.organisationId);
  // "Visualiser" (voir NewsCreationDock) : simple ouverture locale, sans
  // aucun enregistrement -- voir NewsPreviewModal.tsx / buildPreviewNews.ts.
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Niveau 1 (droite de la topbar) : bascule de mode -- toujours
  // affichée, y compris pendant le chargement, pour ne jamais faire
  // "sauter" la mise en page de la topbar.
  useSetTopbarContent('upper', <ModeToggle mode={mode} onChange={setMode} />, [mode]);

  // Niveau 2 : qui publie, pour quelle organisation, avec quelle
  // visibilité -- reflète l'état du formulaire en direct.
  useSetTopbarContent(
    'lower',
    (
      <CreationTopbarBrief
        user={form.user}
        organisation={selectedOrganisation}
        visibilite={form.visibilite}
        onVisibiliteChange={form.setVisibilite}
        disabled={form.isReadOnly}
      />
    ),
    [form.user, selectedOrganisation, form.visibilite, form.isReadOnly],
  );

  if (form.isEditMode && form.isLoadingRecord) {
    return (
      <div className="max-w-3xl mx-auto py-24 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#5B4DFF]" />
      </div>
    );
  }

  if (form.isEditMode && form.loadRecordError) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <p className="text-sm text-red-600 dark:text-red-400">{form.loadRecordError}</p>
      </div>
    );
  }

  if (mode === 'avance') {
    return (
      <div className="max-w-3xl mx-auto">
        <AdvancedModePlaceholder onBackToStandard={() => setMode('standard')} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-28 space-y-9">
      {/* `key={form.formResetKey}` : remonte tout le bloc éditable après
          une création réussie via "Enregistrer" (voir resetForNewCreation
          dans useNewsCreationForm) -- nécessaire pour les éditeurs riches
          et le champ de couverture, dont l'état interne ne se resynchronise
          pas seul depuis `value`/`onChange` après montage. Ne s'applique
          jamais en mode édition (formResetKey n'y bouge jamais). */}
      <React.Fragment key={form.formResetKey}>
        {form.isReadOnly && (
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-3 py-2 inline-block">
            Consultation seule — vous n'avez pas la permission de modifier cette news.
          </p>
        )}

        <TitleField value={form.titre} onChange={form.setTitre} disabled={form.isReadOnly} />

        <MetaFieldsRow form={form} />

        <div className="space-y-3">
          <ContentEditorField
            ref={form.richTextEditorRef}
            value={form.contenuJson}
            onChange={form.setContenuJson}
            newsId={form.existingNewsId || undefined}
            disabled={form.isReadOnly}
          />

          {/* Résumé bref -- champ distinct du contenu détaillé ci-dessus
              (voir ShortDescriptionField), séparé par un simple filet pour
              que les deux contenus ne se confondent jamais visuellement. */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <ShortDescriptionField
              value={form.descriptionCourteJson}
              onChange={form.setDescriptionCourteJson}
              disabled={form.isReadOnly}
            />
          </div>
        </div>

        <CoverImageField
          previewUrl={form.coverPreviewUrl}
          onFileSelected={form.handleImageSelected}
          onRemove={form.handleRemoveImage}
          disabled={form.isReadOnly}
        />

        <MediaGallerySection
          galleryItems={form.galleryDisplayItems}
          documentItems={form.documentDisplayItems}
          onAddGalleryFiles={form.addGalleryFiles}
          onRemoveGalleryItem={form.removeGalleryItem}
          onAddDocumentFiles={form.addDocumentFiles}
          onRemoveDocumentItem={form.removeDocumentItem}
          disabled={form.isReadOnly}
        />
      </React.Fragment>

      {!form.isReadOnly && (
        <NewsCreationDock
          isEditMode={form.isEditMode}
          isSubmitting={form.isSubmitting}
          submittingAction={form.submittingAction}
          onSaveAndStay={form.saveAndStay}
          onSaveAndQuit={form.saveAndQuit}
          onPreview={() => setIsPreviewOpen(true)}
          onCancel={form.cancel}
        />
      )}

      {/* "Visualiser" -- aperçu 100% local (voir buildPreviewNews.ts),
          n'enregistre rien : ce n'est pas son travail. */}
      <NewsPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        news={buildPreviewNews(form)}
      />
    </div>
  );
}

export const CreerSujetPage = CreerNewsPage;
