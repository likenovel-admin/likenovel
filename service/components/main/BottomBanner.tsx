import { IPanel } from "@/app/api/query/banner/dto";

interface Props {
  teriayPanels: IPanel[];
}

export default function BottomBanner({ teriayPanels }: Props) {
  return (
    <>
      {teriayPanels.length > 0 ? (
        <section
          className="w-full flex justify-center cursor-pointer"
          onClick={() => {
            if (teriayPanels[0].linkPath) {
              window.open(teriayPanels[0].linkPath, "_blank");
            }
          }}
        >
          <div className="flex rounded-[20px] w-[1120px] h-[140px] items-center justify-center overflow-hidden">
            <img
              src={teriayPanels[0]?.pcImgPath ?? ""}
              alt="promo banner"
              className="max-h-full h-[140px] object-contain rounded-[20px]"
            />
          </div>
        </section>
      ) : null}
    </>
  );
}
