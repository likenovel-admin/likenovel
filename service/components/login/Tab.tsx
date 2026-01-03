import { Dispatch, SetStateAction } from "react";

interface Props {
  labels: string[];
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
}

const Tab = ({ labels, activeTab, setActiveTab }: Props) => {
  return (
    // TODO: 추후 디자인 나오는 거 보고 공통 탭으로 뺄지 결정 필요
    <>
      {labels.map((label) => (
        <button
          key={label}
          className={`${
            activeTab === label ? "bg-blue-500" : "bg-gray-400"
          }  px-4 py-2 rounded`}
          onClick={() => setActiveTab(label)}
        >
          {label}
        </button>
      ))}
    </>
  );
};
export default Tab;
