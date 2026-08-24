import React from 'react';

/**
 * Vidé à la demande — plus aucun widget (Google Partner, Airtel Gabon,
 * Civic News) affiché pour l'instant, sur AUCUNE page. `null` plutôt
 * qu'un `<aside>` vide : un `<aside>` vide conserverait sa largeur
 * réservée (`w-[30%] min-w-[280px]...`) dans le flex du layout parent
 * (voir App.tsx), empêchant `<main>` de prendre toute la place. En
 * rendant `null`, `<main>` (flex-1) occupe seul toute la largeur.
 *
 * Le contexte SideContentContext (useSideContent/setSideContent) reste
 * en place et fonctionnel ailleurs dans l'app — seul le rendu ici est
 * désactivé. Réintroduire les widgets (ou du contenu par page via ce
 * contexte) se fait uniquement dans ce fichier, sans toucher au reste
 * de l'app.
 */
export const SideContent: React.FC = () => {
  return null;
};
