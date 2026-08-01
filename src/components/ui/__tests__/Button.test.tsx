import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '../Button';

describe('Button component', () => {
  it('renders children correctly', () => {
    render(<Button variant="primary">Cliquez-moi</Button>);
    expect(screen.getByText('Cliquez-moi')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<Button isLoading>Envoi</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
