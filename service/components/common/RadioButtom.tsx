interface Props {
  label: string;
  value: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RadioButton = ({ label, value, name, checked, onChange }: Props) => {
  return (
    <label className="flex w-full items-center cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="hidden peer"
      />
      <span className="w-[15px] md:w-[20px] h-[15px] md:h-[20px] border-[1px] border-light-gray-500 rounded-full peer-checked:border-[5px] peer-checked:border-primary-100 flex items-center justify-center">
        <span className="w-2 h-2 bg-white rounded-full peer-checked:block hidden"></span>
      </span>
      <span className="ml-[7px] text-13pxr md:text-16pxr text-dark-gray-400 peer-checked:text-dark-gray-700">
        {label}
      </span>
    </label>
  );
};

export default RadioButton;
