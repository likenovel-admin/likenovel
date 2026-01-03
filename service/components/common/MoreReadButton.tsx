import ArrowDown from "/public/images/arrow-down.svg";
interface Props {
  onClick: () => void;
}
const MoreReadButton = ({ onClick }: Props) => {
  return (
    <button className="flex gap-9pxr items-center w-[90px]" onClick={onClick}>
      <span className="text-12pxr md:text-15pxr">더보기</span>
      <div className="flex justify-center items-center min-w-[28px] h-[28px] bg-white border border-light-gray-500 rounded-full">
        <ArrowDown className="w-[12px] h-[7px] text-dark-gray-100" />
      </div>
    </button>
  );
};
export default MoreReadButton;
