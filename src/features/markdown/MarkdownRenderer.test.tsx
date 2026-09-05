/**
 * Pipeline unico de render Markdown (ADR-005, S-03, decision D-014-F):
 * Markdown → react-markdown → árbol React → rehype-sanitize → render permitido.
 *
 * Lo que se prueba es lo que importa de verdad: que el HTML crudo no se
 * interpreta, que los atributos y protocolos peligrosos no llegan al DOM y que
 * los enlaces se clasifican en internos, externos seguros y neutralizados.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { MarkdownRenderer } from './MarkdownRenderer';

function renderMarkdown(markdown: string) {
  return render(
    <MemoryRouter>
      <MarkdownRenderer markdown={markdown} />
    </MemoryRouter>,
  );
}

describe('MarkdownRenderer — contenido permitido', () => {
  it('renderiza parrafos, enfasis, listas, codigo e imagenes', () => {
    renderMarkdown(
      [
        'Un **parrafo** con _enfasis_.',
        '',
        '- uno',
        '- dos',
        '',
        '```ts',
        'const x = 1;',
        '```',
        '',
        '![Diagrama del sistema](https://imagenes.test/diagrama.png)',
      ].join('\n'),
    );

    expect(screen.getByText('parrafo').tagName).toBe('STRONG');
    expect(screen.getByText('enfasis').tagName).toBe('EM');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(document.querySelector('pre > code')).toHaveTextContent('const x = 1;');
    const imagen = screen.getByRole('img', { name: 'Diagrama del sistema' });
    expect(imagen).toHaveAttribute('src', 'https://imagenes.test/diagrama.png');
    expect(imagen).toHaveAttribute('loading', 'lazy');
  });

  it('baja un nivel los encabezados: el h1 de la pagina es el titulo del contenido', () => {
    renderMarkdown('# Primero\n\n## Segundo\n\n###### Sexto');

    expect(screen.getByRole('heading', { level: 2, name: 'Primero' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Segundo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 6, name: 'Sexto' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });
});

describe('MarkdownRenderer — enlaces', () => {
  it('un enlace externo http(s) cumple S-12 y abre en la misma pestana', () => {
    renderMarkdown('[Externo](https://ejemplo.test/ruta)');

    const enlace = screen.getByRole('link', { name: 'Externo' });
    expect(enlace).toHaveAttribute('href', 'https://ejemplo.test/ruta');
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
    expect(enlace).not.toHaveAttribute('target');
  });

  it('un enlace interno navega dentro del sitio sin rel externo', () => {
    renderMarkdown('[Otro articulo](/articulos/otro)');

    const enlace = screen.getByRole('link', { name: 'Otro articulo' });
    expect(enlace).toHaveAttribute('href', '/articulos/otro');
    expect(enlace).not.toHaveAttribute('rel');
  });

  it('un ancla dentro del documento se conserva', () => {
    renderMarkdown('[Ir a la seccion](#seccion)');

    expect(screen.getByRole('link', { name: 'Ir a la seccion' })).toHaveAttribute(
      'href',
      '#seccion',
    );
  });

  it('un enlace mailto se conserva como enlace de correo', () => {
    renderMarkdown('[Escríbeme](mailto:hola@ejemplo.test)');

    expect(screen.getByRole('link', { name: 'Escríbeme' })).toHaveAttribute(
      'href',
      'mailto:hola@ejemplo.test',
    );
  });

  it('un destino protocolo-relativo (//host) no se trata como interno ni como externo permitido', () => {
    renderMarkdown('[Ambiguo](//malo.test/ruta)');

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Ambiguo')).toBeInTheDocument();
  });

  it.each(['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:x'])(
    'un protocolo no permitido (%s) no produce ningun enlace: solo el texto',
    (destino) => {
      renderMarkdown(`[Pulsa aqui](${destino})`);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText('Pulsa aqui')).toBeInTheDocument();
      expect(document.body.innerHTML).not.toContain('javascript:');
    },
  );
});

describe('MarkdownRenderer — HTML crudo y atributos peligrosos', () => {
  it('no interpreta <script> ni deja su contenido en el documento', () => {
    renderMarkdown('Antes\n\n<script>alert("xss")</script>\n\nDespués');

    expect(document.querySelector('script')).toBeNull();
    expect(document.body.innerHTML).not.toContain('alert(');
    expect(screen.getByText('Antes')).toBeInTheDocument();
    expect(screen.getByText('Después')).toBeInTheDocument();
  });

  it('no interpreta iframes ni manejadores on* incrustados como HTML', () => {
    renderMarkdown(
      '<iframe src="https://malo.test"></iframe>\n\n<a href="https://ok.test" onclick="alert(1)">Clic</a>\n\n<img src="x" onerror="alert(1)">',
    );

    expect(document.querySelector('iframe')).toBeNull();
    expect(document.querySelector('[onclick]')).toBeNull();
    expect(document.querySelector('[onerror]')).toBeNull();
    expect(document.body.innerHTML).not.toContain('onerror');
  });

  it('una imagen con un protocolo no permitido no se renderiza', () => {
    renderMarkdown('![x](data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=)');

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain('data:image');
  });

  it('no aplica estilos ni clases arbitrarias del contenido', () => {
    renderMarkdown('<p style="position:fixed" class="admin">Texto</p>');

    expect(document.querySelector('[style]')).toBeNull();
    expect(document.querySelector('.admin')).toBeNull();
  });
});
