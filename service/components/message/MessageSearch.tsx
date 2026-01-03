import Close from "/public/images/close.svg";
import Search from "/public/images/search.svg";

interface Props {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
const MessageSearch = ({ onChange, value }: Props) => {
  return (
    <div className={`relative w-full search-bar mt-2`}>
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="닉네임 입력"
          className={`w-full h-[42px] p-2 pl-28pxr border border-light-gray-600 rounded-[100px] focus:outline-none focus:border-primary-100 shadow-md`}
          maxLength={50}
          value={value}
          onChange={onChange}
        />
        {value && (
          <button className="flex justify-center items-center absolute right-[60px] w-[16px] h-[16px] bg-dark-gray-400 rounded-full hover:bg-dark-gray-100">
            <Close className="text-white w-[6px]" />
          </button>
        )}
        <button className="absolute right-[25px]">
          <Search className="w-[20px] h-[20px] hover:text-primary-100" />
        </button>
      </div>
    </div>
  );
};

export default MessageSearch;
