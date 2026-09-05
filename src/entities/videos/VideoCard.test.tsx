/**
 * Tarjeta de video (A.6): el embed solo aparece por accion explicita, solo para
 * proveedores permitidos, y siempre existe el enlace externo seguro.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { VideoCard } from './VideoCard';
import { video } from '../../test/fixtures';

function renderCard(datos = video()) {
  return render(
    <MemoryRouter>
      <ul>
        <VideoCard video={datos} />
      </ul>
    </MemoryRouter>,
  );
}

describe('VideoCard', () => {
  it('lleva id=slug para que la busqueda pueda enlazar a /videos#slug', () => {
    renderCard();

    expect(screen.getByRole('article').closest('li')).toHaveAttribute('id', 'intro-docker');
  });

  it('muestra titulo, resumen, miniatura con alt, fecha y duracion', () => {
    renderCard();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Introduccion a Docker' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Video introductorio.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Miniatura del video' })).toBeInTheDocument();
    expect(screen.getByText('15 de agosto de 2026').tagName).toBe('TIME');
    expect(screen.getByText(/12 min/)).toBeInTheDocument();
  });

  it('no incrusta nada hasta que el visitante pulsa Reproducir', () => {
    renderCard();

    expect(document.querySelector('iframe')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /reproducir/i }));

    const iframe = document.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(iframe).toHaveAttribute('title', 'Introduccion a Docker');
    expect(screen.queryByRole('button', { name: /reproducir/i })).not.toBeInTheDocument();
  });

  it('siempre ofrece el enlace externo seguro al video', () => {
    renderCard();

    const enlace = screen.getByRole('link', { name: /ver en youtube/i });
    expect(enlace).toHaveAttribute('href', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('con un proveedor fuera de la lista no hay boton ni iframe: solo el enlace (fail-closed)', () => {
    renderCard(
      video({ provider: 'dailymotion', video_url: 'https://www.dailymotion.com/video/x1' }),
    );

    expect(screen.queryByRole('button', { name: /reproducir/i })).not.toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
    expect(screen.getByRole('link', { name: /ver el video/i })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });

  it('con una referencia de embed invalida tampoco incrusta', () => {
    renderCard(video({ embed_reference: 'x"><script>' }));

    expect(screen.queryByRole('button', { name: /reproducir/i })).not.toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('sin miniatura muestra la tarjeta sin imagen rota', () => {
    renderCard(video({ thumbnail: null }));

    const articulo = screen.getByRole('article');
    expect(within(articulo).queryByRole('img')).not.toBeInTheDocument();
    expect(within(articulo).getByRole('button', { name: /reproducir/i })).toBeInTheDocument();
  });
});
