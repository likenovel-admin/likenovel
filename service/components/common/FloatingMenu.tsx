interface Props {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
}
const FloatingMenu = ({ children, onClick }: Props) => {
  return (
    <div
      className="flex items-center justify-center w-[45px] h-[45px] md:w-[50px] md:h-[50px] p-4 rounded-full shadow-lg border border-light-gray-300 z-60 cursor-pointer bg-white"
      onClick={onClick}
    >
      <div>{children}</div>
    </div>
  );
};
export default FloatingMenu;
