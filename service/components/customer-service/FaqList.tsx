import { useGetFaq, useGetFaqCategories } from "@/app/api/query/faq";
import { useMemo, useState } from "react";
import Pagination from "../common/Pagination";
import Spinner from "../common/Spinner";
import Tab from "../common/Tab";
import ArrowDown from "/public/images/arrow-down.svg";

const FaqList = () => {
  const [tabName, setTabName] = useState("all");
  const [page, setPage] = useState(1);
  const countPerPage = 10;
  const { data: categoriesData } = useGetFaqCategories();

  const { data, isLoading } = useGetFaq(
    tabName === "all" ? "" : tabName,
    page,
    countPerPage
  );
  console.log("data", data);

  const filteredData = useMemo(
    () =>
      data?.data?.items
        ? data?.data?.items.filter((notice: IFaqItemProps) => {
            if (tabName === "all") return true;
            return notice.type === tabName;
          })
        : [],
    [data?.data?.items, tabName]
  );

  const totalPages = data
    ? Math.ceil(data?.data?.totalItems / countPerPage)
    : 0;
  const faqTabs = useMemo(
    () => [
      { label: "전체", value: "all" },
      ...((categoriesData?.data?.items ?? [])
        .filter((category) => category.code !== "common")
        .map((category) => ({
          label: category.name,
          value: category.code,
        })) as CommonSelectItem[]),
    ],
    [categoriesData?.data?.items]
  );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTabChange = (newTab: string) => {
    setTabName(newTab);
    setPage(1);
  };

  return (
    <>
      <div className="text-18pxr md:text-24pxr font-bold w-full border-b pb-2 md:pb-4">
        자주묻는 질문
        <div className="pt-3 pb-1">
          <Tab
            tabs={faqTabs}
            style="check"
            activeTab={tabName}
            onTabChange={handleTabChange}
          />
        </div>
      </div>
      <ul>
        {isLoading ? (
          <li className="flex justify-center items-center py-10">
            <Spinner size={20} />
          </li>
        ) : filteredData?.length === 0 ? (
          <li className="flex justify-center items-center py-10 text-gray-400">
            데이터가 없습니다
          </li>
        ) : (
          filteredData?.map((notice: IFaqItemProps) => (
            <li key={notice.id}>
              <FaqItem {...notice} />
            </li>
          ))
        )}
      </ul>
      {!isLoading && data && totalPages > 1 && (
        <div className="mt-8 mb-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
};

interface IFaqItemProps {
  question: string;
  answer: string;
  type: string;
  typeName?: string;
  id: number;
}
const FaqItem = ({ question, answer, type, typeName, id }: IFaqItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const typeKor =
    type === "common" ? "" : typeName ? `[${typeName}]` : type ? `[${type}]` : "";

  return (
    <details
      className="w-full flex flex-col justify-between items-left"
      open={isOpen}
      onToggle={(e) => setIsOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="font-medium flex gap-2 items-center">
        <div
          className={`flex justify-between w-full ${
            isOpen ? "" : "border-b"
          } py-3 md:py-5 text-15pxr md:text-18pxr `}
        >
          <div className="flex gap-2 items-center">
            <div className="w-[30px] h-[30px] bg-light-gray-100 rounded-full inline-flex justify-center items-center">
              Q
            </div>
            <span className="">{`${typeKor} ${question}`}</span>
          </div>
          <button className={`${isOpen ? "" : "transform rotate-180"}`}>
            <ArrowDown className={`w-[10px] h-[7px] text-gray-400`} />
          </button>
        </div>
      </summary>
      <div className="bg-gray-100 mx-[-16px] md:mx-0 border-t py-3 px-6 md:py-6 md:px-8 flex gap-2">
        <div>
          <div className="w-[30px] h-[30px] text-14pxr bg-white rounded-full inline-flex justify-center items-center text-primary-100">
            A
          </div>
        </div>
        <div
          className="text-16pxr text-gray-500 leading-6 break-words [&_p]:m-0 [&_p:not(:last-child)]:mb-1 [&_p:empty]:min-h-[1.5em] [&_ul]:pl-6 [&_ul]:list-disc [&_ol]:pl-6 [&_ol]:list-decimal [&_blockquote]:pl-3.5 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_strong]:font-bold [&_em]:italic [&_u]:underline"
          dangerouslySetInnerHTML={{ __html: answer }}
        />
      </div>
    </details>
  );
};

export default FaqList;
