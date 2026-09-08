import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { MarkdownContent } from './MarkdownContent';
import { MarkdownEditor } from './MarkdownEditor';
import '../../test/precargarMarkdown';

const adversario = [
  '## Contenido benigno',
  '',
  '**Texto visible**',
  '',
  '<script>alert("canary018")</script>',
  '',
  '<img src=x onerror="alert(1)">',
  '',
  '[Peligroso](javascript:alert%281%29)',
  '',
  '![Insegura](data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=)',
  '',
  '<iframe src="https://evil.test"></iframe>',
  '',
  '<p style="position:fixed" class="canary018" onclick="alert(1)">HTML raw</p>',
  '',
  '[Enlace valido](https://example.test/ruta)',
  '',
  '![Imagen valida](https://images.example.test/a.png)',
].join('\n');

describe.each(['publico', 'preview'] as const)('sanitizacion adversaria %s', (superficie) => {
  it('conserva contenido benigno y elimina todas las capacidades activas del Markdown', async () => {
    const { container } = render(
      <MemoryRouter>
        {superficie === 'publico' ? (
          <MarkdownContent markdown={adversario} />
        ) : (
          <MarkdownEditor label="Cuerpo" value={adversario} onChange={() => undefined} />
        )}
      </MemoryRouter>,
    );
    if (superficie === 'preview')
      fireEvent.click(screen.getByRole('button', { name: 'Vista previa' }));
    expect(await screen.findByRole('heading', { name: 'Contenido benigno' })).toBeInTheDocument();
    expect(screen.getByText('Texto visible').tagName).toBe('STRONG');
    expect(screen.getByRole('link', { name: 'Enlace valido' })).toHaveAttribute(
      'href',
      'https://example.test/ruta',
    );
    expect(screen.getByRole('img', { name: 'Imagen valida' })).toHaveAttribute(
      'src',
      'https://images.example.test/a.png',
    );
    expect(
      container.querySelector('script, iframe, [onerror], [onclick], [style], .canary018'),
    ).toBeNull();
    expect(container.innerHTML).not.toMatch(/javascript:|data:image|evil\.test|alert\(/);
  });
});
