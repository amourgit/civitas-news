// ============================================================
// src/pages/admin/BackofficeRecordPage.tsx
// ============================================================

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BackofficeRecordForm } from '../../components/backoffice/BackofficeRecordForm';
import { getModel } from '../../components/backoffice/registry';
import { usePermissions } from '../../lib/permissions/usePermissions';

export default function BackofficeRecordPage() {
  const { modelKey, id } = useParams<{ modelKey: string; id: string }>();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const model = getModel(modelKey);
  const isCreate = id === 'nouveau';

  const [record, setRecord] = useState<Record<string, unknown> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(!isCreate);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!model || isCreate || !id) return;
    setIsLoading(true);
    setLoadError(null);
    (model.data.get ? model.data.get(id) : Promise.reject(new Error('Consultation indisponible pour cette table.')))
      .then((data) => setRecord(data as Record<string, unknown>))
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Chargement impossible.'))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, id, isCreate]);

  if (!model) return <Navigate to="/admin" replace />;
  if (isCreate && !model.capabilities.create) return <Navigate to={`/admin/${model.key}`} replace />;

  const canManage = can(model.managePermission ?? model.viewPermission ?? ('backoffice:access' as never));
  const DetailExtras = model.DetailExtras;

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/admin/${model.key}`)}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white font-display">
          {isCreate ? `Créer — ${model.labelSingular}` : model.labelSingular}
        </h1>
      </div>

      {isLoading && (
        <Card variant="default" padding="lg" className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#5B4DFF]" />
        </Card>
      )}

      {loadError && (
        <Card variant="default" padding="lg">
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">{loadError}</p>
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/${model.key}`)}>Retour à la liste</Button>
        </Card>
      )}

      {!isLoading && !loadError && (isCreate || record) && (
        <Card variant="default" padding="lg">
          <BackofficeRecordForm
            model={model}
            record={isCreate ? undefined : record}
            canManage={canManage}
            onCancel={() => navigate(`/admin/${model.key}`)}
            onSaved={(saved) => {
              if (isCreate) {
                navigate(`/admin/${model.key}/${(saved as Record<string, unknown>).id}`, { replace: true });
              } else {
                setRecord(saved as Record<string, unknown>);
              }
            }}
          />
        </Card>
      )}

      {!isCreate && !isLoading && record && DetailExtras && (
        <DetailExtras record={record as never} />
      )}
    </div>
  );
}
