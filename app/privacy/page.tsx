import type { Metadata } from "next";
import InfoPage from "@/app/components/InfoPage";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | Korea Price Index",
  description: "Korea Price Index의 개인정보, 쿠키, 광고 관련 데이터 처리 방침입니다.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Privacy"
      title="개인정보 처리방침"
      lead="Korea Price Index는 서비스 제공과 품질 개선에 필요한 범위에서만 정보를 처리하며, 광고를 운영할 경우 Google AdSense 관련 고지를 이 페이지에 유지합니다."
      sections={[
        {
          title: "수집하는 정보",
          body: [
            "현재 사이트는 회원가입, 댓글, 결제 기능을 제공하지 않으며 사용자가 직접 입력하는 개인정보를 저장하지 않습니다. 문의는 GitHub Issues 또는 별도 연락처를 통해 사용자가 자발적으로 제공한 내용만 확인합니다.",
            "호스팅, 보안, 접속 통계 처리 과정에서 IP 주소, 브라우저 정보, 접속 시각 같은 기술 정보가 자동으로 처리될 수 있습니다. 이 정보는 서비스 안정성 확인, 악성 사용 방지, 오류 분석 목적으로만 사용합니다.",
          ],
        },
        {
          title: "쿠키와 Google AdSense",
          body: [
            "향후 Google AdSense를 적용하면 Google을 포함한 제3자 광고 사업자가 쿠키를 사용해 사용자의 이 사이트 또는 다른 웹사이트 방문 기록을 바탕으로 광고를 게재할 수 있습니다.",
            "Google의 광고 쿠키 사용은 Google과 파트너가 사용자의 이 사이트 및 인터넷상의 다른 사이트 방문 정보를 기반으로 광고를 제공하는 데 사용될 수 있습니다. 개인 맞춤 광고를 원하지 않는 경우 Google 광고 설정에서 맞춤 광고를 해제할 수 있습니다.",
          ],
        },
        {
          title: "제3자 광고 사업자",
          body: [
            "Google 외의 제3자 광고 네트워크가 사용되는 경우 해당 사업자도 쿠키 또는 유사 기술을 사용할 수 있습니다. 사용자는 각 광고 사업자의 웹사이트나 업계 opt-out 도구를 통해 개인 맞춤 광고 사용을 관리할 수 있습니다.",
            "광고 스크립트가 추가되더라도 Korea Price Index는 사용자의 이름, 이메일, 전화번호 같은 직접 식별 정보를 광고 사업자에게 직접 제공하지 않습니다.",
          ],
        },
        {
          title: "문의와 변경",
          body: [
            "개인정보 처리와 광고 고지에 관한 문의는 문의 페이지에 안내된 운영자 연락처로 보낼 수 있습니다. 정책이 변경되면 이 페이지의 내용을 갱신하고 중요한 변경 사항은 사이트에서 확인하기 쉽게 반영합니다.",
            "이 방침은 대한민국 시간 기준 2026년 5월 24일부터 적용됩니다.",
          ],
        },
      ]}
    />
  );
}
