import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { MobileDock } from './components/layout/MobileDock';
import { SideContent } from './components/layout/SideContent';
import { SideContentProvider } from './context/SideContentContext';
import { PageBackgroundProvider } from './context/PageBackgroundContext';
import { PageBackgroundLayer } from './components/layout/PageBackgroundLayer';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { ScrollToTop } from './components/utils/ScrollToTop';
import { RouteTransitionLoader } from './components/utils/RouteTransitionLoader';
import LoginModal from './components/auth/LoginModal';
import { ToastContainer } from './components/ui/Toast';
import { AppLoadingOverlay } from './components/ui/AppLoadingOverlay';
import { GlobalLoadingOverlay } from './components/ui/GlobalLoadingOverlay';
import { QuickActionsFab } from './components/layout/fab/QuickActionsFab';
import { BackofficeLayout } from './components/backoffice/BackofficeLayout';

// Découpage par route en chunks séparés : chaque page n'est
// téléchargée qu'au moment où l'on y navigue, et le <Suspense>
// ci-dessous affiche systématiquement AppLoadingOverlay pendant ce
// téléchargement (voir components/ui/LoadingBottle.tsx et
// store/loading.store.ts pour le reste du dispositif de chargement).
const HomePage = lazy(() => import('./pages/HomePage'));
const NewsListPage = lazy(() => import('./pages/NewsListPage'));
const NewsDetailPage = lazy(() => import('./pages/NewsDetailPage'));
const SondageFocusPage = lazy(() => import('./pages/SondageFocusPage'));
const SondagesListPage = lazy(() => import('./pages/SondagesListPage'));
const CreerNewsPage = lazy(() => import('./pages/CreerNewsPage'));
const CreerSondagePage = lazy(() => import('./pages/CreerSondagePage'));
const RecherchePage = lazy(() => import('./pages/RecherchePage'));
const ReelsDirectsPage = lazy(() => import('./pages/ReelsDirectsPage'));
const StatistiquesPage = lazy(() => import('./pages/StatistiquesPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfilPage = lazy(() => import('./pages/ProfilPage'));
const ParametresPage = lazy(() => import('./pages/ParametresPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const BackofficeListPage = lazy(() => import('./pages/admin/BackofficeListPage'));
const BackofficeRecordPage = lazy(() => import('./pages/admin/BackofficeRecordPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
// BackofficeLayout reste en import statique : export nommé (pas
// compatible React.lazy sans enrobage supplémentaire) et composant
// léger (garde de permission + <Outlet/>), le découper en chunk séparé
// n'aurait apporté aucun bénéfice perceptible.

export function App() {
  return (
    <ErrorBoundary>
      <PageBackgroundProvider>
        <SideContentProvider>
          <BrowserRouter>
            <ScrollToTop />
            <RouteTransitionLoader />
            {/* Plus de /auth/login, /auth/register ni /connexion dédiées : la
                connexion (strictement optionnelle, voir Header.tsx) se fait
                désormais via LoginModal, un popup global déclenchable depuis
                n'importe quelle page (topbar, ProfilPage...) sans navigation. */}
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
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/news" element={<NewsListPage />} />
                      <Route path="/news/creer" element={<CreerNewsPage />} />
                      {/* Page dédiée aux sondages existants (voir SondagesListPage.tsx) --
                          remplace l'ancien renvoi vers /news?type=sondage, qui affichait
                          les sondages comme de simples News génériques. */}
                      <Route path="/sondages" element={<SondagesListPage />} />
                      <Route path="/news/:slug/sondages/:sondageId" element={<SondageFocusPage />} />
                      <Route path="/news/:newsId/sondages/creer" element={<CreerSondagePage />} />
                      {/* Page détail dédiée (lien canonique/partageable) -- coexiste avec le
                          BottomSheet ouvert au clic sur une card (voir useOpenNewsDetail) */}
                      <Route path="/news/:slug" element={<NewsDetailPage />} />
  
                      {/* Redirects/Aliases for legacy /sujets URLs */}
                      <Route path="/sujets" element={<NewsListPage />} />
                      <Route path="/sujets/creer" element={<CreerNewsPage />} />
                      <Route path="/sujets/:slug/sondages/:sondageId" element={<SondageFocusPage />} />
                      <Route path="/sujets/:sujetId/sondages/creer" element={<CreerSondagePage />} />
                      <Route path="/sujets/:slug" element={<NewsDetailPage />} />
  
                      <Route path="/recherche" element={<RecherchePage />} />
                      <Route path="/reels" element={<ReelsDirectsPage />} />
                      <Route path="/statistiques" element={<StatistiquesPage />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/profil" element={<ProfilPage />} />
                      <Route path="/parametres" element={<ParametresPage />} />
                      {/* Backoffice « à la Django admin » — voir
                          src/components/backoffice/. Une seule paire de
                          pages génériques (BackofficeListPage /
                          BackofficeRecordPage) pilotée par le registre de
                          modèles dessert TOUTES les tables ; AdminDashboardPage
                          reste la page d'accueil du panneau (index).
                          PAS de route ":modelKey/nouveau" séparée : "nouveau"
                          littéral capté comme SEGMENT STATIQUE ne peuple
                          jamais le paramètre ":id" (useParams().id serait
                          undefined), cassant la détection isCreate côté
                          BackofficeRecordPage. ":modelKey/:id" gère déjà
                          correctement id="nouveau" comme n'importe quel
                          autre id. */}
                      <Route path="/admin" element={<BackofficeLayout />}>
                        <Route index element={<AdminDashboardPage />} />
                        <Route path=":modelKey" element={<BackofficeListPage />} />
                        <Route path=":modelKey/:id" element={<BackofficeRecordPage />} />
                      </Route>
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                    </Suspense>
                  </main>
                  <SideContent />
                </div>
                </div>
              </Header>
              <MobileDock />
            </div>
            <LoginModal />
            <ToastContainer />
            <QuickActionsFab />
            <GlobalLoadingOverlay />
          </BrowserRouter>
        </SideContentProvider>
      </PageBackgroundProvider>
    </ErrorBoundary>
  );
}

export default App;
