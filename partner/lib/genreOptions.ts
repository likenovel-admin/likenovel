export type GenreOptionSource = {
  keyword_id: number;
  keyword_name: string;
  major_genre_yn: string;
};

const EXCLUDED_PRIMARY_GENRE_NAMES = new Set(["로맨스"]);

const getMajorGenreOptions = (genres: GenreOptionSource[] = []) =>
  genres.filter((genre) => genre.major_genre_yn === "Y");

export const getPrimaryGenreOptions = (genres: GenreOptionSource[] = []) =>
  getMajorGenreOptions(genres).filter(
    (genre) => !EXCLUDED_PRIMARY_GENRE_NAMES.has(genre.keyword_name.trim()),
  );

export const getSubGenreOptions = (
  genres: GenreOptionSource[] = [],
  primaryGenreId?: string | number,
) =>
  getMajorGenreOptions(genres).filter(
    (genre) => String(genre.keyword_id) !== String(primaryGenreId || ""),
  );
