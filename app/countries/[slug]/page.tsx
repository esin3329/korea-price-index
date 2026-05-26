import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  countryPages,
  getCountryData,
  getDifferenceSentence,
  siteUrl,
} from "@/app/countries/country-content";
import styles from "@/app/info-page.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return countryPages.map((country) => ({ slug: country.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const country = getCountryData(slug);

  if (!country) {
    return {
      title: "국가별 해설 | Korea Price Index",
    };
  }

  return {
    title: `${country.info.name} GDP 가격수준 해설 | Korea Price Index`,
    description: `${country.info.name}의 한국 기준 GDP 일반 가격수준 지수, CPI 흐름, 데이터 출처를 설명합니다.`,
    alternates: {
      canonical: `${siteUrl}/countries/${country.info.slug}`,
    },
  };
}

export default async function CountryPage({ params }: PageProps) {
  const { slug } = await params;
  const country = getCountryData(slug);

  if (!country) {
    notFound();
  }

  const { info, item, payload } = country;

  return (
    <article className={styles.page}>
      <p className={styles.eyebrow}>Country Analysis</p>
      <h2>{info.name} GDP 가격수준 해설</h2>
      <p className={styles.lead}>
        {info.name}의 한국을 100으로 둔 GDP 기준 일반 가격수준 지수는 {item.indexValue.toFixed(1)}
        입니다. {info.angle}
      </p>

      <section className={styles.section}>
        <h3>핵심 해석</h3>
        <p>
          {getDifferenceSentence(item)} 이 페이지는 EU·AU 지역기구를 제외한 G20 19개
          국가 비교를 대상으로 하며, World Bank WDI의 GDP 가격수준 비율을 한국
          기준으로 재계산한 결과입니다.
        </p>
        <p>
          원자료 가격수준 비율은 {item.rawPriceLevelRatio.toFixed(3)}이며, 기준연도는
          {item.baseYear}년입니다. GDP 기준 일반 가격수준 지수는 생활비 전체를 직접
          측정한 값이 아니며, GDP 기준 구매력평가와 시장환율의 관계를 사용한 국가 간
          상대 지표입니다.
        </p>
      </section>

      <section className={styles.section}>
        <h3>CPI 보조 지표</h3>
        <p>
          IMF WEO 기준 {item.consumerInflationYear}년 평균 소비자물가 상승률 전망은
          {item.consumerInflationRate.toFixed(1)}%입니다. OECD 월간 CPI 전년동월비는
          {item.latestCpiInflationPeriod} 기준 {item.latestCpiInflationRate.toFixed(1)}%입니다.
        </p>
        <p>
          이 CPI 값들은 최근 물가 흐름을 설명하는 보조 정보입니다. GDP 기준 일반
          가격수준 지수와 CPI 상승률은 서로 다른 지표이므로 가격수준 산식에는 CPI를
          넣지 않습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h3>출처</h3>
        <div className={styles.sourceLinks}>
          <a href={payload.sourceUrl}>World Bank WDI</a>
          <a href={payload.consumerInflationSourceUrl}>IMF World Economic Outlook</a>
          <a href={payload.latestCpiInflationSourceUrl}>OECD G20 Consumer Price Indices</a>
        </div>
      </section>
    </article>
  );
}
