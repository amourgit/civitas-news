// ============================================================
// src/features/news/creation/newsTypeIcons.ts
// Une icône par format de News (NEWS_TYPE_OPTIONS, voir
// constants/newsFieldOptions.ts) -- utilisée UNIQUEMENT par le champ
// "Format" de l'assistant de création (chip + popover), jamais semée
// ailleurs dans l'app. Un seul point d'entrée pour ne pas avoir à
// resynchroniser la liste si un format est ajouté côté backend.
// ============================================================

import {
  FolderKanban, CalendarDays, Megaphone, Vote, MessagesSquare,
  FileSignature, Info, Landmark, Lightbulb, Presentation, Users,
  Wrench, HandHeart, Newspaper, BookOpen, Rss, type LucideIcon,
} from 'lucide-react';
import type { NewsType } from '../../../types/global.types';

export const NEWS_TYPE_ICONS: Record<NewsType, LucideIcon> = {
  projet: FolderKanban,
  evenement: CalendarDays,
  annonce: Megaphone,
  sondage: Vote,
  consultation: MessagesSquare,
  petition: FileSignature,
  information: Info,
  reforme: Landmark,
  idee: Lightbulb,
  conference: Presentation,
  reunion: Users,
  atelier: Wrench,
  appel_participation: HandHeart,
  article: Newspaper,
  publication: BookOpen,
  actualite: Rss,
};

/** Formats pour lesquels une fenêtre temporelle (dateDebut/dateFin) a du sens -- sert à mettre le champ "Dates" en avant sans le rendre obligatoire pour autant. */
export const DATED_NEWS_TYPES: NewsType[] = [
  'evenement', 'conference', 'reunion', 'atelier', 'appel_participation', 'consultation',
];
