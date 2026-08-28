// Ré-export : ce fichier était une quasi-copie de NewsMediaGallery.tsx
// (SujetMediaItem est un simple alias de type de NewsMediaItem, voir
// types/models/news.types.ts). Évite la double maintenance et garantit
// un rendu identique pour les News et les Sujets.
export { NewsMediaGallery as SujetMediaGallery, type NewsMediaGalleryProps as SujetMediaGalleryProps } from '../../news/components/NewsMediaGallery';
