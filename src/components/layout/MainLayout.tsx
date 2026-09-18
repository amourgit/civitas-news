// ============================================================
// src/components/layout/MainLayout.tsx
// Ossature commune à la quasi-totalité des pages de l'app : fond de
// page par défaut (PageBackgroundLayer), topbar (Header) + colonne
// latérale (SideContent) autour du contenu de la route active
// (<Outlet/>), bouton d'actions rapides (QuickActionsFab), puis le
// dock de navigation mobile (MobileDockGate).
//
// Isolé de App.tsx en route-layout (élément d'une <Route> parente sans
// path, voir App.tsx) pour que les pages qui ont besoin d'un canevas
// totalement nu -- aucune topbar, aucun dock, aucun fond animé par
// défaut -- puissent être déclarées comme routes SŒURS de cette
// disposition plutôt que ses enfants (ex : CreerOrganisationPage, un
// formulaire à identité visuelle propre et volontairement dépourvu de
// tout chrome global).
// ============================================================
import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { MobileDock } from './MobileDock';
import { SideContent } from './SideContent';
import { PageBackgroundLayer } from './PageBackgroundLayer';
import { QuickActionsFab } from './fab/QuickActionsFab';
import { AppLoadingOverlay } from '../ui/AppLoadingOverlay';

/**
 * Routes qui affichent leur PROPRE dock fixe en bas d'écran (voir
 * NewsCommentDock/NewsCreationDock) et qui n'ont donc plus besoin --
 * ni la place -- pour le dock de navigation mobile par-dessus :
 * - /news/:slug, /sujets/:slug (page détails -- NewsCommentDock,
 *   NewsDetailPage.tsx), en excluant explicitement le segment littéral
 *   "creer" pour ne pas le faire matcher par erreur.
 * - /news/creer, /sujets/creer, /news/modifier/:id (assistant de
 *   création/édition -- NewsCreationDock, CreerNewsPage.tsx), dock
 *   affiché quelle que soit la taille d'écran (pas juste mobile).
 */
const ROUTES_WITH_OWN_DOCK: Array<(segments: string[]) => boolean> = [
  (s) => s.length === 2 && (s[0] === 'news' || s[0] === 'sujets') && s[1] !== 'creer',
  (s) => s.length === 2 && (s[0] === 'news' || s[0] === 'sujets') && s[1] === 'creer',
  (s) => s.length === 3 && s[0] === 'news' && s[1] === 'modifier',
];

function MobileDockGate() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const hasOwnFixedDock = ROUTES_WITH_OWN_DOCK.some((matches) => matches(segments));

  if (hasOwnFixedDock) return null;
  return <MobileDock />;
}

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col text-gray-900 dark:text-gray-100 font-sans">
      {/* Fond de page unique pour tout le site (voir
          components/layout/PageBackgroundLayer.tsx et
          DefaultBackground.tsx). Toute page peut le remplacer par son
          propre composant React (image, vidéo en boucle, canvas...)
          via usePageBackground (voir context/PageBackgroundContext.tsx) —
          même contrat que useSetSideContent pour la colonne latérale. */}
      <PageBackgroundLayer />
      <Header>
        <div className="w-full flex flex-col">
          <div className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 pt-2 sm:pt-4 pb-12 md:pb-6 flex items-start gap-6">
            <main className="flex-1 min-w-0 w-full">
              <Suspense fallback={<AppLoadingOverlay visible label="Chargement de la page…" />}>
                <Outlet />
              </Suspense>
            </main>
            <SideContent />
          </div>
        </div>
      </Header>
      <MobileDockGate />
      <QuickActionsFab />
    </div>
  );
}
