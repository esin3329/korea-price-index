import type { Metadata } from "next";
import InfoPage from "@/app/components/InfoPage";

export const metadata: Metadata = {
  title: "면책 고지 | Korea Price Index",
  description: "Korea Price Index 데이터와 해석의 사용 범위 및 한계를 고지합니다.",
  alternates: {
    canonical: "/disclaimer",
  },
};

export default function DisclaimerPage() {
  return (
    <InfoPage
      eyebrow="Disclaimer"
      title="면책 고지"
      lead="Korea Price Index의 데이터와 해석은 공개 통계 기반 참고 정보이며, 공식 경제 판단이나 전문 자문을 대체하지 않습니다."
      sections={[
        {
          title: "정보의 성격",
          body: [
            "사이트의 수치와 설명은 공개 데이터 출처를 기반으로 재가공한 참고 정보입니다. 국가 간 가격수준 차이를 이해하기 쉽게 보여주는 목적이며, 특정 정책이나 시장 판단을 권고하지 않습니다.",
            "투자, 정책 결정, 법률 또는 세무 판단에는 해당 분야 전문가와 공식 기관의 최신 자료를 함께 확인해야 합니다.",
          ],
        },
        {
          title: "정확성과 갱신",
          body: [
            "공식 데이터 제공 기관의 수정, 발표 지연, API 장애, 환율 및 구매력평가 계산 변경에 따라 표시 값이 달라질 수 있습니다.",
            "사이트는 데이터 출처와 갱신 시각을 표시하지만 모든 정보의 실시간 정확성이나 완전성을 보장하지 않습니다.",
          ],
        },
        {
          title: "외부 서비스",
          body: [
            "사이트는 World Bank, IMF, OECD 등 외부 데이터 출처를 참조하지만 해당 기관과 공식 제휴 관계를 의미하지 않습니다.",
            "광고 또는 외부 링크가 표시될 경우, 해당 외부 사이트의 콘텐츠와 정책은 각 운영 주체의 책임입니다.",
          ],
        },
      ]}
    />
  );
}
