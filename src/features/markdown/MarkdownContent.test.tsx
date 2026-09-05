/**
 * `MarkdownContent` carga el renderizador en diferido (ADR-005: «carga diferida
 * del renderizador donde aplique») y muestra el contenido cuando llega.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { MarkdownContent } from './MarkdownContent';
// Deja el renderizador resuelto antes de renderizar: sin esto, la espera
// dependeria de cuanto tarde la maquina en transformar `react-markdown`.
import '../../test/precargarMarkdown';

describe('MarkdownContent', () => {
  it('anuncia la carga del renderizador y despues muestra el contenido sanitizado', async () => {
    render(
      <MemoryRouter>
        <MarkdownContent markdown={'## Hola\n\n<script>alert(1)</script>Texto'} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toHaveTextContent(/cargando/i);

    expect(await screen.findByRole('heading', { level: 3, name: 'Hola' })).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });
});
