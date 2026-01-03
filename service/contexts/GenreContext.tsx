import { createContext, ReactNode, useContext, useState } from "react";

interface GenreContextType {
  selectedGenres: string[];
  removeGenre: (genre: string) => void;
  setSelectedGenres: React.Dispatch<React.SetStateAction<string[]>>;
}

const GenreContext = createContext<GenreContextType | undefined>(undefined);

export const GenreProvider = ({ children }: { children: ReactNode }) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const removeGenre = (genre: string) => {
    setSelectedGenres((prev) => prev.filter((g) => g !== genre));
  };

  return (
    <GenreContext.Provider
      value={{ selectedGenres, setSelectedGenres, removeGenre }}
    >
      {children}
    </GenreContext.Provider>
  );
};

export const useGenre = () => {
  const context = useContext(GenreContext);
  if (!context) {
    throw new Error("useGenre must be used within a GenreProvider");
  }
  return context;
};
