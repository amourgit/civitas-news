import { toast } from '../hooks/useToast';

/**
 * Force un vrai téléchargement navigateur pour un fichier distant, y
 * compris cross-origin (S3, Render...) où l'attribut HTML `download`
 * d'un <a href={url}> classique est ignoré par le navigateur (le lien
 * est alors simplement ouvert/navigué au lieu d'être téléchargé).
 *
 * Stratégie : fetch -> blob -> URL.createObjectURL -> clic synthétique
 * sur un <a download> pointant vers ce blob: -- un blob: est toujours
 * same-origin du point de vue du navigateur, donc `download` y est
 * toujours respecté, quelle que soit l'origine réelle du fichier.
 *
 * Repli si le fetch échoue (CORS non permissif, hors-ligne...) : ouvre
 * l'URL d'origine dans un nouvel onglet plutôt que de laisser
 * l'utilisateur sans rien -- le navigateur télécharge ou affiche selon
 * les en-têtes du serveur.
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Laisse le temps au navigateur d'amorcer le téléchargement avant de
    // libérer la mémoire du blob.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
    toast(
      'info',
      'Téléchargement indisponible',
      "Le fichier s'est ouvert dans un nouvel onglet à la place."
    );
  }
}
