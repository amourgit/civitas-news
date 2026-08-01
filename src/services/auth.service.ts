import { Utilisateur } from '../types/global.types';
import { apiClient, setAuthToken } from './api.client';

export interface AuthResponse {
  user: Utilisateur;
  token: string;
}

export interface GoogleAuthPayload {
  credential?: string;
  email?: string;
  name?: string;
  picture?: string;
  googleId?: string;
}

export const authBackendService = {
  /**
   * Effectue une requête POST vers le backend `/api/auth/google` pour valider le jeton Google OAuth.
   */
  loginWithGoogleBackend: async (payload: GoogleAuthPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/google', payload);
    if (response?.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  /**
   * Effectue une requête POST vers le backend `/api/auth/login` avec identifiants.
   */
  loginWithCredentialsBackend: async (email: string, pass: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password: pass });
    if (response?.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  /**
   * Enregistre un nouvel utilisateur sur le backend via `/api/auth/register`.
   */
  registerBackend: async (data: {
    nomAffiche: string;
    email: string;
    password: string;
    etablissement?: string;
    role?: string;
  }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    if (response?.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  /**
   * Récupère le profil de l'utilisateur actuellement authentifié sur le backend `/api/auth/me`.
   */
  getCurrentUserBackend: async (): Promise<Utilisateur> => {
    return apiClient.get<Utilisateur>('/auth/me');
  },

  /**
   * Signale la déconnexion au serveur backend `/api/auth/logout`.
   */
  logoutBackend: async (): Promise<{ success: boolean }> => {
    try {
      await apiClient.post<{ success: boolean }>('/auth/logout');
    } catch (e) {
      // Ignorer l'échec réseau lors de la déconnexion
    } finally {
      setAuthToken(null);
    }
    return { success: true };
  },
};
