import { IPanel } from "@/app/api/query/banner/dto";

interface Props {
  secondaryPanels: IPanel[];
}

export default function MiddleBanner({ secondaryPanels }: Props) {
  return (
    <>
      {secondaryPanels.length > 0 ? (
        <section
          className="w-full flex justify-center bg-[#127CFF] cursor-pointer"
          onClick={() => {
            if (secondaryPanels[0].linkPath) {
              window.open(secondaryPanels[0].linkPath, "_blank");
            }
          }}
        >
          <div className="flex w-[1080px] h-[116px] items-center justify-between px-[46px] overflow-hidden">
            <img
              src={secondaryPanels[0]?.pcImgPath ?? ""}
              alt="promo banner"
              className="max-h-ful h-[116px] object-contain"
            />
          </div>
        </section>
      ) : null}
    </>
  );
}
