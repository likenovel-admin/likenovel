import { GenreProvider } from "@/contexts/GenreContext";
import ProductArea from "./ProductArea";
const Ongoing = () => {
  return (
    <GenreProvider>
      <div className="w-full max-w-[1120px] mx-auto">
        <ProductArea stateType="ongoing" />
      </div>
    </GenreProvider>
  );
};
export default Ongoing;
