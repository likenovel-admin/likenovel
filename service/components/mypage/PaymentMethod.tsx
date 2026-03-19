import Image from "next/image";

interface PayMethodProps {
  payMethod: string;
  onSetPayMethod: (method: string) => void;
}

const PaymentMethod = ({ payMethod, onSetPayMethod }: PayMethodProps) => {
  const paymentMethods = ["CARD", "TRANSFER", "MOBILE", "EASY_PAY"];
  return (
    <div>
      <div className={"text-20pxr mt-[30px] font-semibold"}>결제수단</div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <PaymentItem
          name="신용카드"
          icon="/images/credit-card.svg"
          onClick={() => onSetPayMethod("CARD")}
          active={payMethod === "CARD"}
        />
        <PaymentItem
          name="실시간 계좌이체"
          icon="/images/account-transfer.svg"
          onClick={() => onSetPayMethod("TRANSFER")}
          active={payMethod === "TRANSFER"}
        />
        <PaymentItem
          name="가상계좌"
          icon="/images/deposit.svg"
          onClick={() => onSetPayMethod("VIRTUAL_ACCOUNT")}
          active={payMethod === "VIRTUAL_ACCOUNT"}
        />
        <PaymentItem
          name="휴대폰"
          icon="/images/phone.svg"
          onClick={() => onSetPayMethod("MOBILE")}
          active={payMethod === "MOBILE"}
        />
        <PaymentItem
          name="카카오페이"
          icon="/images/kakao.png"
          onClick={() => onSetPayMethod("KAKAOPAY")}
          active={payMethod === "KAKAOPAY"}
        />
      </div>
    </div>
  );
};

interface IPaymentItem {
  name: string;
  icon: string;
  onClick: () => void;
  active?: boolean;
}
const PaymentItem = ({ icon, name, onClick, active }: IPaymentItem) => {
  return (
    <button
      onClick={onClick}
      className={`border box-border rounded-xl p-3 h-[68px] flex items-center gap-2 ${
        active ? "border-2 border-primary-100" : ""
      }`}
    >
      <div className="relative w-[28px] h-[32px]">
        <Image src={icon} fill alt="name" objectFit="contain" />
      </div>
      <span className="text-12pxr md:text-18pxr">{name}</span>
    </button>
  );
};

export default PaymentMethod;
