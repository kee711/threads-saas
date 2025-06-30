export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">개인정보 처리방침</h1>
            {/* <p className="text-muted-foreground">최종 수정일: 2025년 4월</p> */}
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">제1조 (목적)</h2>
                <p className="text-muted-foreground leading-relaxed">
                  본 서비스(이하 "서비스")는 사용자의 개인정보를 중요시하며 개인정보 보호를 위해 최선을 다하고 있습니다. 본 방침은 서비스 이용 시 제공하거나 수집되는 개인정보의 처리에 관한 사항을 명시합니다.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제2조 (수집하는 개인정보 항목)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    서비스는 Facebook OAuth 로그인을 통해 다음과 같은 개인정보를 수집할 수 있습니다:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>이름</li>
                    <li>이메일 주소</li>
                    <li>프로필 사진</li>
                  </ul>
                  <p> Goole 로그인을 통해 다음과 같은 개인정보를 수집할 수 있습니다: </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>이름</li>
                    <li>이메일 주소</li>
                    <li>프로필 사진</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제3조 (개인정보 수집 및 이용 목적)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    서비스는 다음 목적으로만 개인정보를 수집합니다:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>회원 식별 및 관리</li>
                    <li>서비스 제공 및 유지</li>
                    <li>사용자와의 원활한 의사소통</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제4조 (개인정보의 보유 및 이용 기간)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 사용자의 개인정보는 서비스 이용 기간 동안만 보유합니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 이용자가 계정을 삭제하거나 탈퇴를 요청할 경우 지체 없이 파기됩니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    3. 단, 관련 법령에 의해 보존이 필요한 경우에는 해당 기간 동안 보관할 수 있습니다.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제5조 (개인정보의 제3자 제공)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 서비스는 이용자의 사전 동의 없이는 이용자의 개인정보를 외부에 제공하지 않습니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 단, 다음의 경우에는 예외로 합니다:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                    <li>통계작성, 학술연구 또는 시장조사를 위하여 필요한 경우로서 특정 개인을 알아볼 수 없는 형태로 제공하는 경우</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제6조 (개인정보 처리 위탁)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 서비스는 개인정보 처리 업무를 위탁하지 않습니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 향후 개인정보 처리 위탁이 필요한 경우, 위탁업체와 위탁업무 내용을 사전에 고지하고 동의를 받겠습니다.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제7조 (이용자 및 법정대리인의 권리와 행사 방법)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 이용자는 언제든지 본인의 개인정보에 대한 다음 권리를 행사할 수 있습니다:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>개인정보 처리현황에 대한 조회</li>
                    <li>개인정보의 수정 및 삭제</li>
                    <li>개인정보 처리정지 요구</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 위 권리 행사는 개인정보 보호책임자에게 서면, 전화, 전자우편 등을 통하여 하실 수 있으며, 서비스는 이에 대해 지체 없이 조치하겠습니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    3. 14세 미만 아동의 경우, 법정대리인이 아동의 개인정보에 관한 권리를 행사할 수 있습니다.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제8조 (데이터 삭제 요청 방법)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 이용자는 언제든 자신의 개인정보 삭제를 요청할 수 있습니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 개인정보 삭제 요청은 다음 이메일로 연락하여 처리할 수 있습니다:
                  </p>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-muted-foreground font-medium">
                      데이터 삭제 요청 이메일: <a href="mailto:kee71164@gmail.com" className="text-primary hover:underline">kee71164@gmail.com</a>
                    </p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    3. 이메일로 데이터 삭제 요청 시 신속히 처리하겠습니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    4. 삭제 요청 시 본인 확인을 위해 추가 정보를 요청할 수 있습니다.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제9조 (개인정보 보호책임자)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-muted-foreground font-medium">
                      개인정보 보호책임자 연락처: <a href="mailto:kee71164@gmail.com" className="text-primary hover:underline">kee71164@gmail.com</a>
                    </p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 개인정보와 관련된 문의나 불만사항은 위 이메일로 연락해주시기 바랍니다.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제10조 (개인정보의 안전성 확보조치)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    서비스는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>개인정보의 암호화</li>
                    <li>해킹 등에 대비한 기술적 대책</li>
                    <li>개인정보에 대한 접근 제한</li>
                    <li>접근통제시스템 설치 및 접근권한의 제한·조치</li>
                    <li>개인정보를 취급하는 직원의 최소화 및 교육</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제11조 (개인정보 처리방침의 변경)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 이 개인정보 처리방침은 2025년 4월부터 적용됩니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 개인정보 처리방침이 변경되는 경우, 변경사항을 서비스 내 공지사항을 통해 공지하겠습니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    3. 중요한 변경사항의 경우 이메일 등을 통해 개별 통지할 수 있습니다.
                  </p>
                </div>
              </section>

              <section className="mt-12 pt-8 border-t">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">문의사항</h3>
                  <div className="text-muted-foreground">
                    {/* <p>회사명 Inc.</p> */}
                    <p>서비스명: ViralChef</p>
                    <p>개인정보 보호책임자: <a href="mailto:kee71164@gmail.com" className="text-primary hover:underline">kee71164@gmail.com</a></p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
