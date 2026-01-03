const QuestNotice = () => {
  return (
    <div className="p-4 bg-light-gray-100 rounded-xl md:w-[630px] md:rounded-t-none md:p-7">
      <span className="text-14pxr font-bold">안내사항</span>
      <ul className="list-disc list-inside mt-2 text-13pxr text-dark-gray-400 [&>li]:marker:text-[0.5em]">
        <li>일일 퀘스트를 달성할 수록 다음 퀘스트의 난이도가 올라갑니다.</li>
        <li>일일 퀘스트의 진행상황은 24시간 간격으로 초기화됩니다.</li>
        <li>한번 참여한 퀘스트는 제한시간이 끝날때까지 다시 참가할 수 없습니다.</li>
        <li>일부 퀘스트 중 다시 참가할 수 없는 퀘스트가 있습니다.(예_본인인증하기)</li>
      </ul>
      <span className="text-13pxr text-orange-400">
        제한시간안에 보상을 수령하셔야 합니다.
      </span>
    </div>
  );
};

export default QuestNotice; 