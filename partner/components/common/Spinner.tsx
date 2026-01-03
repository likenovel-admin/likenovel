interface Props {
  color?: string;
  size?: number;
}
const Spinner = ({ color = "#3b82f6", size = 40 }: Props) => {
  return (
    <div className="flex justify-center items-center">
      <div
        style={{
          borderTopColor: color,
          width: `${size}px`,
          height: `${size}px`,
        }}
        className="border-4 border-gray-500 border-solid rounded-full animate-spin"
      ></div>
    </div>
  );
};

export default Spinner;
