import CircleWarn from "/public/images/circle-warn.svg";
interface Props {
  children: string;
  spanStyle?: string;
}
const ErrorSpan = ({ children, spanStyle = "text-12pxr ml-5pxr" }: Props) => {
  return (
    <div className="flex items-center">
      <CircleWarn className="w-[15px] h-[15px]" />
      <span className={`text-red-100 ${spanStyle}`}>{children}</span>
    </div>
  );
};
export default ErrorSpan;
