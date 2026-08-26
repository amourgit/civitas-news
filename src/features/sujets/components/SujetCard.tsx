// Ré-export : SujetCard était une quasi-copie de NewsCard.tsx (même
// design de card, "Sujet" étant un simple alias de type de "News", voir
// types/models/news.types.ts:`export type Sujet = News;`). NewsCard.tsx
// exportait déjà lui-même un alias `SujetCard = NewsCard` -- ce fichier
// séparé était donc une duplication qui aurait dérivé du design mis à
// jour (bordures retirées, image héro 80vh, card entière cliquable) et
// qui pointait vers la route /sujets/:slug désormais débranchée (voir
// App.tsx). Re-exporter directement évite la double maintenance et
// garantit un rendu identique pour les News et les Sujets.
export { SujetCard, type SujetCardProps } from '../../news/components/NewsCard';
