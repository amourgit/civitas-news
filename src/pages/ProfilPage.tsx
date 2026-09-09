import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useUiStore } from '../store/ui.store';
import { useMesStatistiques } from '../features/statistiques/hooks/useMesStatistiques';
import { toast } from '../hooks/useToast';
import { ConfirmDialog } from '../components/backoffice/ConfirmDialog';
import { formatDateRelative } from '../lib/formatDate';
import type { ActiviteRecenteProfil } from '../types/global.types';
import {
  Search,
  Settings,
  Share2,
  LogOut,
  MessageSquare,
  Vote,
  Heart,
  FileText,
  Flame,
  Newspaper,
  ShieldCheck,
  User as UserIcon,
  LogIn,
} from 'lucide-react';

// ============================================================
// src/pages/ProfilPage.tsx
//
// Reprend la mise en page de la maquette fournie (avatar + salutation,
// barre de recherche, groupes de puces libellées, grille de contenus
// favoris façon affiches) : les DIVS qui structurent les sections n'ont
// délibérément ni fond ni bordure -- seuls les éléments qui, dans la
// maquette elle-même, portent un remplissage propre (champ de recherche,
// puces colorées, cartes-affiches) en conservent un ici. Tout le reste
// s'appuie sur les variables CSS du thème (--civitas-*, voir index.css)
// pour rester cohérent en clair comme en sombre.
//
// Plus aucune donnée mock : l'unique source de données est
// GET /statistiques/v1/moi/ (useMesStatistiques) pour tout ce qui est
// statistique/activité, et useAuthStore().user (GET /users/v1/users/me/)
// pour l'identité. Aucun tableau fabriqué localement.
// ============================================================

const ROLE_LABELS: Record<string, string> = {
  etudiant: 'Étudiant',
  moderateur: 'Modérateur',
  administrateur: 'Administrateur',
  organisation: 'Organisation',
  anonyme: 'Anonyme',
};

const STATUT_SONDAGE_LABELS: Record<string, string> = {
  actif: 'En cours',
  programme: 'Programmé',
  termine: 'Terminé',
  archive: 'Archivé',
};

const STATUT_SONDAGE_COULEURS: Record<string, string> = {
  actif: '#10B981',
  programme: '#F59E0B',
  termine: '#6B7280',
  archive: '#9CA3AF',
};

const ACTIVITE_PREFIXES: Record<ActiviteRecenteProfil['type'], string> = {
  commentaire: 'Vous avez commenté',
  reaction: 'Vous avez réagi à',
  vote: 'Vous avez voté sur',
  publication: 'Vous avez publié',
};

function IconeActivite({ type }: { type: ActiviteRecenteProfil['type'] }) {
  const commun = 'w-3.5 h-3.5 sm:w-4 sm:h-4';
  switch (type) {
    case 'commentaire':
      return <MessageSquare className={commun} />;
    case 'reaction':
      return <Heart className={commun} />;
    case 'vote':
      return <Vote className={commun} />;
    case 'publication':
      return <FileText className={commun} />;
    default:
      return <Newspaper className={commun} />;
  }
}

/** Puce sobre (bordure fine, fond transparent) -- reprend le style des
 * puces "I watch" de la maquette : jamais de fond plein au repos. */
function PuceEngagement({
  icon,
  label,
  valeur,
}: {
  icon: React.ReactNode;
  label: string;
  valeur: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-gray-300/80 dark:border-white/15 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-200">
      {icon}
      {label}
      <span className="font-black text-gray-900 dark:text-white">{valeur}</span>
    </span>
  );
}

/** Puce colorée -- même formule que CategoryTagsWidget
 * (features/news/components/detail/sidebar/CategoryTagsWidget.tsx) :
 * couleur/couleur+40/couleur+14 déjà en base côté Categorie, jamais de
 * couleur inventée côté frontend. */
function PuceCategorie({ nom, couleur, score }: { nom: string; couleur: string; score: number }) {
  return (
    <Link
      to={`/recherche?q=${encodeURIComponent(nom)}`}
      className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold transition-transform hover:scale-[1.03]"
      style={{ color: couleur, backgroundColor: `${couleur}14`, borderColor: `${couleur}40`, borderWidth: 1 }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: couleur }} />
      {nom}
      <span className="opacity-70">· {score}</span>
    </Link>
  );
}

function TitreSection({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] sm:text-[11px] lg:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2.5 sm:mb-3">
      {children}
    </p>
  );
}

function EtatVide({ children }: { children: React.ReactNode }) {
  return <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 italic">{children}</p>;
}

