// Ré-export : orphelin, jamais importé nulle part -- doublon de
// NewsSimilaires.tsx (Sujet est un simple alias de type de News, voir
// types/models/news.types.ts). Évite qu'il diverge silencieusement du
// design si quelqu'un l'importe un jour.
export { NewsSimilaires as SujetsSimilaires, type NewsSimilairesProps as SujetsSimilairesProps } from '../../news/components/NewsSimilaires';
