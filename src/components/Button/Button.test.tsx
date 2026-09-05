/**
 * Comportamiento de `Button`.
 *
 * Lo que se prueba aqui es lo que un usuario percibe y lo que un consumidor
 * puede romper: que es un boton nativo, que `disabled` desactiva de verdad,
 * que `type` no se pierde, que los hijos forman el nombre accesible y que las
 * variantes no degradan nada de lo anterior.
 *
 * Lo que NO se prueba, y por que: JSDOM no pinta, de modo que no puede
 * demostrar que el anillo de foco "se vea". La garantia de activacion por
 * teclado tampoco se simula: en JSDOM, pulsar Enter sobre un `<button>` no
 * dispara `click`, asi que una prueba de teclado estaria comprobando el motor
 * de pruebas y no este componente. La garantia real es estructural —el
 * elemento es un `<button>` nativo, no un `div` con `onClick`— y eso si se
 * comprueba.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('renderiza un boton nativo, no un elemento generico con manejador', () => {
    render(<Button>Guardar</Button>);

    const button = screen.getByRole('button', { name: 'Guardar' });

    expect(button.tagName).toBe('BUTTON');
  });

  it('usa los hijos como nombre accesible', () => {
    render(<Button>Reintentar</Button>);

    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('es de tipo "button" por defecto, para no enviar formularios sin querer', () => {
    render(<Button>Cancelar</Button>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('conserva el type que indique el consumidor', () => {
    render(<Button type="submit">Publicar</Button>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('marca disabled en el DOM', () => {
    render(<Button disabled>Publicar</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('no ejecuta la accion cuando esta deshabilitado', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Archivar
      </Button>,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('ejecuta la accion cuando esta habilitado', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Archivar</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('es enfocable: puede recibir el foco del teclado', () => {
    render(<Button>Buscar</Button>);

    const button = screen.getByRole('button');
    button.focus();

    expect(button).toHaveFocus();
  });

  it('no es enfocable cuando esta deshabilitado', () => {
    render(<Button disabled>Buscar</Button>);

    const button = screen.getByRole('button');
    button.focus();

    expect(button).not.toHaveFocus();
  });

  it.each(['primary', 'secondary'] as const)(
    'la variante %s conserva la semantica y el nombre accesible',
    (variant) => {
      render(<Button variant={variant}>Siguiente</Button>);

      const button = screen.getByRole('button', { name: 'Siguiente' });

      expect(button.tagName).toBe('BUTTON');
      expect(button).toBeEnabled();
    },
  );

  it('aplica una clase distinta por variante', () => {
    const { rerender } = render(<Button variant="primary">Accion</Button>);
    const primaryClass = screen.getByRole('button').className;

    rerender(<Button variant="secondary">Accion</Button>);
    const secondaryClass = screen.getByRole('button').className;

    expect(primaryClass).not.toBe(secondaryClass);
  });

  it('no bloquea atributos nativos ni ARIA del consumidor', () => {
    render(
      <Button aria-pressed="true" aria-describedby="ayuda" name="accion" value="publicar">
        Alternar
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Alternar' });

    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('aria-describedby', 'ayuda');
    expect(button).toHaveAttribute('name', 'accion');
    expect(button).toHaveAttribute('value', 'publicar');
  });

  it('permite anadir una clase propia sin perder la del sistema', () => {
    render(<Button className="clase-del-consumidor">Accion</Button>);

    const button = screen.getByRole('button');

    expect(button.className).toContain('clase-del-consumidor');
    expect(button.className.split(' ').length).toBeGreaterThan(1);
  });
});
