export default function AdPage() {
  return (
    <div className="w-full max-w-[1120px] mx-auto flex flex-col px-4 md:px-0 md:mt-8 gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">알림 수신 동의</h1>
        <p className="text-base leading-6">
          라이크노벨에서 제공하는 이벤트 및 서비스(제휴 서비스 포함) 안내 등
          광고성 정보를 받으시려면 혜택 정보 이용에 동의하여 주시기 바랍니다.
        </p>
      </div>
      <div className="">
        <h2 className="text-lg font-semibold mb-3">선택 정보 수집 항목</h2>
        <table className="w-full border-collapse border border-gray-300 text-left text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-gray-300 p-2">항목</th>
              <th className="border border-gray-300 p-2">목적</th>
              <th className="border border-gray-300 p-2">보유 및 이용기간</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2">
                이메일, 휴대폰 번호
              </td>
              <td className="border border-gray-300 p-2">
                이벤트 혜택 및 정보 전송
              </td>
              <td className="border border-gray-300 p-2">
                제공하는 이벤트/혜택 등 다양한 정보를 발송하기 위해 이메일 및
                휴대폰 번호를 수집하며, 회원탈퇴 후 30일 보관 후 파기합니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <p className="text-sm text-gray-600">
          이용자는 이벤트/혜택 등 다양한 정보 수신을 위한 이메일 주소 수집 및
          이용 동의를 거부할 권리가 있습니다. 다만, 이벤트/혜택 정보 메일을
          받으실 수 없습니다.
        </p>
      </div>
    </div>
  );
}
