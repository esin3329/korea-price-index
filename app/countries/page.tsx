import type { Metadata } from "next";
import Link from "next/link";
import { countryPages } from "@/app/countries/country-content";
import styles from "@/app/info-page.module.css";

export const metadata: Metadata = {
  title: "국가별 해설 | Korea Price Index",
  description: "Korea Price Index의 주요 국가별 GDP 기준 일반 가격수준 지수 해석을 제공합니다.",
  alternates: {
    canonical: "/countries",
  },
};

export default function CountriesPage() {
  return (
    <article className={styles.page}>
      <p className={styles.eyebrow}>Country Analysis</p>
      <h2>국가별 해설</h2>
      <p className={styles.lead}>
        대시보드의 숫자를 국가별 맥락으로 읽을 수 있도록 한국 기준 GDP 일반
        가격수준 지수, CPI 보조 지표, 데이터 출처를 함께 정리했습니다.
      </p>
      <section className={styles.section}>
        <h3>해설 목록</h3>
        <div className={styles.linkGrid}>
          {countryPages.map((country) => (
            <Link key={country.slug} href={`/countries/${country.slug}`}>
              <strong>{country.name}</strong>
              <span>{country.angle}</span>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
