// ============================================================
// src/features/news/creation/useNewsCreationForm.ts
// Centralise tout l'état du mode standard de l'assistant de création
// (voir CreerNewsPage.tsx) ainsi que l'orchestration de sa
// soumission -- reprend et étend la logique historique du wizard à
// étapes (référentiels, image de couverture, sondage optionnel,
// finalisation des médias différés) avec les champs jusqu'ici définis
// dans les contrats de service mais jamais exposés dans l'interface :
// tags, lieu, fenêtre temporelle (dateDebut/dateFin) et visibilité.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { newsService } from '../../../services/api/news.service';
import { sondagesService } from '../../../services/api/sondages.service';
import { referentielsService } from '../../../services/api/referentiels.service';
import {
  newsGalerieRepository,
  newsDocumentsRepository,
} from '../../../services/api/repositories/newsAssets.repository';
import type {
  NewsType, Categorie, Organisation, Etablissement,
  NewsImageGalerieItem, DocumentJoint,
} from '../../../types/global.types';
import { useAuthStore } from '../../../store/auth.store';
import { usePermissions } from '../../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../../lib/permissions/permissions.catalog';
import { toast } from '../../../hooks/useToast';
import { useOpenNewsDetail } from '../hooks/useOpenNewsDetail';
import type { RichTextEditorHandle } from '../../../components/editor/RichTextEditor';
import { extractPlainTextSummary } from './components/ContentEditorField';
import type { PendingGalleryItem, PendingDocumentItem } from './types';

