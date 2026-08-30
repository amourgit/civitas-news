// Ré-export : orphelin, jamais importé nulle part -- doublon de
// NewsGrid.tsx (Sujet est un simple alias de type de News, voir
// types/models/news.types.ts). Évite qu'il diverge silencieusement du
// design bento si quelqu'un l'importe un jour.
export { NewsGrid as SujetGrid, type NewsGridProps as SujetGridProps } from '../../news/components/NewsGrid';
