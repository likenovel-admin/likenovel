import { GenreProvider } from "@/contexts/GenreContext";
import ProductArea from "./ProductArea";

const Standalone = () => {
  return (
    <GenreProvider>
      <div className="w-full max-w-[1120px] mx-auto">
        <ProductArea stateType="standalone" />
      </div>
    </GenreProvider>
  );
};
export default Standalone;
