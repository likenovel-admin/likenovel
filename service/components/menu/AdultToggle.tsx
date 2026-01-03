import useAuthStore from "@/store/authStore";
import { IUser } from "@/types";
import { getUser } from "@/utils/getUser";

const AdultToggle = () => {
  const user = getUser();
  const { setState } = useAuthStore();

  const toggle = () => {
    setState({
      user: {
        ...user!,
        isOnAdult: !user!.isOnAdult,
      } as IUser,
    });
  };

  if (!user || !user.isAdult) return null;

  return (
    <div className="flex items-center">
      <button
        onClick={toggle}
        className={`relative flex items-center justify-between border-[1px] rounded-full w-[42px] h-[22px] transition-all duration-300 p-[2px] ${
          user.isOnAdult ? "border-red-100" : "border-dark-gray-400"
        }`}
      >
        <span
          className={`absolute text-9pxr font-semibold ${
            user.isOnAdult
              ? "text-red-100 left-[4px]"
              : "text-dark-gray-400 left-[21px]"
          }`}
        >
          {user.isOnAdult ? "ON" : "OFF"}
        </span>
        <div
          className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-transform duration-300 transform ${
            user.isOnAdult
              ? "translate-x-[19px] bg-red-100"
              : "translate-x-[-1px] bg-dark-gray-400"
          }`}
        >
          <span className={`text-9pxr text-white font-medium`}>19</span>
        </div>
      </button>
    </div>
  );
};
export default AdultToggle;
