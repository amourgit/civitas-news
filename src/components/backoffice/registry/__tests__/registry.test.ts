import { describe, it, expect } from 'vitest';
import { BACKOFFICE_MODELS, getModel, groupModelsByApp } from '../index';

describe('registre du backoffice', () => {
  it('résout chaque modèle par sa clé', () => {
    for (const model of BACKOFFICE_MODELS) {
      expect(getModel(model.key)).toBe(model);
    }
  });

  it('renvoie undefined pour une clé inconnue', () => {
    expect(getModel('table-inexistante')).toBeUndefined();
    expect(getModel(undefined)).toBeUndefined();
  });

  it('groupe toutes les tables par app sans perte ni doublon', () => {
    const groups = groupModelsByApp();
    const total = groups.reduce((sum, g) => sum + g.models.length, 0);
    expect(total).toBe(BACKOFFICE_MODELS.length);

    const seen = new Set<string>();
    for (const group of groups) {
      for (const model of group.models) {
        expect(seen.has(model.key)).toBe(false);
        seen.add(model.key);
      }
    }
  });

  it('chaque modèle expose au moins un champ de liste et une fonction list()', () => {
    for (const model of BACKOFFICE_MODELS) {
      expect(model.fields.length).toBeGreaterThan(0);
      expect(typeof model.data.list).toBe('function');
    }
  });

  it('un modèle avec capabilities.edit=true expose data.update, et delete=true expose data.remove', () => {
    for (const model of BACKOFFICE_MODELS) {
      if (model.capabilities.edit) expect(typeof model.data.update).toBe('function');
      if (model.capabilities.delete) expect(typeof model.data.remove).toBe('function');
      if (model.capabilities.create) expect(typeof model.data.create).toBe('function');
    }
  });

  it('chaque champ de type "fk" déclare une table cible existante dans le registre', () => {
    for (const model of BACKOFFICE_MODELS) {
      for (const field of model.fields) {
        if (field.type === 'fk') {
          expect(field.fkTarget, `${model.key}.${field.name}`).toBeDefined();
          expect(getModel(field.fkTarget), `${model.key}.${field.name} -> ${field.fkTarget}`).toBeDefined();
        }
      }
    }
  });
});
