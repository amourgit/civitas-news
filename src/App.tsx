import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { SideContent } from './components/layout/SideContent';
import { SideContentProvider } from './context/SideContentContext';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { ScrollToTop } from './components/utils/ScrollToTop';

import HomePage from './pages/HomePage';
import NewsListPage from './pages/NewsListPage';
import NewsDetailPage from './pages/NewsDetailPage';
import SondageFocusPage from './pages/SondageFocusPage';
import CreerNewsPage from './pages/CreerNewsPage';
import CreerSondagePage from './pages/CreerSondagePage';
import RecherchePage from './pages/RecherchePage';
import StatistiquesPage from './pages/StatistiquesPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

export function App() {
  return (
    <ErrorBoundary>
      <SideContentProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col bg-[#F7F8FC] dark:bg-[#0E1338] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />
            <div className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 pt-2 sm:pt-4 pb-12 md:pb-6 flex items-start gap-6">
              <main className="flex-1 min-w-0 w-full">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/news" element={<NewsListPage />} />
                  <Route path="/news/creer" element={<CreerNewsPage />} />
                  <Route path="/news/:slug" element={<NewsDetailPage />} />
                  <Route path="/news/:slug/sondages/:sondageId" element={<SondageFocusPage />} />
                  <Route path="/news/:newsId/sondages/creer" element={<CreerSondagePage />} />
                  
                  {/* Redirects/Aliases for legacy /sujets URLs */}
                  <Route path="/sujets" element={<NewsListPage />} />
                  <Route path="/sujets/creer" element={<CreerNewsPage />} />
                  <Route path="/sujets/:slug" element={<NewsDetailPage />} />
                  <Route path="/sujets/:slug/sondages/:sondageId" element={<SondageFocusPage />} />
                  <Route path="/sujets/:sujetId/sondages/creer" element={<CreerSondagePage />} />

                  <Route path="/recherche" element={<RecherchePage />} />
                  <Route path="/statistiques" element={<StatistiquesPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/admin/*" element={<AdminDashboardPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <SideContent />
            </div>
            <Footer />
            <BottomNav />
          </div>
        </BrowserRouter>
      </SideContentProvider>
    </ErrorBoundary>
  );
}

export default App;
