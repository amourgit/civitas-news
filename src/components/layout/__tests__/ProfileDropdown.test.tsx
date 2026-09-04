// ============================================================
// src/components/layout/__tests__/ProfileDropdown.test.tsx
// Verrouille le calcul de position/dimension du menu profil : ouverture
// sous le bouton (top = bas du déclencheur + marge), jamais hors écran
// (right clampé, hauteur plafonnée à la place disponible + défilement
// interne), largeur pilotée par des classes Tailwind responsives (et
// non plus une largeur fixe en pixels).
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

function mockTriggerRect(rect: Partial<DOMRect>) {
  HTMLButtonElement.prototype.getBoundingClientRect = vi.fn(() => ({
    top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {},
    ...rect,
  })) as unknown as () => DOMRect;
}

describe('ProfileDropdown — position et dimensions dynamiques', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogout.mockClear();
    mockToggleTheme.mockClear();
    mockToast.mockClear();
  });

  it('ouvre le menu directement sous le bouton déclencheur (mobile étroit)', async () => {
    setViewport(375, 720);
    mockTriggerRect({ top: 12, bottom: 36, left: 335, right: 365, width: 30, height: 24 });

    render(<ProfileDropdown />);
    fireEvent.click(screen.getByTitle('Alice Ngoya'));

    const menu = await screen.findByRole('menu');
    expect(menu).toHaveStyle({ top: '44px' }); // bottom (36) + marge (8)
    // Largeur pilotée par Tailwind responsive, plus de largeur fixe 300px.
    expect(menu.className).toContain('w-[min(86vw,272px)]');
    expect(menu.className).toContain('sm:w-80');
    expect(menu.className).toContain('xl:w-[300px]');
  });

  it("ne pousse jamais le panneau hors de l'écran à gauche sur un très petit mobile", async () => {
    setViewport(320, 640);
    mockTriggerRect({ top: 8, bottom: 32, left: 284, right: 312, width: 28, height: 24 });

    render(<ProfileDropdown />);
    fireEvent.click(screen.getByTitle('Alice Ngoya'));

    const menu = await screen.findByRole('menu');
    const style = menu.getAttribute('style') ?? '';
    const rightMatch = style.match(/right:\s*([\d.]+)px/);
    expect(rightMatch).not.toBeNull();
    const right = Number(rightMatch![1]);
    // right ne doit jamais dépasser (largeur écran - largeur estimée - marge),
    // sinon le panneau déborderait à gauche.
    expect(right).toBeLessThanOrEqual(320 - Math.min(320 * 0.86, 272) - 8 + 0.01);
    expect(right).toBeGreaterThanOrEqual(8);
  });

  it('plafonne la hauteur du contenu à la place disponible sous le bouton et le rend défilable', async () => {
    // Petit viewport en hauteur (mobile en paysage) : la douzaine de
    // lignes du menu ne rentre pas — doit devenir défilable plutôt que
    // de déborder de l'écran.
    setViewport(700, 340);
    mockTriggerRect({ top: 8, bottom: 32, left: 600, right: 628, width: 28, height: 24 });

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
