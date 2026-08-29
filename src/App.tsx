import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { SideContent } from './components/layout/SideContent';
import { SideContentProvider } from './context/SideContentContext';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { ScrollToTop } from './components/utils/ScrollToTop';
import LoginModal from './components/auth/LoginModal';
import { ToastContainer } from './components/ui/Toast';

import HomePage from './pages/HomePage';
import NewsListPage from './pages/NewsListPage';
import SondageFocusPage from './pages/SondageFocusPage';
import CreerNewsPage from './pages/CreerNewsPage';
import CreerSondagePage from './pages/CreerSondagePage';
import RecherchePage from './pages/RecherchePage';
import StatistiquesPage from './pages/StatistiquesPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilPage from './pages/ProfilPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import BackofficeListPage from './pages/admin/BackofficeListPage';
import BackofficeRecordPage from './pages/admin/BackofficeRecordPage';
import { BackofficeLayout } from './components/backoffice/BackofficeLayout';
import NotFoundPage from './pages/NotFoundPage';

export function App() {
  return (
    <ErrorBoundary>
      <SideContentProvider>
        <BrowserRouter>
          <ScrollToTop />
          {/* Plus de /auth/login, /auth/register ni /connexion dédiées : la
              connexion (strictement optionnelle, voir Header.tsx) se fait
              désormais via LoginModal, un popup global déclenchable depuis
              n'importe quelle page (topbar, ProfilPage...) sans navigation. */}
          <div className="min-h-screen flex flex-col bg-[#F7F8FC] dark:bg-[#0E1338] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />
            <div className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 pt-2 sm:pt-4 pb-12 md:pb-6 flex items-start gap-6">
              <main className="flex-1 min-w-0 w-full">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/news" element={<NewsListPage />} />
                  <Route path="/news/creer" element={<CreerNewsPage />} />
                  <Route path="/news/:slug/sondages/:sondageId" element={<SondageFocusPage />} />
                  <Route path="/news/:newsId/sondages/creer" element={<CreerSondagePage />} />

                  {/* Redirects/Aliases for legacy /sujets URLs */}
                  <Route path="/sujets" element={<NewsListPage />} />
                  <Route path="/sujets/creer" element={<CreerNewsPage />} />
                  <Route path="/sujets/:slug/sondages/:sondageId" element={<SondageFocusPage />} />
                  <Route path="/sujets/:sujetId/sondages/creer" element={<CreerSondagePage />} />

                  <Route path="/recherche" element={<RecherchePage />} />
                  <Route path="/statistiques" element={<StatistiquesPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/profil" element={<ProfilPage />} />
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
              </main>
              <SideContent />
            </div>
            <Footer />
            <BottomNav />
          </div>
          <LoginModal />
          <ToastContainer />
        </BrowserRouter>
      </SideContentProvider>
    </ErrorBoundary>
  );
}

export default App;
