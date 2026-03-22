'use client'
import CashItem from "./CashItem";

interface ChargeListProps {
  item: any;
  onSetItem: (item: any) => void;
}

const ChargeList = ({item, onSetItem}: ChargeListProps) => {

  return (
    <ul className="mt-5 flex flex-col gap-2">
      <li onClick={() => onSetItem({id: "1", name: "CASH-1000", price: 1000, currency: "KRW"})}>
        <CashItem
          active={item.price === 1000}
          amount={1000}
          price={1000}
          discountAmount={0}
          discountRate={0}
        />
      </li>
      <li onClick={() => onSetItem({id: "2", name: "CASH-5000", price: 5000, currency: "KRW"})}>
        <CashItem
          active={item.price === 5000}
          amount={5000}
          price={5000}
          discountAmount={0}
          discountRate={0}
        />
      </li>
      <li onClick={() => onSetItem({id: "3", name: "CASH-10000", price: 10000, currency: "KRW"})}>
        <CashItem

          active={item.price === 10000}
          amount={10000}
          price={10000}
          discountAmount={0}
          discountRate={0}
        />
      </li>
      <li onClick={() => onSetItem({id: "4", name: "CASH-30000", price: 30000, currency: "KRW"})}>
        <CashItem
          isPopulate
          active={item.price === 30000}
          amount={30000}
          price={30000}
          discountAmount={0}
          discountRate={0}
        />
      </li>
      <li onClick={() => onSetItem({id: "5", name: "CASH-50000", price: 50000, currency: "KRW"})}>
        <CashItem
          isRecommend
          active={item.price === 50000}
          amount={50000}
          price={50000}
          discountAmount={0}
          discountRate={0}
        />
      </li>
      <li onClick={() => onSetItem({id: "6", name: "CASH-100000", price: 100000, currency: "KRW"})}>
        <CashItem
          active={item.price === 100000}
          amount={100000}
          price={100000}
          discountAmount={0}
          discountRate={0}
        />
      </li>
    </ul>
  );
};

export default ChargeList;
