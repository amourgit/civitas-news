// ============================================================
// src/services/api/repositories/httpClient.ts
// Instance HTTP unique (Get/Post/Update/Delete) partagée par tous
// les repositories, configurée avec l'URL de base de l'API.
// ============================================================

import { HttpServiceFactory } from '../HttpServiceFactory';
import { env } from '../../../config/env';

export const http = HttpServiceFactory.createCompleteHttpService(env.apiBaseUrl);
