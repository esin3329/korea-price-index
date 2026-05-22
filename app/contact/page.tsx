import type { Metadata } from "next";
import InfoPage from "@/app/components/InfoPage";

export const metadata: Metadata = {
  title: "문의 | Korea Price Index",
  description: "Korea Price Index 운영자 문의, 데이터 정정 요청, 제휴 문의 안내입니다.",
};

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Contact"
      title="문의"
      lead="데이터 정정, 출처 표기, 서비스 개선, 광고 및 제휴 문의는 아래 연락처로 보낼 수 있습니다."
      sections={[
        {
          title: "연락처",
          body: [
            "GitHub Issues: https://github.com/esin3329/korea-price-index/issues",
            "문의 시 문제가 발생한 페이지 주소, 확인한 날짜, 관련 국가 또는 지표명을 함께 적어주면 더 정확하게 확인할 수 있습니다.",
          ],
        },
        {
          title: "데이터 정정 요청",
          body: [
            "공식 출처의 값과 사이트 표시 값이 다르다고 판단되면 출처 링크와 확인 시점을 함께 보내주세요.",
            "정정이 필요한 경우 월간 데이터 갱신 또는 긴급 패치로 반영합니다.",
          ],
        },
        {
          title: "응답 기준",
          body: [
            "프로젝트는 개인 운영 데이터 서비스이므로 모든 문의에 즉시 답변하지 못할 수 있습니다.",
            "데이터 오류, 개인정보, 광고 정책 관련 문의를 우선적으로 확인합니다.",
          ],
        },
      ]}
    />
  );
}
