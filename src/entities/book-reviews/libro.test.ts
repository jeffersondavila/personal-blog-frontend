import { describe, expect, it } from 'vitest';

import { describirLibro } from './libro';

describe('describirLibro', () => {
  it('une titulo y autor cuando hay ambos', () => {
    expect(describirLibro({ book_title: 'Clean Code', book_author: 'Robert C. Martin' })).toBe(
      'Clean Code, de Robert C. Martin',
    );
  });

  it('usa el dato disponible cuando falta el otro', () => {
    expect(describirLibro({ book_title: 'Clean Code', book_author: null })).toBe('Clean Code');
    expect(describirLibro({ book_title: null, book_author: 'Robert C. Martin' })).toBe(
      'Robert C. Martin',
    );
  });

  it('devuelve null sin datos del libro', () => {
    expect(describirLibro({ book_title: null, book_author: null })).toBeNull();
  });
});
