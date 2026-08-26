import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stepper } from '../components/ui/Stepper';
import { Button } from '../components/ui/Button';
import { DatePicker } from '../components/ui/DatePicker';
import { newsService } from '../services/api/news.service';
import { sondagesService } from '../services/api/sondages.service';
import { referentielsService } from '../services/api/referentiels.service';
import { NewsType, Categorie, Organisation, Etablissement } from '../types/global.types';
import { useAuthStore } from '../store/auth.store';
import { toast } from '../hooks/useToast';
import { FilePlus, ArrowLeft, ArrowRight, CheckCircle2, ImagePlus, X } from 'lucide-react';
import { RichTextViewer } from '../components/ui/RichTextViewer';
import { MarkdownToolbar } from '../components/ui/MarkdownToolbar';
import { useOpenNewsDetail } from '../features/news/hooks/useOpenNewsDetail';

const WIZARD_STEPS = [
  { id: 'step-1', title: '1. Informations', description: 'Titre & Thématique' },
  { id: 'step-2', title: '2. Contenu & Médias', description: 'Description & Image' },
  { id: 'step-3', title: '3. Sondage (Option)', description: 'Question & Choix' },
  { id: 'step-4', title: '4. Validation', description: 'Aperçu & Publication' },
];

/** Les 9 provinces du Gabon (voir news/models.py: Province, côté backend). */
const PROVINCES_GABON = [
  'Estuaire',
  'Haut-Ogooué',
  'Moyen-Ogooué',
  'Ngounié',
  'Nyanga',
  'Ogooué-Ivindo',
  'Ogooué-Lolo',
  'Ogooué-Maritime',
  'Woleu-Ntem',
];

