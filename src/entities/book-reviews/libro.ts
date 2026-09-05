/** Texto que describe el libro de una review: «Clean Code, de Robert C. Martin», con lo que haya. */
export function describirLibro(review: {
  readonly book_title: string | null;
  readonly book_author: string | null;
}): string | null {
  if (review.book_title !== null && review.book_author !== null) {
    return `${review.book_title}, de ${review.book_author}`;
  }
  return review.book_title ?? review.book_author;
}
