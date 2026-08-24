// ============================================================
// src/components/backoffice/news/NewsDetailExtras.tsx
// Onglets "Médias" / "Galerie" / "Documents" de la page de détail News
// — sous-ressources gérées via leurs propres endpoints (voir
// newsAssets.repository.ts), affichées ici plutôt que comme des tables
// autonomes de la navbar (inlines, à la Django admin).
// ============================================================

import React, { useCallback, useEffect, useState } from 'react';
import { Film, Images, Paperclip, Trash2, Upload, Loader2 } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Tabs, type TabItem } from '../../ui/Tabs';
import { Button } from '../../ui/Button';
import type { News, NewsMediaItem, NewsImageGalerieItem, DocumentJoint, NewsMediaType } from '../../../types/global.types';
import { newsMediasRepository, newsGalerieRepository, newsDocumentsRepository } from '../../../services/api/repositories/newsAssets.repository';
import { toast } from '../../../hooks/useToast';

const MEDIA_TYPE_OPTIONS: { value: NewsMediaType; label: string }[] = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Vidéo' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Document' },
];

function EmptyRow({ label }: { label: string }) {
  return <p className="text-sm text-gray-400 py-6 text-center">{label}</p>;
}

function MediasTab({ newsId }: { newsId: string }) {
  const [items, setItems] = useState<NewsMediaItem[] | null>(null);
  const [titre, setTitre] = useState('');
  const [type, setType] = useState<NewsMediaType>('image');
  const [urlExterne, setUrlExterne] = useState('');
  const [fichier, setFichier] = useState<File | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(() => {
    newsMediasRepository.listByNews(newsId).then(setItems).catch(() => setItems([]));
  }, [newsId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!titre.trim()) {
      toast('warning', 'Titre requis');
      return;
    }
    setIsSubmitting(true);
    try {
      await newsMediasRepository.create({ newsId, type, titre, urlExterne: urlExterne || undefined, fichier });
      setTitre(''); setUrlExterne(''); setFichier(undefined);
      toast('success', 'Média ajouté');
      load();
    } catch (err) {
      toast('error', "Échec de l'ajout", err instanceof Error ? err.message : undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await newsMediasRepository.remove(id);
      toast('success', 'Média supprimé');
      load();
    } catch (err) {
      toast('error', 'Échec de la suppression', err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-gray-50 dark:bg-[#161B45]">
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Titre du média"
          className="px-3 py-2 rounded-lg bg-white dark:bg-[#242A5C] border border-gray-200 dark:border-gray-700 text-sm"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as NewsMediaType)}
          className="px-3 py-2 rounded-lg bg-white dark:bg-[#242A5C] border border-gray-200 dark:border-gray-700 text-sm"
        >
          {MEDIA_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          value={urlExterne}
          onChange={(e) => setUrlExterne(e.target.value)}
          placeholder="URL externe (ex: YouTube) — optionnel si fichier"
          className="px-3 py-2 rounded-lg bg-white dark:bg-[#242A5C] border border-gray-200 dark:border-gray-700 text-sm sm:col-span-2"
        />
        <input
          type="file"
          onChange={(e) => setFichier(e.target.files?.[0])}
          className="text-xs sm:col-span-2 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[#5B4DFF]/10 file:text-[#5B4DFF] file:text-xs file:font-semibold file:cursor-pointer"
        />
        <Button size="sm" icon={<Upload className="w-3.5 h-3.5" />} isLoading={isSubmitting} onClick={handleAdd} className="sm:col-span-2 self-start">
          Ajouter le média
        </Button>
      </div>

      {items === null && <Loader2 className="w-5 h-5 animate-spin text-[#5B4DFF] mx-auto" />}
      {items?.length === 0 && <EmptyRow label="Aucun média pour cette News." />}
      {items?.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{item.titre}</p>
            <p className="text-xs text-gray-400">{item.type}</p>
          </div>
          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600 cursor-pointer shrink-0" onClick={() => handleRemove(item.id)} />
        </div>
      ))}
    </div>
  );
}

function GalerieTab({ newsId }: { newsId: string }) {
  const [items, setItems] = useState<NewsImageGalerieItem[] | null>(null);
  const [image, setImage] = useState<File | undefined>();
  const [legende, setLegende] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(() => {
    newsGalerieRepository.listByNews(newsId).then(setItems).catch(() => setItems([]));
  }, [newsId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!image) {
      toast('warning', 'Choisissez une image');
      return;
    }
    setIsSubmitting(true);
    try {
      await newsGalerieRepository.create(newsId, image, legende || undefined);
      setImage(undefined); setLegende('');
      toast('success', 'Image ajoutée à la galerie');
      load();
    } catch (err) {
      toast('error', "Échec de l'ajout", err instanceof Error ? err.message : undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await newsGalerieRepository.remove(id);
      toast('success', 'Image retirée');
      load();
    } catch (err) {
      toast('error', 'Échec de la suppression', err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-gray-50 dark:bg-[#161B45]">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0])}
          className="text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[#5B4DFF]/10 file:text-[#5B4DFF] file:text-xs file:font-semibold file:cursor-pointer"
        />
        <input
          value={legende}
          onChange={(e) => setLegende(e.target.value)}
          placeholder="Légende (optionnel)"
          className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#242A5C] border border-gray-200 dark:border-gray-700 text-sm"
        />
        <Button size="sm" icon={<Upload className="w-3.5 h-3.5" />} isLoading={isSubmitting} onClick={handleAdd}>
          Ajouter
        </Button>
      </div>

      {items === null && <Loader2 className="w-5 h-5 animate-spin text-[#5B4DFF] mx-auto" />}
      {items?.length === 0 && <EmptyRow label="Galerie vide." />}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items?.map((item) => (
          <div key={item.id} className="relative group rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 aspect-square">
            {item.imageUrl && <img src={item.imageUrl} alt={item.legende ?? ''} className="w-full h-full object-cover" />}
            <button
              onClick={() => handleRemove(item.id)}
              className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Retirer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentsTab({ newsId }: { newsId: string }) {
  const [items, setItems] = useState<DocumentJoint[] | null>(null);
  const [fichier, setFichier] = useState<File | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(() => {
    newsDocumentsRepository.listByNews(newsId).then(setItems).catch(() => setItems([]));
  }, [newsId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!fichier) {
      toast('warning', 'Choisissez un fichier');
      return;
    }
    setIsSubmitting(true);
    try {
      await newsDocumentsRepository.create(newsId, fichier);
      setFichier(undefined);
      toast('success', 'Document ajouté');
      load();
    } catch (err) {
      toast('error', "Échec de l'ajout", err instanceof Error ? err.message : undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await newsDocumentsRepository.remove(id);
      toast('success', 'Document supprimé');
      load();
    } catch (err) {
      toast('error', 'Échec de la suppression', err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-[#161B45]">
        <input
          type="file"
          onChange={(e) => setFichier(e.target.files?.[0])}
          className="text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[#5B4DFF]/10 file:text-[#5B4DFF] file:text-xs file:font-semibold file:cursor-pointer"
        />
        <Button size="sm" icon={<Upload className="w-3.5 h-3.5" />} isLoading={isSubmitting} onClick={handleAdd}>
          Joindre
        </Button>
      </div>

      {items === null && <Loader2 className="w-5 h-5 animate-spin text-[#5B4DFF] mx-auto" />}
      {items?.length === 0 && <EmptyRow label="Aucun document joint." />}
      {items?.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800">
          <div className="min-w-0 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
            <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#5B4DFF] hover:underline truncate">
              {doc.nom}
            </a>
            <span className="text-xs text-gray-400 shrink-0">{Math.round(doc.taille / 1024)} Ko</span>
          </div>
          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600 cursor-pointer shrink-0" onClick={() => handleRemove(doc.id)} />
        </div>
      ))}
    </div>
  );
}

export const NewsDetailExtras: React.FC<{ record: News }> = ({ record }) => {
  const [activeTab, setActiveTab] = useState('medias');

  const tabs: TabItem[] = [
    { id: 'medias', label: 'Médias', icon: <Film className="w-4 h-4" /> },
    { id: 'galerie', label: 'Galerie', icon: <Images className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', icon: <Paperclip className="w-4 h-4" /> },
  ];

  return (
    <Card variant="default" padding="lg">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" className="mb-4" />
      {activeTab === 'medias' && <MediasTab newsId={record.id} />}
      {activeTab === 'galerie' && <GalerieTab newsId={record.id} />}
      {activeTab === 'documents' && <DocumentsTab newsId={record.id} />}
    </Card>
  );
};
