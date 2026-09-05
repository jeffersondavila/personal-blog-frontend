/**
 * Contacto y enlaces (USER_FLOWS A.10; MVP_SCOPE seccion 4): `mailto:` y redes,
 * sin formulario. El `404` del perfil es «todavia no disponible» (D-014-K).
 */
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { tituloDelDocumento } from '../hooks/useDocumentTitle';
import { RUTAS } from '../lib/rutas';
import { perfil } from '../test/fixtures';
import { renderRuta } from '../test/renderRuta';
import { fallo, noEncontrado, respuestaJson } from '../test/respuestas';

describe('ContactPage', () => {
  it('muestra el correo como mailto y las redes como enlaces externos seguros, en su orden', async () => {
    renderRuta(RUTAS.contacto, { '/api/v1/profile': () => respuestaJson(perfil()) });

    const correo = await screen.findByRole('link', { name: 'hola@ejemplo.test' });
    expect(correo).toHaveAttribute('href', 'mailto:hola@ejemplo.test');

    const redes = screen.getByRole('list', { name: /redes|enlaces/i });
    const enlaces = within(redes).getAllByRole('link');
    expect(enlaces.map((e) => e.textContent)).toEqual(['GitHub', 'LinkedIn']);
    for (const enlace of enlaces) {
      expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
      expect(enlace).not.toHaveAttribute('target');
    }
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.title).toBe(tituloDelDocumento('Contacto'));
  });

  it('no hay formulario de contacto: solo enlaces', async () => {
    renderRuta(RUTAS.contacto, { '/api/v1/profile': () => respuestaJson(perfil()) });

    await screen.findByRole('link', { name: 'hola@ejemplo.test' });
    expect(screen.getByRole('main').querySelector('form')).toBeNull();
    expect(screen.getByRole('main').querySelector('textarea')).toBeNull();
  });

  it('omite el correo cuando el perfil no lo tiene y las redes cuando no hay', async () => {
    renderRuta(RUTAS.contacto, {
      '/api/v1/profile': () => respuestaJson(perfil({ contact_email: null, social_links: [] })),
    });

    expect(await screen.findByText(/no hay datos de contacto/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /@/ })).not.toBeInTheDocument();
  });

  it('con el perfil aun sin semilla explica que no esta disponible, sin pagina 404', async () => {
    renderRuta(RUTAS.contacto, { '/api/v1/profile': () => noEncontrado() });

    expect(
      await screen.findByText(/datos de contacto a[uú]n no est[aá]n disponibles/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /404/ })).not.toBeInTheDocument();
  });

  it('ante un fallo ofrece reintentar', async () => {
    renderRuta(RUTAS.contacto, { '/api/v1/profile': () => fallo() });

    expect(await screen.findByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});
