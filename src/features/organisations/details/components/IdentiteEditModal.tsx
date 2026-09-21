// ============================================================
// Édition de l'identité publique (nom, description, logo) de
// l'organisation COURANTE. N'est monté que si le parent a vérifié
// ORGANISATION_IDENTITE_EDIT ; le hook le revérifie avant l'appel.
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { toast } from '../../../../hooks/useToast';
import type { Tenant, TenantIdentiteUpdatePayload } from '../../../../services/api/repositories/tenants.repository';

const LOGO_MAX_MO = 5; // identique au backend (LOGO_TAILLE_MAX_MO)
const DESCRIPTION_MAX = 2000;

interface Props {
  tenant: Tenant;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: TenantIdentiteUpdatePayload) => Promise<unknown>;
}

export const IdentiteEditModal: React.FC<Props> = ({ tenant, isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(tenant.name);
    setDescription(tenant.description ?? '');
    setLogoFile(null);
    setRemoveLogo(false);
    setError(null);
  }, [isOpen, tenant]);

  useEffect(() => {
    if (!logoFile) return setPreview(null);
    const url = URL.createObjectURL(logoFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const pickLogo = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Le logo doit être une image.');
    if (file.size > LOGO_MAX_MO * 1024 * 1024) return setError(`Le logo ne doit pas dépasser ${LOGO_MAX_MO} Mo.`);
    setError(null);
    setLogoFile(file);
    setRemoveLogo(false);
  };

  const shownLogo = removeLogo ? null : (preview ?? tenant.logo ?? null);

  const submit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return setError('Le nom de l’organisation est requis.');
    if (description.length > DESCRIPTION_MAX) return setError(`La description ne doit pas dépasser ${DESCRIPTION_MAX} caractères.`);

    // PATCH minimal : uniquement ce qui a changé.
    const payload: TenantIdentiteUpdatePayload = {};
    if (trimmedName !== tenant.name) payload.name = trimmedName;
    if (description.trim() !== (tenant.description ?? '')) payload.description = description.trim();
    if (logoFile) payload.logo = logoFile;
    else if (removeLogo && tenant.logo) payload.logo = null;
    if (!Object.keys(payload).length) return onClose();

    setSaving(true);
    try {
      await onSave(payload);
      toast('success', 'Identité mise à jour', trimmedName);
      onClose();
    } catch {
      setError('Enregistrement impossible. Vérifiez les champs puis réessayez.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={saving ? () => undefined : onClose} title="Modifier l’identité de l’organisation" maxWidth="md">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="gradient-brand relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
            {shownLogo ? <img src={shownLogo} alt="Logo" className="absolute inset-0 h-full w-full object-cover" /> : <ImagePlus className="h-7 w-7 text-white/90" />}
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => pickLogo(e.target.files?.[0])} />
            <Button variant="secondary" size="sm" icon={<ImagePlus className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
              {shownLogo ? 'Changer le logo' : 'Ajouter un logo'}
            </Button>
            {shownLogo && (
              <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => { setLogoFile(null); setRemoveLogo(true); }}>
                Retirer
              </Button>
            )}
          </div>
        </div>

        <Input label="Nom de l’organisation" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />

        <label className="block">
          <span className="mb-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Description</span>
            <span className="tabular-nums">{description.length}/{DESCRIPTION_MAX}</span>
          </span>
          <textarea
            rows={4}
            maxLength={DESCRIPTION_MAX}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-[#5B4DFF] focus:outline-none dark:border-white/20 dark:text-white"
          />
        </label>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button size="sm" onClick={submit} isLoading={saving}>Enregistrer</Button>
        </div>
      </div>
    </Modal>
  );
};
