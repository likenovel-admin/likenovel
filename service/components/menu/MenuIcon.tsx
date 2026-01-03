interface Props {
  menu: React.ReactNode;
  dotColor: "red" | "blue";
  isDotActive?: boolean;
}
const MenuIcon = ({ menu, dotColor, isDotActive = false }: Props) => {
  return (
    <div className="flex items-center">
      {menu}
      {isDotActive && (
        <div
          className={`w-5pxr h-5pxr rounded-full mb-[20px] ${
            dotColor === "red" ? "bg-red-100" : "bg-blue-500"
          } ${isDotActive ? "animate-pulse mr-[-5px]" : ""}`}
        />
      )}
    </div>
  );
};
export default MenuIcon;
