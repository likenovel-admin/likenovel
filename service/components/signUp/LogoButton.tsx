import { useRouter } from "next/navigation";
import LogoIcon from "/public/images/logos/logo-icon.svg";
import Logo from "/public/images/logos/logo.svg";
const LogoButton = () => {
  const router = useRouter();
  return (
    <button
      type="button"
      className="flex justify-center items-end gap-12pxr mt-10pxr"
      onClick={() => router.push("/")}
    >
      <LogoIcon className="w-[20px] md:w-[30px] md:h-[38px]" />
      <Logo className="w-[120px] md:w-[150px] md:h-[20px]" />
    </button>
  );
};
export default LogoButton;
