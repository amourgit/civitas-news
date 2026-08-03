export type NewsType =
  | 'projet'
  | 'evenement'
  | 'annonce'
  | 'sondage'
  | 'consultation'
  | 'petition'
  | 'information'
  | 'reforme'
  | 'idee'
  | 'conference'
  | 'reunion'
  | 'atelier'
  | 'appel_participation'
  | 'article'
  | 'publication'
  | 'actualite';

// Alias for backwards compatibility if needed
export type SujetType = NewsType;

export type TypeReaction = 'coeur' | 'jaime' | 'bravo' | 'youpi' | 'wow' | 'jaimepas';

export interface NewsStats {
  vues: number;
  commentaires: number;
  reactions: Record<TypeReaction, number>;
  votes: number;
  partages: number;
}

export type SujetStats = NewsStats;

export interface ChoixSondage {
  id: string;
  libelle: string;
  image?: string;
  nombreVotes: number;
  pourcentage: number;
}

export interface Sondage {
  id: string;
  newsId: string;
  sujetId?: string;
  titre: string;
  description?: string;
  question: string;
  image?: string;
  choix: ChoixSondage[];
  dateDebut: string;
  dateFin: string;
  typeVote: 'unique' | 'multiple';
  anonymat: boolean;
  visibiliteResultat: 'instantane' | 'masque_jusqua_fin';
  statut: 'actif' | 'programme' | 'termine' | 'archive';
  totalVotes: number;
  userVotedChoiceIds?: string[];
}

export type NewsMediaType = 'image' | 'video' | 'youtube' | 'audio' | 'document';
export type SujetMediaType = NewsMediaType;

export interface NewsMediaItem {
  id: string;
  type: NewsMediaType;
  url: string;
  thumbnail?: string;
  titre: string;
  description?: string;
  duree?: string;
  vues?: number;
  date?: string;
}

export type SujetMediaItem = NewsMediaItem;

export interface DocumentJoint {
  id: string;
  nom: string;
  url: string;
  taille: number; // in bytes
  type: string;
}

export interface MediaJoint {
  id: string;
  type: 'image' | 'gif' | 'audio' | 'video' | 'document';
  url: string;
}

export interface Badge {
  id: string;
  nom: string;
  icone: string;
  description: string;
}

export type RoleUtilisateur = 'anonyme' | 'etudiant' | 'moderateur' | 'administrateur' | 'organisation';

export interface Utilisateur {
  id: string;
  username: string;
  nomAffiche: string;
  avatar?: string;
  role: RoleUtilisateur;
  etablissement?: string;
  email?: string;
  badges: Badge[];
  stats: {
    contributions: number;
    votes: number;
    commentaires: number;
  };
}

export interface Organisation {
  id: string;
  nom: string;
  logo?: string;
  type: string;
  description?: string;
}

export interface Etablissement {
  id: string;
  nom: string;
  province: string;
}

export interface Categorie {
  id: string;
  nom: string;
  couleur: string;
  icone: string;
}

export interface Commentaire {
  id: string;
  newsId: string;
  sujetId?: string;
  auteur: Utilisateur;
  typeContenu?: 'texte' | 'audio';
  audioUrl?: string;
  audioDuration?: number; // duration in seconds
  contenu: string;
  media?: MediaJoint[];
  reponseA?: string; // id du commentaire parent
  mentions?: string[];
  reactions: Record<string, number>;
  userReactions?: string[];
  votes: number;
  userVoteStatus?: 'up' | 'down' | null;
  estEpingle: boolean;
  estReponseAcceptee: boolean;
  estAdministrateur: boolean;
  createdAt: string;
}

export interface LienScope {
  etablissement?: string;
  province?: string;
  promotion?: string;
  organisation?: string;
  classe?: string;
}

export interface LienPublication {
  id: string;
  newsId: string;
  sujetId?: string;
  urlPublique: string;
  urlCourte?: string;
  qrCode?: string;
  visibilite: 'public' | 'prive' | 'limite';
  motDePasse?: boolean;
  expiration?: string;
  usageUnique?: boolean;
  scope?: LienScope;
  clics?: number;
  scans?: number;
  createdAt: string;
}

export interface News {
  id: string;
  slug: string;
  type: NewsType;
  titre: string;
  description: string;
  contenu?: string;
  image: string;
  galerie?: string[];
  auteur: Utilisateur;
  organisation?: Organisation;
  etablissement?: Etablissement;
  categorie: Categorie;
  tags: string[];
  province?: string;
  lieu?: string;
  dateDebut?: string;
  dateFin?: string;
  createdAt: string;
  updatedAt: string;
  statut: 'brouillon' | 'publie' | 'archive' | 'signale';
  visibilite: 'public' | 'prive' | 'limite';
  stats: NewsStats;
  sondages: Sondage[];
  documents?: DocumentJoint[];
  medias?: NewsMediaItem[];
  lienPublication?: LienPublication;
  userReaction?: TypeReaction | null;
}

// Alias Sujet to News
export type Sujet = News;

export interface NotificationAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'purple' | 'pink' | 'blue' | 'success' | 'warning';
  actionKey: string;
  url?: string;
  toastTitle?: string;
  toastMessage?: string;
  toastType?: 'success' | 'warning' | 'info' | 'error' | 'purple';
}

export type NotificationFormat =
  | 'actualite'
  | 'sondage'
  | 'annonce'
  | 'alerte'
  | 'consultation'
  | 'decision'
  | 'reforme'
  | 'rapport';

export interface NotificationItem {
  id: string;
  format: NotificationFormat;
  titre: string;
  description: string;
  categorie: {
    nom: string;
    couleur: string;
    icone?: string;
  };
  lien: string;
  lu: boolean;
  createdAt: string;
  tag?: string; // e.g. 'RÉF-2026-01', 'TN38'
  urgente?: boolean;
  categoryTab?: 'all' | 'direct' | 'news' | 'sondages' | 'alertes';
  notice?: string;
  actions?: NotificationAction[];

  // Backwards compatibility optional fields
  type?: string;
  contenu?: string;
  auteur?: {
    nom: string;
    avatar?: string;
  };
  badgeType?: 'comment' | 'goal' | 'rejected' | 'invite' | 'review' | 'push' | 'mention';
  workedTime?: string;
}

export interface Signalement {
  id: string;
  typeContenu: 'news' | 'sujet' | 'commentaire' | 'utilisateur' | 'sondage';
  contenuId: string;
  titreOuApercu: string;
  motif: 'spam' | 'propos_inappropries' | 'desinformation' | 'harcelement' | 'autre';
  description?: string;
  auteurSignalement: Utilisateur;
  statut: 'en_attente' | 'traite' | 'rejete';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  utilisateur: string;
  cible: string;
  horodatage: string;
  adresseIP: string;
}
