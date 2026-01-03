const CashHowToUse = () => {
  return (
    <div className="border-t mt-7 pt-7">
      <div className="flex flex-col gap-1">
        <span className="text-13pxr font-semibold ">이용 안내</span>
        <ul className="list-outside ml-3 list-disc text-dark-gray-300 mt-2 text-11pxr">
          <li>
            충전하신 캐시로 보고싶은 작품을 구매하거나, 응원하고 싶은 작가에게
            후원할 수 있습니다.
          </li>
          <li>
            법정대리인의 동의 없이 미성년자가 골드를 충전하는 경우, 미성년자
            본인 또는 법정대리인의 충전을 취소할 수 있습니다.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CashHowToUse;
