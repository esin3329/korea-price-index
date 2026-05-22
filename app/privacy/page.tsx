import type { Metadata } from "next";
import InfoPage from "@/app/components/InfoPage";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | Korea Price Index",
  description: "Korea Price Index의 개인정보, 쿠키, 광고 관련 데이터 처리 방침입니다.",
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
            "현재 사이트는 회원가입, 댓글, 결제 기능을 제공하지 않으며 사용자가 직접 입력하는 개인정보를 저장하지 않습니다.",
            "호스팅, 보안, 접속 통계 도구는 IP 주소, 브라우저 정보, 접속 시각 같은 기술 정보를 자동으로 처리할 수 있습니다.",
          ],
        },
        {
          title: "쿠키와 광고",
          body: [
            "향후 Google AdSense를 적용하면 Google과 파트너가 쿠키 또는 유사 기술을 사용해 광고 게재, 광고 측정, 부정 사용 방지에 필요한 정보를 처리할 수 있습니다.",
            "사용자는 브라우저 설정 또는 Google 광고 설정을 통해 맞춤 광고와 쿠키 사용을 관리할 수 있습니다.",
          ],
        },
        {
          title: "문의와 변경",
          body: [
            "개인정보 처리와 광고 고지에 관한 문의는 문의 페이지의 연락처로 보낼 수 있습니다.",
            "정책이 변경되면 이 페이지에 변경 내용을 반영하고, 중요한 변경은 사이트 내에서 알아보기 쉽게 고지합니다.",
          ],
        },
      ]}
    />
  );
}
