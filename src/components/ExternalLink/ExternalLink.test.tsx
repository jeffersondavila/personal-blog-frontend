/**
 * Enlace externo seguro (S-12, decision D-014-L).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ExternalLink } from './ExternalLink';

describe('ExternalLink', () => {
  it('lleva siempre rel="noopener noreferrer" y abre en la misma pestana', () => {
    render(<ExternalLink href="https://ejemplo.test/ruta">Ejemplo</ExternalLink>);

    const enlace = screen.getByRole('link', { name: 'Ejemplo' });
    expect(enlace).toHaveAttribute('href', 'https://ejemplo.test/ruta');
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
    expect(enlace).not.toHaveAttribute('target');
  });

  it('admite http ademas de https', () => {
    render(<ExternalLink href="http://ejemplo.test/">Sin TLS</ExternalLink>);

    expect(screen.getByRole('link', { name: 'Sin TLS' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });

  it.each(['javascript:alert(1)', 'data:text/html,hola', 'ftp://ejemplo.test', 'no es una url'])(
    'con un destino no permitido (%s) muestra el texto sin crear un enlace',
    (href) => {
      render(<ExternalLink href={href}>Texto</ExternalLink>);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText('Texto')).toBeInTheDocument();
    },
  );

  it('conserva los atributos que le pase el consumidor', () => {
    render(
      <ExternalLink href="https://ejemplo.test/" className="propia" aria-label="Sitio de ejemplo">
        Ejemplo
      </ExternalLink>,
    );

    const enlace = screen.getByRole('link', { name: 'Sitio de ejemplo' });
    expect(enlace).toHaveClass('propia');
  });
});
