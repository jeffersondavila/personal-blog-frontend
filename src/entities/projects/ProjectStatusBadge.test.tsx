/**
 * Estado del trabajo de un proyecto (`project_status`), distinto de su
 * visibilidad. Texto siempre presente (A-07).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProjectStatusBadge } from './ProjectStatusBadge';

describe('ProjectStatusBadge', () => {
  it.each([
    ['active', 'Activo'],
    ['paused', 'En pausa'],
    ['completed', 'Terminado'],
  ] as const)('%s se muestra como «%s»', (estado, texto) => {
    render(<ProjectStatusBadge estado={estado} />);

    expect(screen.getByText(texto)).toBeInTheDocument();
  });

  it('un valor desconocido se muestra tal cual en tono neutro, sin romper', () => {
    // El contrato v1 podria anadir un valor: la interfaz no debe caerse por ello.
    render(<ProjectStatusBadge estado={'archived' as never} />);

    expect(screen.getByText('archived')).toBeInTheDocument();
  });
});
