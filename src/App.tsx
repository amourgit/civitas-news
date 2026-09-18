import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { SideContentProvider } from './context/SideContentContext';
import { TopbarSlotsProvider } from './context/TopbarSlotsContext';
import { PageBackgroundProvider } from './context/PageBackgroundContext';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { ScrollToTop } from './components/utils/ScrollToTop';
import { RouteTransitionLoader } from './components/utils/RouteTransitionLoader';
import LoginModal from './components/auth/LoginModal';
import { ToastContainer } from './components/ui/Toast';
import { AppLoadingOverlay } from './components/ui/AppLoadingOverlay';
import { GlobalLoadingOverlay } from './components/ui/GlobalLoadingOverlay';
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
const CreerOrganisationPage = lazy(() => import('./pages/CreerOrganisationPage'));
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
          <TopbarSlotsProvider>
            <BrowserRouter>
              <ScrollToTop />
              <RouteTransitionLoader />
              {/* Plus de /auth/login, /auth/register ni /connexion dédiées : la
                  connexion (strictement optionnelle, voir Header.tsx) se fait
                  désormais via LoginModal, un popup global déclenchable depuis
                  n'importe quelle page (topbar, ProfilPage...) sans navigation. */}
              <Routes>
                {/* Disposition normale de l'app (topbar + colonne latérale +
                    dock mobile + fond de page par défaut, voir MainLayout) --
                    route parente SANS path : toutes les routes ci-dessous
                    héritent de ce chrome via <Outlet/>. */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/news" element={<NewsListPage />} />
                  <Route path="/news/creer" element={<CreerNewsPage />} />
                  <Route path="/news/modifier/:id" element={<CreerNewsPage />} />
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
                </Route>

                {/* Formulaire de création d'organisation : identité visuelle
                    entièrement dédiée (voir CreerOrganisationPage.tsx), affiché
                    SANS topbar, SANS dock, SANS colonne latérale -- route SŒUR
                    de <MainLayout> (et non son enfant), volontairement en
                    dehors de tout son chrome : uniquement le formulaire. */}
                <Route
                  path="/organisations/creer"
                  element={
                    <Suspense fallback={<AppLoadingOverlay visible label="Chargement de la page…" />}>
                      <CreerOrganisationPage />
                    </Suspense>
                  }
                />
              </Routes>
              <LoginModal />
              <ToastContainer />
              <GlobalLoadingOverlay />
            </BrowserRouter>
          </TopbarSlotsProvider>
        </SideContentProvider>
      </PageBackgroundProvider>
    </ErrorBoundary>
  );
}

export default App;