function StatTuile({ valeur, label }: { valeur: number; label: string }) {
  return (
    <div>
      <p className="text-xl sm:text-2xl lg:text-3xl font-black text-[var(--civitas-purple,#5B4DFF)]">{valeur}</p>
      <p className="text-[10px] sm:text-[11px] lg:text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
        {label}
      </p>
    </div>
  );
}

export default function ProfilPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openLoginModal } = useUiStore();
  const { stats, error: erreurStats } = useMesStatistiques();

  const [recherche, setRecherche] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Ne rejette jamais (voir useAuthStore().logout() dans auth.store.ts) :
      // même si la révocation serveur échoue, la session locale est
      // toujours effacée -- donc pas de branche d'erreur ici.
      await logout();
      toast('success', 'Déconnexion effectuée.', 'À bientôt sur CIVITAS !');
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
      navigate('/');
    }
  };

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast('success', 'Lien du profil copié dans le presse-papier !');
    } else {
      toast('info', 'Profil CIVITAS de ' + user.nomAffiche);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const q = recherche.trim();
    if (q) navigate(`/recherche?q=${encodeURIComponent(q)}`);
  };

  // --------------------------------------------------------------
  // Visiteur non authentifié : la page Profil n'a de sens que pour un
  // compte connecté -- aucune statistique/activité fictive à afficher à
  // sa place, juste l'invitation à se connecter.
  // --------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24 text-center space-y-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto flex items-center justify-center bg-[var(--civitas-purple,#5B4DFF)]/10 text-[var(--civitas-purple,#5B4DFF)]">
          <UserIcon className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">Vous n'êtes pas connecté</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Connectez-vous pour retrouver votre profil, vos statistiques d'engagement et vos contenus favoris.
        </p>
        <button
          type="button"
          onClick={openLoginModal}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white bg-[var(--civitas-purple,#5B4DFF)] hover:opacity-90 transition-opacity"
        >
          <LogIn className="w-4 h-4" />
          Se connecter
        </button>
      </div>
    );
  }

  const sousTitre = [user.role && user.role !== 'anonyme' ? ROLE_LABELS[user.role] : null, user.etablissement]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="max-w-2xl lg:max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 lg:py-8 pb-24 space-y-6 sm:space-y-8 lg:space-y-10">
      {/* ============ En-tête : avatar + salutation ============ */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5 flex items-center justify-center ring-2 ring-[var(--civitas-purple,#5B4DFF)]/20">
            {user.avatar ? (
              <img src={user.avatar} alt={user.nomAffiche} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-9 lg:h-9 text-gray-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-medium italic text-gray-500 dark:text-gray-400">
              Salut, je suis
            </p>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-1.5 truncate">
              {user.nomAffiche}
              {user.role === 'administrateur' && (
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0" />
              )}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 truncate">
              @{user.username}
              {sousTitre && <span className="font-normal"> · {sousTitre}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 pt-1 shrink-0">
          <button
            type="button"
            onClick={handleShareProfile}
            title="Partager le profil"
            className="p-2 sm:p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <Share2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </button>
          <Link
            to="/parametres"
            title="Paramètres"
            className="p-2 sm:p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <Settings className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </Link>
        </div>
      </div>

      {/* ============ Recherche ============ */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          type="search"
          placeholder="Rechercher une actualité, un sondage, un sujet…"
          className="w-full bg-gray-100 dark:bg-white/[0.06] focus:bg-gray-200/70 dark:focus:bg-white/[0.1] rounded-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 outline-none transition-colors"
        />
      </form>

      {/* ============ Mon engagement (données réelles, jamais 0 fictif) ============ */}
      <section>
        <TitreSection>Mon engagement</TitreSection>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <PuceEngagement icon={<MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} label="Commentaires" valeur={stats?.contributions.commentaires ?? 0} />
          <PuceEngagement icon={<Vote className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} label="Votes sondages" valeur={stats?.interactions.votesSondages ?? 0} />
          <PuceEngagement
            icon={<Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            label="Réactions données"
            valeur={(stats?.interactions.reactionsNews ?? 0) + (stats?.interactions.reactionsCommentaires ?? 0)}
          />
          <PuceEngagement icon={<FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} label="Publications" valeur={stats?.contributions.news ?? 0} />
        </div>
      </section>

      {/* ============ Mes thématiques favorites ============ */}
      <section>
        <TitreSection>Mes thématiques favorites</TitreSection>
        {stats && stats.topCategories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {stats.topCategories.map((cat) => (
              <PuceCategorie key={cat.id} nom={cat.nom} couleur={cat.couleur} score={cat.score} />
            ))}
          </div>
        ) : (
          <EtatVide>Commentez, votez ou réagissez pour faire émerger vos thématiques favorites.</EtatVide>
        )}
      </section>

      {/* ============ Mes contenus favoris (façon affiches) ============ */}
      <section>
        <TitreSection>Mes contenus favoris</TitreSection>
        {stats && stats.favoris.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.favoris.map((fav) => (
              <Link key={fav.id} to={`/news/${fav.slug}`} className="group block">
                <div className="relative aspect-[2/3] rounded-sm sm:rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5">
                  {fav.image ? (
                    <img
                      src={fav.image}
                      alt={fav.titre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="w-7 h-7 sm:w-8 sm:h-8 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-black/10" />
                  {fav.categorieNom && (
                    <span
                      className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold backdrop-blur-sm"
                      style={{ color: fav.categorieCouleur, backgroundColor: `${fav.categorieCouleur}35` }}
                    >
                      {fav.categorieNom}
                    </span>
                  )}
                  <span className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[9px] sm:text-[11px] font-bold">
                    <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                    {fav.scoreEngagement}
                  </span>
                  <span className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/60 backdrop-blur-sm">
                    <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-rose-500 text-rose-500" />
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] sm:text-xs font-bold text-gray-900 dark:text-white line-clamp-2">
                  {fav.titre}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EtatVide>Réagissez avec ❤️ à une actualité pour la retrouver ici.</EtatVide>
        )}
      </section>

      {/* ============ Mes votes récents ============ */}
      <section>
        <TitreSection>Mes votes récents</TitreSection>
        {stats && stats.votesRecents.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {stats.votesRecents.map((vote) => {
              const couleur = STATUT_SONDAGE_COULEURS[vote.statut] ?? '#9CA3AF';
              return (
                <Link
                  key={vote.sondageId}
                  to={vote.newsSlug ? `/news/${vote.newsSlug}` : '#'}
                  className="flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-[var(--civitas-purple,#5B4DFF)] transition-colors">
                      {vote.sondageTitre}
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                      {vote.choix.join(', ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400">
                      {formatDateRelative(vote.date)}
                    </p>
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold"
                      style={{ color: couleur, backgroundColor: `${couleur}18` }}
                    >
                      {STATUT_SONDAGE_LABELS[vote.statut] ?? vote.statut}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EtatVide>Participez à un sondage pour le retrouver ici.</EtatVide>
        )}
      </section>

      {/* ============ Activité récente ============ */}
      <section>
        <TitreSection>Activité récente</TitreSection>
        {stats && stats.activiteRecente.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {stats.activiteRecente.map((ev, index) => (
              <Link
                key={`${ev.type}-${index}`}
                to={ev.newsSlug ? `/news/${ev.newsSlug}` : '#'}
                className="flex items-start gap-2.5 sm:gap-3 group"
              >
                <span className="mt-0.5 shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-[var(--civitas-purple,#5B4DFF)]/10 text-[var(--civitas-purple,#5B4DFF)]">
                  <IconeActivite type={ev.type} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 group-hover:text-[var(--civitas-purple,#5B4DFF)] transition-colors line-clamp-2">
                    {ACTIVITE_PREFIXES[ev.type]} <span className="font-bold text-gray-900 dark:text-white">{ev.titre}</span>
                  </p>
                  {ev.extrait && (
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                      {ev.extrait}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">{formatDateRelative(ev.date)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EtatVide>Vos actions récentes (commentaires, votes, réactions, publications) apparaîtront ici.</EtatVide>
        )}
      </section>

      {/* ============ Engagement reçu ============ */}
      <section>
        <TitreSection>Engagement reçu sur mes contributions</TitreSection>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <StatTuile valeur={stats?.engagementRecu.reactions ?? 0} label="Réactions reçues" />
          <StatTuile valeur={stats?.engagementRecu.commentaires ?? 0} label="Commentaires reçus" />
          <StatTuile valeur={stats?.engagementRecu.vues ?? 0} label="Vues cumulées" />
        </div>
      </section>

      {/* ============ Badges ============ */}
      {user.badges.length > 0 && (
        <section>
          <TitreSection>Badges</TitreSection>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {user.badges.map((badge) => (
              <span
                key={badge.id}
                title={badge.description}
                className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 px-2.5 py-1 text-[11px] sm:text-xs font-bold"
              >
                <span>{badge.icone}</span>
                {badge.nom}
              </span>
            ))}
          </div>
        </section>
      )}

      {erreurStats && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Certaines statistiques n'ont pas pu être chargées pour le moment.
        </p>
      )}

      {/* ============ Déconnexion (discrète, en fin de page) ============ */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Se déconnecter
        </button>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Se déconnecter"
        description="Vous serez déconnecté de votre session sur cet appareil. Vous pourrez vous reconnecter à tout moment."
        confirmLabel="Se déconnecter"
        isLoading={isLoggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
