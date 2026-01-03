'use client'
import CashItem from "./CashItem";

interface ChargeListProps {
  item: any;
  onSetItem: (item: any) => void;
}

const ChargeList = ({item, onSetItem}: ChargeListProps) => {

  return (
    <ul className="mt-5 flex flex-col gap-2">
      <li onClick={() => onSetItem({id: "1", name: "CASH-1100", price: 1000, currency: "KRW"})}>
        <CashItem
          active={item.price === 1000}
          amount={1100}
          price={1000}
          discountAmount={0}
          discountRate={0}
        />
      </li>
      <li onClick={() => onSetItem({id: "2", name: "CASH-5500", price: 5000, currency: "KRW"})}>
        <CashItem
          active={item.price === 5000}
          amount={5500}
          price={5000}
          discountAmount={0}
          discountRate={0}
        />
      </li>
      <li onClick={() => onSetItem({id: "3", name: "CASH-11000", price: 10000, currency: "KRW"})}>
        <CashItem

          active={item.price === 10000}
          amount={11000}
          price={10000}
          discountAmount={0}
          discountRate={0}
        />
      </li>
      <li onClick={() => onSetItem({id: "4", name: "CASH-33000", price: 30000, currency: "KRW"})}>
        <CashItem
          isPopulate
          active={item.price === 30000}
          amount={33000}
          price={30000}
          discountAmount={0}
          discountRate={0}
        />
      </li>
      <li onClick={() => onSetItem({id: "5", name: "CASH-55000", price: 50000, currency: "KRW"})}>
        <CashItem
          isRecommend
          active={item.price === 50000}
          amount={55000}
          price={50000}
          discountAmount={0}
          discountRate={0}
        />
      </li>
      <li onClick={() => onSetItem({id: "6", name: "CASH-110000", price: 100000, currency: "KRW"})}>
        <CashItem
          active={item.price === 100000}
          amount={110000}
          price={100000}
          discountAmount={0}
          discountRate={0}
        />
      </li>
    </ul>
  );
};

export default ChargeList;
