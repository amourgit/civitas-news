// ============================================================
// src/components/layout/__tests__/ProfileDropdown.test.tsx
// Verrouille le calcul de position/dimension du menu profil : ouverture
// sous le bouton (top = bas du déclencheur + marge), alignement sur le
// bord droit du déclencheur sans jamais déborder de l'écran (à gauche
// ni à droite) une fois la largeur RÉELLEMENT rendue prise en compte,
// hauteur plafonnée à la place disponible + défilement interne, et
// fermeture clic extérieur/Échap. Le panneau est porté par un portail
// (document.body) : les requêtes RTL le trouvent normalement (le
// conteneur par défaut de `render` EST document.body).
// ============================================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileDropdown } from '../ProfileDropdown';

const mockNavigate = vi.fn();
const mockLogout = vi.fn().mockResolvedValue(undefined);
const mockToggleTheme = vi.fn();
const mockToast = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../store/auth.store', () => ({
  useAuthStore: () => ({
    user: { nomAffiche: 'Alice Ngoya', username: 'alice', avatar: undefined, role: 'etudiant' },
    isAdmin: false,
    logout: mockLogout,
  }),
}));

vi.mock('../../../store/ui.store', () => ({
  useUiStore: () => ({ theme: 'light', toggleTheme: mockToggleTheme }),
}));

vi.mock('../../../hooks/useToast', () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}));

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

/** Simule le rectangle du bouton déclencheur (avatar de la topbar). */
function mockTriggerRect(rect: Partial<DOMRect>) {
  HTMLButtonElement.prototype.getBoundingClientRect = vi.fn(() => ({
    top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {},
    ...rect,
  })) as unknown as () => DOMRect;
}

/** Simule la largeur RENDUE du panneau (mesurée après montage, voir
 * useLayoutEffect dans ProfileDropdown) — jsdom ne calcule aucune
 * mise en page réelle, donc sans ce mock la largeur mesurée serait
 * toujours 0. */
function mockPanelWidth(width: number) {
  HTMLDivElement.prototype.getBoundingClientRect = vi.fn(() => ({
    top: 0, bottom: 0, left: 0, right: 0, width, height: 400, x: 0, y: 0, toJSON() {},
  })) as unknown as () => DOMRect;
}

describe('ProfileDropdown — position et dimensions dynamiques', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogout.mockClear();
    mockToggleTheme.mockClear();
    mockToast.mockClear();
  });

  it('ouvre le menu directement sous le bouton déclencheur, aligné sur son bord droit (mobile étroit)', async () => {
    setViewport(375, 720);
    mockTriggerRect({ top: 12, bottom: 36, left: 335, right: 365, width: 30, height: 24 });
    mockPanelWidth(240); // largeur réelle attendue à 375px de large : min(375*0.78, 240) = 240

    render(<ProfileDropdown />);
    fireEvent.click(screen.getByTitle('Alice Ngoya'));

    const menu = await screen.findByRole('menu');
    expect(menu).toHaveStyle({ top: '44px' }); // bottom (36) + marge (8)
    expect(menu).toHaveStyle({ left: '125px' }); // right du bouton (365) - largeur (240)
    // Largeur pilotée par Tailwind responsive, plus de largeur fixe 300px.
    expect(menu.className).toContain('w-[min(78vw,240px)]');
    expect(menu.className).toContain('sm:w-72');
    expect(menu.className).toContain('xl:w-[300px]');
  });

  it("ne pousse jamais le panneau hors de l'écran, ni à gauche ni à droite, sur un très petit mobile", async () => {
    setViewport(320, 640);
    mockTriggerRect({ top: 8, bottom: 32, left: 284, right: 312, width: 28, height: 24 });
    mockPanelWidth(240); // min(320*0.78, 240) = 240

    render(<ProfileDropdown />);
    fireEvent.click(screen.getByTitle('Alice Ngoya'));

    const menu = await screen.findByRole('menu');
    const left = parseFloat((menu as HTMLElement).style.left);
    // 320 - 240 - 8 = 72 : le panneau colle au bord droit de l'écran
    // (marge de 8px) plutôt que de déborder à gauche ou à droite.
    expect(left).toBeCloseTo(72, 0);
    expect(left).toBeGreaterThanOrEqual(8);
    expect(left + 240).toBeLessThanOrEqual(320 - 8 + 0.5);
  });

  it('plafonne la hauteur du contenu à la place disponible sous le bouton et le rend défilable', async () => {
    // Petit viewport en hauteur (mobile en paysage) : la douzaine de
    // lignes du menu ne rentre pas — doit devenir défilable plutôt que
    // de déborder de l'écran.
    setViewport(700, 340);
    mockTriggerRect({ top: 8, bottom: 32, left: 600, right: 628, width: 28, height: 24 });
    mockPanelWidth(288);

    render(<ProfileDropdown />);
    fireEvent.click(screen.getByTitle('Alice Ngoya'));

    const menu = await screen.findByRole('menu');
    const scrollArea = menu.querySelector('.overflow-y-auto') as HTMLElement | null;
    expect(scrollArea).not.toBeNull();
    const maxHeight = parseFloat(scrollArea!.style.maxHeight);
    // Plafonné par la place réellement disponible (340 - 40 - 8 = 292)
    // ET jamais plus des 3/4 de l'écran (255).
    expect(maxHeight).toBeLessThanOrEqual(340 * 0.75 + 0.01);
    expect(maxHeight).toBeGreaterThanOrEqual(200);
  });

  it('ferme le menu au clic extérieur et à Échap', async () => {
    setViewport(1440, 900);
    mockTriggerRect({ top: 10, bottom: 34, left: 1400, right: 1428, width: 28, height: 24 });
    mockPanelWidth(300);

    render(<ProfileDropdown />);
    fireEvent.click(screen.getByTitle('Alice Ngoya'));
    expect(await screen.findByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());

    fireEvent.click(screen.getByTitle('Alice Ngoya'));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });
});
