import { GenreProvider } from "@/contexts/GenreContext";
import ProductArea from "./ProductArea";

const End = () => {
  return (
    <GenreProvider>
      <div className="w-full max-w-[1120px] mx-auto">
        <ProductArea stateType="end" />
      </div>
    </GenreProvider>
  );
};
export default End;
