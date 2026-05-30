const EXCLUDED_PRIMARY_GENRE_NAMES = new Set(["로맨스"]);

export const getPrimaryGenreOptions = (genres: string[] = []) =>
  genres.filter((genre) => !EXCLUDED_PRIMARY_GENRE_NAMES.has(genre.trim()));

export const getSubGenreOptions = (genres: string[] = [], primaryGenre = "") =>
  genres.filter((genre) => genre !== primaryGenre);