/** Formate une Date en valeur compatible avec <input type="datetime-local">. */
function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function makeTempId(): string {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useNewsCreationForm() {
  const navigate = useNavigate();
  const openNewsDetail = useOpenNewsDetail();
  const { user } = useAuthStore();
  const { can } = usePermissions();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  // Même mécanique que l'ancien wizard : un backoffice sans permission
  // de gestion peut consulter une fiche existante (lecture seule), la
  // création elle-même reste ouverte à tout citoyen connecté.
  const canManageNews = can(PERMISSIONS.BACKOFFICE_NEWS_MANAGE);
  const isReadOnly = isEditMode && !canManageNews;
  // Le sondage est une capacité additionnelle (pas le cœur de la
  // création) : on peut donc, elle, la restreindre par permission sans
  // contredire la politique d'ouverture de la page elle-même.
  const canCreatePoll = can(PERMISSIONS.SONDAGE_CREATE);

  const [titre, setTitre] = useState('');
  const [type, setType] = useState<NewsType>('information');
  const [contenuJson, setContenuJson] = useState('');
  // Résumé bref, saisi séparément par l'auteur dans son propre éditeur
  // riche (News.description) -- distinct du contenu détaillé ci-dessus
  // (voir ShortDescriptionField). Réduit en texte brut à la soumission.
  const [descriptionCourteJson, setDescriptionCourteJson] = useState('');
  const richTextEditorRef = useRef<RichTextEditorHandle>(null);

  const [province, setProvince] = useState('Estuaire');
  const [lieu, setLieu] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [visibilite, setVisibilite] = useState<'public' | 'prive' | 'limite'>('public');

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [categorieId, setCategorieId] = useState('');
  const [organisationId, setOrganisationId] = useState('');
  const [etablissementId, setEtablissementId] = useState('');
  const [isLoadingReferentiels, setIsLoadingReferentiels] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const [addPoll, setAddPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollChoice1, setPollChoice1] = useState('');
  const [pollChoice2, setPollChoice2] = useState('');
  const [pollDateDebut, setPollDateDebut] = useState(() => toDatetimeLocalValue(new Date()));
  const [pollDateFin, setPollDateFin] = useState(() => toDatetimeLocalValue(new Date(Date.now() + 30 * 86400 * 1000)));
  // Un sondage déjà rattaché n'est pas encore modifiable depuis cet
  // assistant (aucun endpoint de mise à jour de sondage côté service) :
  // affiché à titre indicatif, verrouillé, non recréé à l'enregistrement.
  const [hasExistingSondage, setHasExistingSondage] = useState(false);

  const [existingGalleryItems, setExistingGalleryItems] = useState<NewsImageGalerieItem[]>([]);
  const [pendingGalleryItems, setPendingGalleryItems] = useState<PendingGalleryItem[]>([]);
  const [existingDocumentItems, setExistingDocumentItems] = useState<DocumentJoint[]>([]);
  const [pendingDocumentItems, setPendingDocumentItems] = useState<PendingDocumentItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEditMode);
  const [loadRecordError, setLoadRecordError] = useState<string | null>(null);
  const [existingNewsId, setExistingNewsId] = useState<string | null>(null);

  // --- Chargement des référentiels ---------------------------------
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      referentielsService.getCategories(),
      referentielsService.getOrganisations(),
      referentielsService.getEtablissements(),
    ])
      .then(([cats, orgs, etabs]) => {
        if (cancelled) return;
        setCategories(cats);
        setOrganisations(orgs);
        setEtablissements(etabs);
        // Le chargement d'une fiche existante (effet ci-dessous) peut
        // résoudre avant ou après celui-ci -- ne jamais écraser une
        // categorieId déjà posée.
        if (cats.length > 0) setCategorieId((prev) => prev || cats[0].id);
      })
      .catch((error) => console.error('Échec du chargement des référentiels :', error))
      .finally(() => {
        if (!cancelled) setIsLoadingReferentiels(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Chargement de la fiche existante (mode édition) --------------
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoadingRecord(true);
    setLoadRecordError(null);
    newsService.getNewsBySlug(id)
      .then(async (record) => {
        if (cancelled || !record) {
          if (!cancelled) setLoadRecordError('News introuvable.');
          return;
        }
        setExistingNewsId(record.id);
        setTitre(record.titre);
        setType(record.type);
        setContenuJson(record.contenu || '');
        setDescriptionCourteJson(record.description || '');
        setProvince(record.province || 'Estuaire');
        setLieu(record.lieu || '');
        setTags(record.tags || []);
        setDateDebut(record.dateDebut ? toDatetimeLocalValue(new Date(record.dateDebut)) : '');
        setDateFin(record.dateFin ? toDatetimeLocalValue(new Date(record.dateFin)) : '');
        setVisibilite(record.visibilite || 'public');
        setCategorieId(record.categorie.id);
        setOrganisationId(record.organisation?.id || '');
        setEtablissementId(record.etablissement?.id || '');
        setExistingImageUrl(record.image || null);

        const sondage = record.sondages?.[0];
        if (sondage) {
          setHasExistingSondage(true);
          setAddPoll(true);
          setPollQuestion(sondage.question);
          setPollChoice1(sondage.choix[0]?.libelle || '');
          setPollChoice2(sondage.choix[1]?.libelle || '');
          setPollDateDebut(toDatetimeLocalValue(new Date(sondage.dateDebut)));
          setPollDateFin(toDatetimeLocalValue(new Date(sondage.dateFin)));
        }

        // Galerie/documents déjà persistés -- chargés en best-effort,
        // une erreur ici ne doit pas bloquer l'ouverture de la fiche.
        try {
          const [galerie, documents] = await Promise.all([
            newsGalerieRepository.listByNews(record.id),
            newsDocumentsRepository.listByNews(record.id),
          ]);
          if (!cancelled) {
            setExistingGalleryItems(galerie);
            setExistingDocumentItems(documents);
          }
        } catch (assetError) {
          console.error('Échec du chargement de la galerie/documents :', assetError);
        }
      })
      .catch((error) => {
        if (!cancelled) setLoadRecordError(error instanceof Error ? error.message : 'Chargement impossible.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRecord(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Nettoie les URLs d'objet créées pour les prévisualisations locales.
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      pendingGalleryItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Couverture -----------------------------------------------------
  const handleImageSelected = useCallback((file: File) => {
    setImageFile((prevFile) => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      return file;
    });
    setImagePreviewUrl(URL.createObjectURL(file));
  }, [imagePreviewUrl]);

  const handleRemoveImage = useCallback(() => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
    setExistingImageUrl(null);
  }, [imagePreviewUrl]);

  const coverPreviewUrl = imagePreviewUrl || existingImageUrl;

  // --- Tags -------------------------------------------------------
  const addTag = useCallback((raw: string) => {
    const value = raw.trim().replace(/^#/, '');
    if (!value) return;
    setTags((prev) => (prev.includes(value) ? prev : [...prev, value]));
  }, []);
  const removeTag = useCallback((value: string) => {
    setTags((prev) => prev.filter((t) => t !== value));
  }, []);

  // --- Galerie / documents -----------------------------------------
  const addGalleryFiles = useCallback(async (files: FileList) => {
    const list = Array.from(files);
    if (existingNewsId) {
      for (const file of list) {
        try {
          const created = await newsGalerieRepository.create(existingNewsId, file);
          setExistingGalleryItems((prev) => [...prev, created]);
        } catch {
          toast('warning', 'Photo non ajoutée', `« ${file.name} » n'a pas pu être importée.`);
        }
      }
      return;
    }
    setPendingGalleryItems((prev) => [
      ...prev,
      ...list.map((file) => ({ tempId: makeTempId(), file, previewUrl: URL.createObjectURL(file), legende: '' })),
    ]);
  }, [existingNewsId]);

  const removeGalleryItem = useCallback(async (itemId: string) => {
    const pending = pendingGalleryItems.find((p) => p.tempId === itemId);
    if (pending) {
      URL.revokeObjectURL(pending.previewUrl);
      setPendingGalleryItems((prev) => prev.filter((p) => p.tempId !== itemId));
      return;
    }
    try {
      await newsGalerieRepository.remove(itemId);
      setExistingGalleryItems((prev) => prev.filter((g) => g.id !== itemId));
    } catch {
      toast('error', 'Suppression impossible', "Cette photo n'a pas pu être retirée. Réessayez.");
    }
  }, [pendingGalleryItems]);

  const addDocumentFiles = useCallback(async (files: FileList) => {
    const list = Array.from(files);
    if (existingNewsId) {
      for (const file of list) {
        try {
          const created = await newsDocumentsRepository.create(existingNewsId, file);
          setExistingDocumentItems((prev) => [...prev, created]);
        } catch {
          toast('warning', 'Document non ajouté', `« ${file.name} » n'a pas pu être importé.`);
        }
      }
      return;
    }
    setPendingDocumentItems((prev) => [
      ...prev,
      ...list.map((file) => ({ tempId: makeTempId(), file, nom: file.name })),
    ]);
  }, [existingNewsId]);

  const removeDocumentItem = useCallback(async (itemId: string) => {
    const pending = pendingDocumentItems.find((p) => p.tempId === itemId);
    if (pending) {
      setPendingDocumentItems((prev) => prev.filter((p) => p.tempId !== itemId));
      return;
    }
    try {
      await newsDocumentsRepository.remove(itemId);
      setExistingDocumentItems((prev) => prev.filter((d) => d.id !== itemId));
    } catch {
      toast('error', 'Suppression impossible', "Ce document n'a pas pu être retiré. Réessayez.");
    }
  }, [pendingDocumentItems]);

  const galleryDisplayItems = useMemo(
    () => [
      ...existingGalleryItems.map((g) => ({ id: g.id, previewUrl: g.imageUrl || '' })),
      ...pendingGalleryItems.map((p) => ({ id: p.tempId, previewUrl: p.previewUrl })),
    ],
    [existingGalleryItems, pendingGalleryItems],
  );
  const documentDisplayItems = useMemo(
    () => [
      ...existingDocumentItems.map((d) => ({ id: d.id, nom: d.nom, url: d.url })),
      ...pendingDocumentItems.map((p) => ({ id: p.tempId, nom: p.nom })),
    ],
    [existingDocumentItems, pendingDocumentItems],
  );

  // --- Validation minimale + soumission -----------------------------
  const validate = useCallback((): boolean => {
    if (!titre.trim()) {
      toast('warning', 'Titre manquant', 'Donnez un titre à votre publication avant de continuer.');
      return false;
    }
    if (!categorieId) {
      toast('warning', 'Catégorie requise', 'Choisissez une catégorie avant de continuer.');
      return false;
    }
    if (!extractPlainTextSummary(contenuJson)) {
      toast('warning', 'Contenu manquant', 'Rédigez le contenu de votre publication avant de continuer.');
      return false;
    }
    if (!extractPlainTextSummary(descriptionCourteJson)) {
      toast('warning', 'Résumé manquant', "Dites en bref ce qu'il faut retenir avant de continuer.");
      return false;
    }
    return true;
  }, [titre, categorieId, contenuJson, descriptionCourteJson]);

  const submit = useCallback(async () => {
    if (!validate()) return;
    const categorie = categories.find((c) => c.id === categorieId);
    if (!categorie) {
      toast('warning', 'Catégorie requise', 'Choisissez une catégorie avant de continuer.');
      return;
    }
    const organisation = organisations.find((o) => o.id === organisationId);
    const etablissement = etablissements.find((e) => e.id === etablissementId);
    // News.description reste un champ texte brut côté backend/affichage
    // (chapeau NewsCard, recherche, fil) -- voir ShortDescriptionField.
    const description = extractPlainTextSummary(descriptionCourteJson);

    setIsSubmitting(true);
    try {
      if (isEditMode && existingNewsId) {
        const updated = await newsService.updateNews(existingNewsId, {
          titre,
          type,
          description,
          contenu: contenuJson,
          province,
          lieu: lieu || undefined,
          dateDebut: dateDebut ? new Date(dateDebut).toISOString() : null,
          dateFin: dateFin ? new Date(dateFin).toISOString() : null,
          categorie,
          organisation,
          etablissement,
          tags,
          visibilite,
        });

        if (canCreatePoll && addPoll && pollQuestion.trim() && !hasExistingSondage) {
          try {
            await sondagesService.creerSondage({
              newsId: updated.id,
              titre: pollQuestion,
              question: pollQuestion,
              choix: [pollChoice1.trim() || 'Oui', pollChoice2.trim() || 'Non'],
              dateDebut: new Date(pollDateDebut).toISOString(),
              dateFin: new Date(pollDateFin).toISOString(),
            });
          } catch (pollError) {
            console.error('Échec de la création du sondage :', pollError);
            toast('warning', 'News mise à jour, sondage non créé', "La mise à jour a réussi mais le sondage associé n'a pas pu être créé.");
          }
        }

        toast('success', 'News mise à jour avec succès', 'Vos modifications ont bien été enregistrées.');
        navigate(`/admin/news/${updated.id}`);
        return;
      }

      const created = await newsService.createNews({
        titre,
        type,
        description,
        contenu: contenuJson,
        province,
        lieu: lieu || undefined,
        dateDebut: dateDebut ? new Date(dateDebut).toISOString() : undefined,
        dateFin: dateFin ? new Date(dateFin).toISOString() : undefined,
        image: imageFile || undefined,
        categorie,
        organisation,
        etablissement,
        tags,
        visibilite,
        auteur: user || undefined,
      });

      // Le contenu peut encore référencer des médias locaux (blob:) si
      // l'auteur en a inséré avant que la News n'existe -- son id étant
      // désormais connu, on les persiste et réenregistre le contenu final.
      if (richTextEditorRef.current) {
        try {
          const { content: finalContenu, failedCount } = await richTextEditorRef.current.publishPendingMedia(created.id);
          if (finalContenu !== contenuJson) {
            await newsService.updateNews(created.id, { contenu: finalContenu });
          }
          if (failedCount > 0) {
            toast('warning', 'Certains médias non importés', `${failedCount} média(s) du contenu n'ont pas pu être importés. Modifiez l'article pour réessayer.`);
          }
        } catch (mediaError) {
          console.error('Échec de la persistance des médias du contenu :', mediaError);
          toast('warning', 'News publiée, médias non finalisés', "La publication a réussi mais certains médias n'ont pas pu être finalisés.");
        }
      }

      // Galerie/documents en attente -- mêmes principes de tolérance aux échecs.
      const galleryResults = await Promise.allSettled(
        pendingGalleryItems.map((item) => newsGalerieRepository.create(created.id, item.file, item.legende || undefined)),
      );
      const documentResults = await Promise.allSettled(
        pendingDocumentItems.map((item) => newsDocumentsRepository.create(created.id, item.file, item.nom)),
      );
      pendingGalleryItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      const failedAssets = [...galleryResults, ...documentResults].filter((r) => r.status === 'rejected').length;
      if (failedAssets > 0) {
        toast('warning', 'Certains fichiers non importés', `${failedAssets} élément(s) de la galerie/documents n'ont pas pu être importés.`);
      }

      // Le sondage n'est pas un champ de News côté backend : ressource à
      // part, créée séparément une fois la News existante.
      if (canCreatePoll && addPoll && pollQuestion.trim()) {
        try {
          await sondagesService.creerSondage({
            newsId: created.id,
            titre: pollQuestion,
            question: pollQuestion,
            choix: [pollChoice1.trim() || 'Oui', pollChoice2.trim() || 'Non'],
            dateDebut: new Date(pollDateDebut).toISOString(),
            dateFin: new Date(pollDateFin).toISOString(),
          });
        } catch (pollError) {
          console.error('Échec de la création du sondage :', pollError);
          toast('warning', 'News publiée, sondage non créé', "La publication a réussi mais le sondage associé n'a pas pu être créé.");
        }
      }

      toast('success', 'News publiée avec succès !', 'Votre actualité est désormais ouverte au débat.');
      navigate('/news');
      openNewsDetail(created.slug);
    } catch (err) {
      toast('error', isEditMode ? 'Erreur de mise à jour' : 'Erreur de publication', err instanceof Error ? err.message : undefined);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validate, categories, categorieId, organisations, organisationId, etablissements, etablissementId,
    contenuJson, descriptionCourteJson, isEditMode, existingNewsId, titre, type, province, lieu, dateDebut, dateFin, tags, visibilite,
    canCreatePoll, addPoll, pollQuestion, pollChoice1, pollChoice2, pollDateDebut, pollDateFin, hasExistingSondage,
    imageFile, user, pendingGalleryItems, pendingDocumentItems, navigate, openNewsDetail,
  ]);

  return {
    isEditMode, isReadOnly, canCreatePoll,
    titre, setTitre, type, setType, contenuJson, setContenuJson, richTextEditorRef,
    descriptionCourteJson, setDescriptionCourteJson,
    province, setProvince, lieu, setLieu, tags, addTag, removeTag,
    dateDebut, setDateDebut, dateFin, setDateFin, visibilite, setVisibilite,
    categories, organisations, etablissements, categorieId, setCategorieId,
    organisationId, setOrganisationId, etablissementId, setEtablissementId, isLoadingReferentiels,
    coverPreviewUrl, handleImageSelected, handleRemoveImage,
    addPoll, setAddPoll, pollQuestion, setPollQuestion, pollChoice1, setPollChoice1,
    pollChoice2, setPollChoice2, pollDateDebut, setPollDateDebut, pollDateFin, setPollDateFin, hasExistingSondage,
    galleryDisplayItems, addGalleryFiles, removeGalleryItem,
    documentDisplayItems, addDocumentFiles, removeDocumentItem,
    isSubmitting, isLoadingRecord, loadRecordError,
    existingNewsId, user, submit,
  };
}

export type NewsCreationForm = ReturnType<typeof useNewsCreationForm>;
