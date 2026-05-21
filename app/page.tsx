import styles from "./page.module.css";
import {
  categories,
  countryComparisons,
  methodology,
  overallScore,
} from "./lib/collusionData.mjs";

const sourceLinks = [
  {
    label: "Numbeo Cost of Living 2026",
    href: "https://www.numbeo.com/cost-of-living/rankings_by_country.jsp?title=2026",
  },
  {
    label: "Numbeo methodology",
    href: "https://www.numbeo.com/common/motivation_and_methodology.jsp",
  },
  {
    label: "OECD Price level indices",
    href: "https://www.oecd.org/en/data/indicators/price-level-indices.html",
  },
  {
    label: "OECD Inflation CPI",
    href: "https://www.oecd.org/en/data/indicators/inflation-cpi.html",
  },
];

function riskClass(score: number) {
  if (score >= 75) return styles.riskHigh;
  if (score >= 60) return styles.riskMedium;
  return styles.riskLow;
}

export default function Home() {
  const topCategory = [...categories].sort((a, b) => b.score - a.score)[0];

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.productName}>K-Collusion Index</p>
          <h1>Korean consumer price distortion signal</h1>
          <p className={styles.lede}>
            A composite dashboard that combines Numbeo cost-of-living indicators
            with OECD price-level and CPI concepts to flag where Korean consumer
            prices look unusually pressured.
          </p>
          <p className={styles.caveat}>
            This index does not legally determine collusion. It is a reference
            signal that combines international prices, purchasing power,
            inflation pressure, and competition-risk proxies.
          </p>
        </div>

        <div className={styles.scorePanel} aria-label="K-Collusion overall score">
          <span className={styles.scoreLabel}>Composite distortion signal</span>
          <strong>{overallScore}</strong>
          <span className={styles.scoreScale}>0 low / 100 high</span>
          <div className={styles.scoreBar}>
            <span style={{ width: `${overallScore}%` }} />
          </div>
        </div>
      </section>

      <section className={styles.kpis} aria-label="Summary metrics">
        <article>
          <span>Highest-risk category</span>
          <strong>{topCategory.label}</strong>
          <p>{topCategory.score} points · {topCategory.status}</p>
        </article>
        <article>
          <span>Core basis</span>
          <strong>Numbeo + OECD</strong>
          <p>Cost of living, PPP price levels, CPI pressure</p>
        </article>
        <article>
          <span>Korea baseline</span>
          <strong>Korea = 100</strong>
          <p>Country pressure is normalized against Korea.</p>
        </article>
        <article>
          <span>Interpretation</span>
          <strong>Signal only</strong>
          <p>Flags price distortion risk, not legal liability.</p>
        </article>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Category K-Collusion Score</h2>
          <p>Higher scores indicate categories where price level, inflation pressure, and affordability burden rise together.</p>
        </div>
        <div className={styles.categoryGrid}>
          {categories.map((category) => (
            <article className={styles.categoryCard} key={category.id}>
              <div className={styles.cardTopline}>
                <span>{category.label}</span>
                <b className={riskClass(category.score)}>{category.status}</b>
              </div>
              <div className={styles.categoryScore}>
                <strong>{category.score}</strong>
                <span>/ 100</span>
              </div>
              <p>{category.summary}</p>
              <dl className={styles.miniStats}>
                <div>
                  <dt>Numbeo</dt>
                  <dd>{category.numbeoIndex}</dd>
                </div>
                <div>
                  <dt>Korea-relative</dt>
                  <dd>{category.koreaRelative}</dd>
                </div>
              </dl>
              <ul className={styles.driverList}>
                {category.drivers.map((driver) => (
                  <li key={driver}>{driver}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Country cost-pressure comparison</h2>
          <p>Numbeo 2026 indicators are shown with Korea-relative pressure and local purchasing power context.</p>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Country</th>
                <th>Cost of living</th>
                <th>Groceries</th>
                <th>Purchasing power</th>
                <th>Vs. Korea</th>
              </tr>
            </thead>
            <tbody>
              {countryComparisons.map((row) => (
                <tr key={row.code} className={row.code === "KR" ? styles.koreaRow : undefined}>
                  <td>
                    <span className={styles.countryCode}>{row.code}</span>
                    {row.country}
                  </td>
                  <td>{row.costOfLiving}</td>
                  <td>{row.groceries}</td>
                  <td>{row.localPower}</td>
                  <td>
                    <span className={styles.relativeValue}>{row.relativeToKorea}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.methodology}>
        <div className={styles.sectionHeader}>
          <h2>Formula and limits</h2>
          <p>The score is an analytical weighting model for price distortion signals.</p>
        </div>
        <div className={styles.methodGrid}>
          {methodology.map((item) => (
            <article key={item.label}>
              <span>{item.weight}</span>
              <h3>{item.label}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
        <div className={styles.sources}>
          {sourceLinks.map((source) => (
            <a key={source.href} href={source.href} target="_blank" rel="noreferrer">
              {source.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