/** Formate une Date en valeur compatible avec <input type="datetime-local">. */
function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CreerNewsPage() {
  const navigate = useNavigate();
  const openNewsDetail = useOpenNewsDetail();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);

  const [titre, setTitre] = useState('');
  const [type, setType] = useState<NewsType>('consultation');
  const [description, setDescription] = useState('');
  const [contenu, setContenu] = useState('');
  const [showPreviewDesc, setShowPreviewDesc] = useState(false);
  const [showPreviewContenu, setShowPreviewContenu] = useState(false);
  const [province, setProvince] = useState('Estuaire');

  // Référentiels (catégories, organisations, établissements) — peuplés
  // depuis referentielsService (bascule mock/réel automatique).
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [categorieId, setCategorieId] = useState('');
  const [organisationId, setOrganisationId] = useState('');
  const [etablissementId, setEtablissementId] = useState('');
  const [isLoadingReferentiels, setIsLoadingReferentiels] = useState(true);

  // Image de couverture (fichier réel — le backend attend un ImageField, pas une URL).
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Poll state inside wizard
  const [addPoll, setAddPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollChoice1, setPollChoice1] = useState('');
  const [pollChoice2, setPollChoice2] = useState('');
  const [pollDateDebut, setPollDateDebut] = useState(() => toDatetimeLocalValue(new Date()));
  const [pollDateFin, setPollDateFin] = useState(() => toDatetimeLocalValue(new Date(Date.now() + 30 * 86400 * 1000)));

  const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (cats.length > 0) setCategorieId(cats[0].id);
      })
      .catch((error) => console.error('Échec du chargement des référentiels :', error))
      .finally(() => {
        if (!cancelled) setIsLoadingReferentiels(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Nettoie l'URL d'objet créée pour la prévisualisation de l'image
  // lorsqu'un nouveau fichier est choisi ou que la page se démonte.
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  const handleNext = () => {
    if (currentStep === 0 && !titre.trim()) {
      toast('warning', 'Champ requis', 'Veuillez saisir un titre pour votre news.');
      return;
    }
    if (currentStep === 0 && !categorieId) {
      toast('warning', 'Champ requis', 'Veuillez choisir une catégorie.');
      return;
    }
    if (currentStep === 1 && !description.trim()) {
      toast('warning', 'Champ requis', 'Veuillez rédiger une description.');
      return;
    }
    setCurrentStep((prev) => Math.min(WIZARD_STEPS.length - 1, prev + 1));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handlePublish = async () => {
    const categorie = categories.find((c) => c.id === categorieId);
    if (!categorie) {
      toast('warning', 'Catégorie requise', 'Veuillez choisir une catégorie avant de publier.');
      setCurrentStep(0);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await newsService.createNews({
        titre,
        type,
        description,
        contenu,
        province,
        image: imageFile || undefined,
        categorie,
        organisation: organisations.find((o) => o.id === organisationId),
        etablissement: etablissements.find((e) => e.id === etablissementId),
        auteur: user || undefined,
      });

      // Le sondage n'est PAS un champ de News côté backend : c'est une
      // ressource à part (sondages/api/v1/), créée séparément une fois
      // la News existante, et rattachée via son id.
      if (addPoll && pollQuestion.trim()) {
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
          // La news est déjà publiée : un échec de création du sondage ne
          // doit pas faire perdre le travail déjà accompli à l'utilisateur.
          console.error('Échec de la création du sondage :', pollError);
          toast('warning', 'News publiée, sondage non créé', 'La publication a réussi mais le sondage associé n’a pas pu être créé.');
        }
      }

      toast('success', 'News publiée avec succès !', 'Votre actualité est désormais ouverte au débat.');
      navigate('/news');
      openNewsDetail(created.slug);
    } catch (err: any) {
      toast('error', 'Erreur de publication', err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-display flex items-center gap-3">
          <FilePlus className="w-8 h-8 text-[#5B4DFF]" />
          Assistant de Création de News / Information
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Publiez votre actualité, projet ou information en 4 étapes guidées.
        </p>
      </div>

      <Stepper steps={WIZARD_STEPS} currentStepIndex={currentStep} onStepClick={setCurrentStep} />

      <div className="bg-white dark:bg-[#1A1F4D] rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-md">
        {/* Step 1 */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">
              Informations Principales
            </h3>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Titre de la news / de la publication *
              </label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex: Rénovation de la bibliothèque centrale..."
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Format de la News
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as NewsType)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
                >
                  <option value="consultation">Consultation Publique</option>
                  <option value="projet">Projet Académique / Associatif</option>
                  <option value="evenement">Événement & Conférence</option>
                  <option value="petition">Pétition Citoyenne</option>
                  <option value="sondage">Sondage Express</option>
                  <option value="annonce">Annonce Officielle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Province d'Impact
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
                >
                  {PROVINCES_GABON.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Catégorie *
                </label>
                <select
                  value={categorieId}
                  onChange={(e) => setCategorieId(e.target.value)}
                  disabled={isLoadingReferentiels}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-60"
                >
                  {isLoadingReferentiels && <option value="">Chargement…</option>}
                  {!isLoadingReferentiels && categories.length === 0 && <option value="">Aucune catégorie disponible</option>}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Organisation (optionnel)
                </label>
                <select
                  value={organisationId}
                  onChange={(e) => setOrganisationId(e.target.value)}
                  disabled={isLoadingReferentiels}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-60"
                >
                  <option value="">Aucune</option>
                  {organisations.map((o) => (
                    <option key={o.id} value={o.id}>{o.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Établissement (optionnel)
                </label>
                <select
                  value={etablissementId}
                  onChange={(e) => setEtablissementId(e.target.value)}
                  disabled={isLoadingReferentiels}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-60"
                >
                  <option value="">Aucun</option>
                  {etablissements.map((e) => (
                    <option key={e.id} value={e.id}>{e.nom}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">
              Contenu & Visuel
            </h3>

            {/* Description / Summary Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Résumé synthétique (Brève description) *
              </label>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <MarkdownToolbar
                  value={description}
                  onChange={setDescription}
                  showPreview={showPreviewDesc}
                  onTogglePreview={() => setShowPreviewDesc(!showPreviewDesc)}
                />
                {showPreviewDesc ? (
                  <div className="p-4 bg-white dark:bg-gray-900 min-h-[90px]">
                    <RichTextViewer content={description || '*Aucun contenu à prévisualiser*'} />
                  </div>
                ) : (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Présentez brièvement l'enjeu principal en 2-3 phrases (compatible gras **, italique *, etc.)..."
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[#5B4DFF]"
                  />
                )}
              </div>
            </div>

            {/* Detailed Content & Objectives Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Texte détaillé & Objectifs (Propositions, contexte, chapitres...)
              </label>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <MarkdownToolbar
                  value={contenu}
                  onChange={setContenu}
                  showPreview={showPreviewContenu}
                  onTogglePreview={() => setShowPreviewContenu(!showPreviewContenu)}
                />
                {showPreviewContenu ? (
                  <div className="p-4 bg-white dark:bg-gray-900 min-h-[180px]">
                    <RichTextViewer
                      content={contenu || '*Aucun contenu détaillé à prévisualiser*'}
                    />
                  </div>
                ) : (
                  <textarea
                    value={contenu}
                    onChange={(e) => setContenu(e.target.value)}
                    rows={8}
                    placeholder="Collez ici votre texte depuis ChatGPT, Claude.ai, ou Google Docs : mise en forme (gras, italique, listes, tableaux, citations) reconnue automatiquement !"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[#5B4DFF]"
                  />
                )}
              </div>
            </div>

            {/* Image de couverture */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Image de couverture (optionnel)
              </label>
              {imagePreviewUrl ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img src={imagePreviewUrl} alt="Prévisualisation" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                    title="Retirer l'image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 w-full h-32 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 cursor-pointer hover:border-[#5B4DFF] hover:text-[#5B4DFF] transition-colors">
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-xs font-semibold">Cliquez pour choisir une image</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">
              Intégration d'un Sondage (Optionnel)
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="addPollCheck"
                checked={addPoll}
                onChange={(e) => setAddPoll(e.target.checked)}
                className="w-4 h-4 text-[#5B4DFF]"
              />
              <label htmlFor="addPollCheck" className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Ajouter une question de sondage à cette publication
              </label>
            </div>

            {addPoll && (
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Question du sondage
                  </label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Ex: Êtes-vous favorable à cette mesure ?"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={pollChoice1}
                    onChange={(e) => setPollChoice1(e.target.value)}
                    placeholder="Option 1 (ex: Pour)"
                    className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border text-xs"
                  />
                  <input
                    type="text"
                    value={pollChoice2}
                    onChange={(e) => setPollChoice2(e.target.value)}
                    placeholder="Option 2 (ex: Contre)"
                    className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DatePicker label="Ouverture du vote" value={pollDateDebut} onChange={setPollDateDebut} />
                  <DatePicker label="Clôture du vote" value={pollDateFin} onChange={setPollDateFin} min={pollDateDebut} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4 */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">
              Aperçu Général avant Publication
            </h3>
            <div className="p-4 sm:p-5 rounded-2xl bg-gray-50 dark:bg-gray-800 space-y-4 text-xs sm:text-sm border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Titre</span>
                  <span className="font-extrabold text-gray-900 dark:text-white">{titre || 'Non renseigné'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Type</span>
                  <span className="font-bold capitalize text-[#5B4DFF]">{type}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Province</span>
                  <span className="font-bold">{province}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Catégorie</span>
                  <span className="font-bold">{categories.find((c) => c.id === categorieId)?.nom || 'Non renseignée'}</span>
                </div>
              </div>

              {imagePreviewUrl && (
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Image de couverture</span>
                  <img src={imagePreviewUrl} alt="Prévisualisation" className="w-full h-40 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                </div>
              )}

              {description && (
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">
                    Résumé synthétique
                  </span>
                  <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <RichTextViewer content={description} compact />
                  </div>
                </div>
              )}

              {contenu && (
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">
                    Texte Détaillé & Objectifs (Rendu Riche)
                  </span>
                  <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <RichTextViewer content={contenu} />
                  </div>
                </div>
              )}

              {addPoll && pollQuestion && (
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Sondage associé</span>
                  <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <p className="font-bold">{pollQuestion}</p>
                    <p className="text-gray-500">{pollChoice1 || 'Oui'} / {pollChoice2 || 'Non'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation CTAs */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" size="md" disabled={currentStep === 0} onClick={handlePrev}>
            <ArrowLeft className="w-4 h-4" /> Précédent
          </Button>

          {currentStep < WIZARD_STEPS.length - 1 ? (
            <Button variant="primary" size="md" onClick={handleNext}>
              <span>Suivant</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="primary" size="lg" isLoading={isSubmitting} onClick={handlePublish}>
              <span>Publier la news</span>
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export const CreerSujetPage = CreerNewsPage;
