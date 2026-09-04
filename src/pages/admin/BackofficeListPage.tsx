// ============================================================
// src/pages/admin/BackofficeListPage.tsx
// ============================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { BackofficeDataTable } from '../../components/backoffice/BackofficeDataTable';
import { ConfirmDialog } from '../../components/backoffice/ConfirmDialog';
import { getModel } from '../../components/backoffice/registry';
import { usePermissions } from '../../lib/permissions/usePermissions';
import { toast } from '../../hooks/useToast';

export default function BackofficeListPage() {
  const { modelKey } = useParams<{ modelKey: string }>();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const model = getModel(modelKey);

  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Record<string, unknown> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(() => {
    if (!model) return;
    setIsLoading(true);
    setLoadError(null);
    model.data
      .list()
      .then((data) => setRecords(data as Record<string, unknown>[]))
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Chargement impossible.'))
      .finally(() => setIsLoading(false));
  }, [model]);

  useEffect(() => {
    load();
  }, [load]);

  if (!model) {
    return <Navigate to="/admin" replace />;
  }

  const canManage = can(model.managePermission ?? model.viewPermission ?? ('backoffice:access' as never));

  const handleDelete = async () => {
    if (!pendingDelete || !model.data.remove) return;
    setIsDeleting(true);
    try {
      await model.data.remove(String(pendingDelete.id));
      toast('success', `${model.labelSingular} supprimé(e)`);
      setPendingDelete(null);
      load();
    } catch (err) {
      toast('error', 'Échec de la suppression', err instanceof Error ? err.message : undefined);
    } finally {
      setIsDeleting(false);
    }
  };

  /** Fusionne l'enregistrement renvoyé par l'API après une édition en
   * ligne (voir BackofficeDataTable/BackofficeEditableCell) dans la
   * liste locale, sans recharger toute la table. */
  const handleRecordUpdated = (updated: Record<string, unknown>) => {
    setRecords((prev) => prev.map((r) => (String(r.id) === String(updated.id) ? updated : r)));
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white font-display">{model.labelPlural}</h1>
        {model.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{model.description}</p>}
      </div>

      {loadError && (
        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-sm text-red-600 dark:text-red-400">
          {loadError}
        </div>
      )}

      <BackofficeDataTable
        model={model}
        records={records}
        isLoading={isLoading}
        canManage={canManage}
        onCreate={() => navigate(`/admin/${model.key}/nouveau`)}
        onOpen={(record) => navigate(`/admin/${model.key}/${(record as Record<string, unknown>).id}`)}
        onDelete={(record) => setPendingDelete(record as Record<string, unknown>)}
        onRecordUpdated={handleRecordUpdated}
      />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title={`Supprimer ce ${model.labelSingular.toLowerCase()} ?`}
        description="Cette action est irréversible. L'enregistrement sera définitivement supprimé."
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
