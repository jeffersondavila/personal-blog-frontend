/**
 * Render de una imagen del contrato: solo `access_url`, con `alt_text`,
 * `width` y `height` (A-04, api-contracts.md seccion 12, decision D-014-B).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MediaImage } from './MediaImage';
import { medio } from '../../test/fixtures';

describe('MediaImage', () => {
  it('renderiza la imagen con src=access_url, alt, width y height del contrato', () => {
    render(<MediaImage medio={medio()} />);

    const imagen = screen.getByRole('img', { name: 'Portada del articulo' });
    expect(imagen).toHaveAttribute('src', medio().access_url);
    expect(imagen).toHaveAttribute('width', '1200');
    expect(imagen).toHaveAttribute('height', '800');
  });

  it('trata como decorativa una imagen sin alt_text: alt vacio, sin inventar texto', () => {
    render(<MediaImage medio={medio({ alt_text: null })} />);

    const imagen = screen.getByRole('presentation');
    expect(imagen).toHaveAttribute('alt', '');
  });

  it('omite width y height cuando el contrato no los conoce', () => {
    render(<MediaImage medio={medio({ width: null, height: null })} />);

    const imagen = screen.getByRole('img');
    expect(imagen).not.toHaveAttribute('width');
    expect(imagen).not.toHaveAttribute('height');
  });

  it('no renderiza nada sin medio', () => {
    const { container } = render(<MediaImage medio={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('no renderiza una imagen rota cuando el medio no trae access_url', () => {
    const { container } = render(<MediaImage medio={medio({ access_url: null })} />);

    expect(container.querySelector('img')).toBeNull();
  });

  it('carga en diferido por defecto y admite cargar de inmediato', () => {
    const { rerender } = render(<MediaImage medio={medio()} />);
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy');

    rerender(<MediaImage medio={medio()} prioridad="alta" />);
    expect(screen.getByRole('img')).not.toHaveAttribute('loading', 'lazy');
  });

  it('nunca conoce la clave del objeto: el arbol solo contiene la URL firmada', () => {
    render(<MediaImage medio={medio()} />);

    expect(document.body.innerHTML).not.toContain('object_key');
  });
});
