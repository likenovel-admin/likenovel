import RequestFormArea from "./RequestFormArea";

const RequestEditor = () => {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 pb-5 md:w-[550px]">
        <div className="text-black-100 text-20pxr md:text-22pxr font-bold gap-3 flex flex-col">
          CP사 입점 & 편집자 자격 신청
          <span className="text-12pxr md:text-14pxr font-normal">
            라이크노벨은 편집자와 CP사 분들의 가입을 기다리고 있습니다.
          </span>
          <div className="text-dark-gray-400 text-12pxr md:text-13pxr whitespace-pre-line font-normal">{`라이크노벨에서 편집자와 CP 자격을 가지고 계시면, 작품에 대한 고급 데이터 접근과
관심있는 작가와 자유롭게 컨텍하실 수 있습니다.
신청해주시면 담당자가 영업일 5일 이내로 연락드리겠습니다`}</div>
        </div>
      </div>
      <div className="h-[10px] bg-light-gray-100"></div>
      <RequestFormArea />
    </div>
  );
};

export default RequestEditor;
