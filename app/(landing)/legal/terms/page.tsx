export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">서비스 이용약관</h1>
            {/* <p className="text-muted-foreground">최종 수정일: 2024년 1월 15일</p> */}
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">제1조 (목적)</h2>
                <p className="text-muted-foreground leading-relaxed">
                  본 약관은 ViralChef 서비스(이하 "서비스")의 이용에 관한 조건과 절차, 회사와 이용자 간의 권리와 의무 등을 규정함을 목적으로 합니다.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제2조 (정의)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    본 약관에서 사용하는 용어의 정의는 다음과 같습니다:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>"서비스"라 함은 회사가 제공하는 ViralChef AI 콘텐츠 생성 및 소셜미디어 발행 서비스를 의미합니다.</li>
                    <li>"이용자"라 함은 본 약관에 따라 서비스를 이용하는 회원을 의미합니다.</li>
                    <li>"회원"이라 함은 서비스에 개인정보를 제공하여 회원등록을 한 자로서, 서비스의 정보를 지속적으로 제공받으며, 서비스를 계속적으로 이용할 수 있는 자를 의미합니다.</li>
                    <li>"AI 콘텐츠"라 함은 서비스의 인공지능 기술을 통해 생성된 텍스트, 이미지 등의 디지털 콘텐츠를 의미합니다.</li>
                    <li>"연동 계정"이라 함은 Threads 등 외부 소셜미디어 플랫폼과 연결된 계정을 의미합니다.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제3조 (약관의 효력 및 변경)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 본 약관은 서비스 화면에 게시하여 공시함으로써 효력이 발생합니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있으며, 약관이 변경되는 경우 변경된 약관의 적용일자 및 변경내용, 변경사유 등을 명시하여 적용일자 7일 전부터 서비스 내 공지사항을 통해 공지합니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    3. 이용자는 변경된 약관에 동의하지 않을 권리가 있으며, 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 회원탈퇴를 할 수 있습니다.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제4조 (서비스의 제공)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 회사는 다음과 같은 서비스를 제공합니다:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>AI 기반 Threads 콘텐츠 자동 생성</li>
                    <li>생성된 콘텐츠 편집 및 관리</li>
                    <li>Threads 계정 연동 및 자동 발행</li>
                    <li>콘텐츠 예약 발행</li>
                    <li>콘텐츠 분석 및 통계</li>
                    <li>기타 회사가 추가로 개발하거나 제휴계약 등을 통해 제공하는 서비스</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 하나, 시스템 점검 및 기타 정당한 사유가 있는 경우 서비스 제공을 일시 중단할 수 있습니다.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제5조 (회원가입 및 계정 관리)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 서비스 이용을 위해서는 회원가입이 필요하며, 회원가입은 서비스에서 제공하는 절차에 따라 진행됩니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 이용자는 정확하고 최신의 정보를 제공해야 하며, 허위 정보 제공 시 서비스 이용이 제한될 수 있습니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    3. 이용자는 계정 정보의 보안을 유지할 책임이 있으며, 타인의 무단 사용을 방지해야 합니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    4. 계정의 무단 사용을 발견한 경우 즉시 회사에 통지해야 합니다.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제6조 (외부 계정 연동)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 이용자는 서비스 이용을 위해 Threads 등 외부 소셜미디어 계정을 연동할 수 있습니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 외부 계정 연동 시 해당 플랫폼의 이용약관 및 개인정보처리방침을 준수해야 합니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    3. 회사는 연동된 외부 계정을 통해 이용자가 승인한 범위 내에서만 활동을 수행합니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    4. 외부 계정 연동 해제는 언제든지 가능하며, 해제 시 관련 서비스 이용이 제한될 수 있습니다.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제7조 (AI 콘텐츠 생성 및 이용)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 서비스는 AI 기술을 활용하여 콘텐츠를 생성하며, 생성된 콘텐츠의 정확성이나 완전성을 보장하지 않습니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 이용자는 AI가 생성한 콘텐츠를 검토하고 편집할 책임이 있으며, 최종 발행 전 내용을 확인해야 합니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    3. AI 생성 콘텐츠에 대한 저작권은 이용자에게 있으나, 제3자의 권리를 침해하지 않을 책임은 이용자에게 있습니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    4. 이용자는 생성된 콘텐츠가 관련 법령 및 플랫폼 정책을 준수하는지 확인해야 합니다.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제8조 (이용자의 의무)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    이용자는 다음 행위를 하여서는 안 됩니다:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>타인의 개인정보를 도용하거나 허위 정보를 등록하는 행위</li>
                    <li>서비스의 안정적 운영을 방해하는 행위</li>
                    <li>관련 법령을 위반하거나 미풍양속에 반하는 콘텐츠 생성 및 발행</li>
                    <li>타인의 지적재산권을 침해하는 콘텐츠 생성 및 발행</li>
                    <li>스팸, 광고, 혐오 발언 등 부적절한 콘텐츠 생성 및 발행</li>
                    <li>서비스를 상업적 목적으로 무단 이용하는 행위</li>
                    <li>서비스의 소스코드나 데이터를 무단으로 복제, 배포하는 행위</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제9조 (개인정보 보호)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 회사는 이용자의 개인정보를 중요시하며, 개인정보보호법 등 관련 법령을 준수합니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 개인정보의 수집, 이용, 제공, 관리 등에 관한 사항은 별도의 개인정보처리방침에 따릅니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    3. 서비스 이용 과정에서 생성되는 콘텐츠와 관련된 데이터는 서비스 개선 목적으로 활용될 수 있습니다.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제10조 (서비스 이용 제한)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 회사는 이용자가 본 약관을 위반하거나 서비스의 정상적인 운영을 방해한 경우 서비스 이용을 제한할 수 있습니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 서비스 이용 제한 시 회사는 이용자에게 사전 통지하는 것을 원칙으로 하나, 긴급한 경우 사후 통지할 수 있습니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    3. 이용자는 서비스 이용 제한에 대해 이의가 있는 경우 회사에 이의신청을 할 수 있습니다.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제11조 (면책조항)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    3. 회사는 AI가 생성한 콘텐츠의 정확성, 완전성, 신뢰성에 대해 보장하지 않으며, 이로 인한 손해에 대해 책임을 지지 않습니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    4. 회사는 이용자가 서비스를 통해 얻은 정보나 자료 등으로 인한 손해에 대해 책임을 지지 않습니다.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제12조 (분쟁해결)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 서비스 이용과 관련하여 회사와 이용자 간에 분쟁이 발생한 경우, 상호 협의를 통해 해결하는 것을 원칙으로 합니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 협의를 통해 해결되지 않는 분쟁에 대해서는 회사 소재지를 관할하는 법원을 관할법원으로 합니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    3. 본 약관에 관한 준거법은 대한민국 법률로 합니다.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">제13조 (기타)</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    1. 본 약관에 명시되지 않은 사항은 관련 법령에 따라 처리됩니다.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    2. 본 약관의 일부 조항이 법적으로 무효화되더라도 나머지 조항의 효력에는 영향을 미치지 않습니다.
                  </p>
                </div>
              </section>

              <section className="mt-12 pt-8 border-t">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">문의사항</h3>
                  <div className="text-muted-foreground">
                    {/* <p>회사명:  Inc.</p> */}
                    <p>서비스명: ViralChef</p>
                    <p>이메일: kee71164@gmail.com</p>
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
