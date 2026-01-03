const OperationPolicyModal = () => {
  return (
    <div className="flex flex-col gap-20pxr px-20pxr">
      <div>
        <h1 className="text-20pxr md:text-30pxr font-bold mb-15pxr">
          운영정책
        </h1>
        <p className="text-15pxr md:text-18pxr">
          LIKENOVEL은 글로벌 서브컬쳐 시장에서 경쟁력 있는 스토리텔링 IP가
          지속적으로 창작될 수 있는 &apos;창작 인프라스트럭쳐&apos;를 건설,
          운영한다는 비전을 갖고 있습니다.
        </p>
        <p className="text-15pxr md:text-18pxr">
          따라서 플랫폼 내 작가와 독자 분들을 서로 신뢰하고 존중할 수 있는
          플랫폼 생태계를 구축하고자 합니다. 아래 운영 가이드라인을 성실하게
          준수하시면서 모두에게 더 안전하고 즐거운 플랫폼 문화가 형성될 수
          있도록 부탁 드립니다.
        </p>
      </div>
      <div>
        <h2 className="text-15pxr md:text-18pxr font-bold mb-12pxr">
          1. 서비스 이용 가이드
        </h2>
        <p className="text-15pxr md:text-18pxr">
          원칙적으로 LikeNovel은 만 14세 이상의 이용자만 회원가입 및 이용하실 수
          있습니다. 단, 법정대리인(부모 등)의 동의를 저희에게 전달해 주실 경우에
          한해 회원가입 및 이용하실 수 있습니다. 자세한 내용은 [이용약관]을
          참고해 주세요
        </p>
      </div>
      <div>
        <h2 className="text-15pxr md:text-18pxr font-bold mb-12pxr">
          2. 부정 이용에 대한 신고
        </h2>
        <p className="text-15pxr md:text-18pxr">
          부적절한 콘텐츠를 발견하면 FOOTER(홈페이지 하단)영역에 있는
          메일주소(admin@likenovel.net)를 통해 신고해주십시오. 악의적인 이용자는
          빠른 시일 내에 조치를 취해드리겠습니다. 다음은 부정 이용에 관한
          신고기준입니다. 자세한 내용은 이용가이드를 참고해주세요
        </p>
        <p className="text-15pxr md:text-18pxr">①성적인 콘텐츠</p>
        <p className="text-15pxr md:text-18pxr">
          LikeNovel은 만 14세 이상의 연령대가 즐길 수 있는 라이트노벨 연재
          플랫폼을 지향하고 있습니다. 따라서 노골적인 성행위를 묘사하는 글이나
          이미지 등 법적으로 음란물의 소지가 있는 콘텐츠를 게시할 경우
          아동ㆍ청소년의 성보호에 관한 법률 제 17조에 의거해 운영진의 적법한
          제재조치를 시행할 수 있음을 알려드립니다.
        </p>
        <p className="text-15pxr md:text-18pxr">
          가령 캐릭터의 성행위나 노골적인 성기 부위 묘사, 지나친 학대 및
          잔인성을 포함하지 않은 콘텐츠 창작을 부탁 드리며, 그 외로 별다른
          규제는 하고 있지 않습니다. 단, 아동ㆍ청소년을 성적 대상으로 노골적으로
          묘사하거나 범죄를 알선하는 행위는 명확하게 제한을 두고 있습니다.
        </p>
        <p className="text-15pxr md:text-18pxr">②유해하거나 불법적인 콘텐츠</p>
        <p className="text-15pxr md:text-18pxr">
          폭력, 자해, 자살, 죽음 등을 불필요하게 구체적으로 표현하거나 미화하는
          행위를 금합니다. 불법적인 정보를 모방 가능한 정도로 제공하여 범죄를
          조장하면 서비스 이용이 제한될 수 있습니다.
        </p>
        <p className="text-15pxr md:text-18pxr">③불쾌감을 일으키는 콘텐츠</p>
        <p className="text-15pxr md:text-18pxr">
          개인이나 단체를 향한 차별, 혐오를 선동하거나 비인간적으로 공격하여
          다른 사람에게 불쾌감을 일으키지 않도록 유의하세요.
        </p>
        <p className="text-15pxr md:text-18pxr">④저작권 및 권리 침해</p>
        <p className="text-15pxr md:text-18pxr">
          LikeNovel을 이용하는 모든 고객은 타인의 권리를 존중해야 합니다.
          저작권자의 허락 없이 저작물을 복제/이용하거나 타인의 명예를 훼손하는
          콘텐츠를 게시하면 민형사상 책임을 질 수 있습니다.
        </p>
        <p className="text-15pxr md:text-18pxr">⑤개인정보 보호</p>
        <p className="text-15pxr md:text-18pxr">
          본인 또는 타인의 개인 정보를 노출하는 콘텐츠를 게시하지 마세요.
          악의적인 이용자에 의해 각종 범죄에 악용될 수 있습니다. 또한 당사자의
          동의를 받았더라도 민감한 개인정보를 함부로 수집하면 안 됩니다.
        </p>
        <p className="text-15pxr md:text-18pxr">⑥명의 도용 또는 사칭</p>
        <p className="text-15pxr md:text-18pxr">
          다른 사람의 명의를 도용하여 본인 인증하는 것은 중대한 범죄입니다.
          특히, 구매와 환전 과정에서 타인의 명의를 이용하여 우회 또는 적법하지
          않은 경로로 거래하실 경우 민, 형사상 처벌을 받을 수 있음을
          알려드립니다.
        </p>
        <p className="text-15pxr md:text-18pxr">
          또한, 타인의 명의 또는 닉네임을 사칭하여 이용자간 또는 관리자에게
          피해를 초래한 경우 역시 민, 형사상 처벌을 받을 수 있음을 알려드립니다.
        </p>
        <p className="text-15pxr md:text-18pxr">⑦계정 거래</p>
        <p className="text-15pxr md:text-18pxr">
          모든 계정 거래 행위는 허용되지 않습니다. 라이크노벨은 접속 정보를 통해
          거래 정황이 의심되는 계정을 모니터링하고 있습니다. 이러한 악의적
          행위를 지속하면 서비스 이용 제한뿐만 아니라 민형사상 책임을 질 수
          있습니다
        </p>
      </div>
      <div>
        <h2 className="text-15pxr md:text-18pxr font-bold mb-12pxr">
          3. 환불에 대해
        </h2>
        <p className="text-15pxr md:text-18pxr">
          LikeNovel은 소비자 보호에 관한 법률을 준수합니다. 환불 요청하는 양식은
          아래와 같습니다.
        </p>
        <p className="text-15pxr md:text-18pxr">[환불요청 양식]</p>
        <p className="text-15pxr md:text-18pxr">
          환불을 요청하실 경우 다음 항목을 기재하신 후 admin@likenovel.net으로
          메일로 보내주시길 바랍니다. 환불 금액이 입금되기까지 신청일로부터
          영업일 기준 최대 5일 가량 소요될 수 있습니다
        </p>
        <p className="text-15pxr md:text-18pxr">- 닉네임 :</p>
        <p className="text-15pxr md:text-18pxr">- 닉네임에 연동된 이메일 :</p>
        <p className="text-15pxr md:text-18pxr">- 이름 :</p>
        <p className="text-15pxr md:text-18pxr">- 휴대폰번호 :</p>
        <p className="text-15pxr md:text-18pxr">- 결제 수단 :</p>
        <p className="text-15pxr md:text-18pxr">- 결제 금액 :</p>
        <p className="text-15pxr md:text-18pxr">- 결제 날짜/시간 :</p>
        <p className="text-15pxr md:text-18pxr">- 환불하시려는 사유 :</p>
        <p className="text-15pxr md:text-18pxr">
          한편, LikeNovel의 환불 정책은 다음과 같습니다. 이에 대한 자세한 내용은
          [이용약관]을 참고해주세요.
        </p>
        <p className="text-15pxr md:text-18pxr">
          ①이용자가 결제한 코인상품을 사용하고 환불을 신청한 경우
        </p>
        <p className="text-15pxr md:text-18pxr">
          회사는 이용자의 환불신청 시 이용자가 보유한 코인의 잔고(후원 가능한
          코인 잔고)를 1:100비율로 환산한 후 환불 수수료 10%를 제외한 금액을
          환급합니다.
        </p>
        <p className="text-15pxr md:text-18pxr">
          ②이용자가 결제한 코인상품을 사용하지 않고 환불을 신청한 경우
        </p>
        <p className="text-15pxr md:text-18pxr">
          회사는 이용자가 보유한 코인의 잔고(후원가능한 코인 잔고)를 1:100
          비율로 환산한 후 전액환급(결제취소)한다. 단, 결제 후 7일 이내에 환불을
          요청하셔야 합니다.
        </p>
        <p className="text-15pxr md:text-18pxr">③회원 탈퇴 이후의 환불 신청</p>
        <p className="text-15pxr md:text-18pxr">
          회원을 탈퇴하시면, 탈퇴 이전의 코인 내역을 확인 할 수 없습니다. 따라서
          탈퇴하신 경우 원칙적으로 환전이 불가능합니다.
        </p>
        <p className="text-15pxr md:text-18pxr">
          ④이벤트로 얻은 코인을 환불 신청
        </p>
        <p className="text-15pxr md:text-18pxr">
          이벤트 등 무상으로 지급된 코인은 환불이 불가합니다.
        </p>
      </div>
      <div>
        <h2 className="text-15pxr md:text-18pxr font-bold mb-12pxr">
          4. 후원 및 이용에 대해
        </h2>
        <p className="text-15pxr md:text-18pxr">
          회원이 결제한 코인상품으로 마음에 드는 작품과 작가에게 후원하거나,
          유료작품을 이용하실 수 있습니다. 1코인 당 100원(수수료 별도)으로
          결제됩니다. 자세한 내용은 [이용약관]을 참고해 주세요.
        </p>
      </div>
      <div>
        <h2 className="text-15pxr md:text-18pxr font-bold mb-12pxr">
          5. 환전에 대해
        </h2>
        <p className="text-15pxr md:text-18pxr">
          LikeNovel의 작가 분들은 자신이 후원 받은 코인을 자유롭게 환전하여
          수익을 창출하실 수 있습니다. 최소 환전 금액은 10,000원이며 작가 분들의
          원활한 창작 활동을 지원하기 위해 플랫폼 및 결제 수수료는 단 10%만
          부과합니다. (원천징수 세액 3.3%, 타행이체 수수료 500원 별도)
        </p>
        <p className="text-15pxr md:text-18pxr">
          단, 당사의 운영정책에 따라 이후 일부 변동이 있을 수 있습니다.
        </p>
        <p className="text-15pxr md:text-18pxr">
          자세한 내용은 [이용약관]을 참고해 주세요.
        </p>
      </div>
      <div>
        <h2 className="text-15pxr md:text-18pxr font-bold mb-12pxr">
          6. 판매수익에 대해(2021.12.15 추가 개정)
        </h2>
        <p className="text-15pxr md:text-18pxr">
          LikeNovel의 작가 분들은 자신이 쓴 작품의 회차를 자유롭게 판매하여
          수익을 창출하실 수 있습니다. 최소 환전 금액은 10,000원이며 작가 분들의
          원활한 창작 활동을 지원하기 위해 플랫폼 및 결제 수수료는 단 10%만
          부과합니다. (원천징수 세액 3.3%, 타행이체 수수료 500원 별도)
        </p>
        <p className="text-15pxr md:text-18pxr">
          단, 당사의 운영정책에 따라 이후 일부 변동이 있을 수 있습니다.
        </p>
      </div>
    </div>
  );
};
export default OperationPolicyModal;
