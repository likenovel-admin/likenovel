interface ICashUseItemProps {
  category: "charge" | "use" | "used";
  amount: number;
  product_title: string;
  episode_title: string;
  created_date: string;
}

const CashUseItem = ({
  amount,
  category,
  product_title,
  episode_title,
  created_date,
}: ICashUseItemProps) => {
  return (
    <div className="border p-5 w-full rounded-xl md:rounded-3xl">
      <div className="flex justify-between">
        <div className="text-15pxr md:text-16pxr font-medium">{product_title}</div>
        <div
          className={`text-12pxr md:text-14pxr font-normal min-w-10 text-right ${
            category === "used" || category === "use"
              ? "text-[#ff5e03]"
              : "text-[#176bf2]"
          }`}
        >
          {category === "used" || category === "use" ? "사용" : "충전"}
        </div>
      </div>
      <div className="flex justify-between">
        <div className="flex flex-col gap-2">
          <div className="text-dark-gray-400 font-medium text-12pxr md:text-13pxr">
            {episode_title}
          </div>
          <div className="text-dark-gray-400 font-medium text-11pxr md:text-12pxr">
            {created_date}
          </div>
        </div>
        <div className="text-13pxr md:text-16pxr font-semibold">
          {amount.toLocaleString()}원
        </div>
      </div>
    </div>
  );
};

export default CashUseItem;
