"use client";

import { useEffect, useMemo, useState } from "react";
import BarChart from "@/app/components/BarChart";
import ErrorDisplay from "@/app/components/ErrorDisplay";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import RankingTable from "@/app/components/RankingTable";
import { ChartDataItem, KCollusionIndex } from "@/app/types/oecd";
import styles from "./DashboardClient.module.css";

type DataFile = {
  success: boolean;
  data?: KCollusionIndex[];
  error?: string;
  timestamp?: string;
  baseYear?: number;
  source?: string;
  sourceUrl?: string;
  indicatorCode?: string;
  indicatorName?: string;
  datasetType?: string;
  methodology?: string;
  expectedCountryCount?: number;
  officialCountryCount?: number;
  missingCountries?: string[];
  hasIncompleteOfficialPull?: boolean;
  isFallback?: boolean;
  consumerInflationYear?: number;
  consumerInflationSource?: string;
  consumerInflationSourceUrl?: string;
  consumerInflationIndicatorCode?: string;
  consumerInflationIndicatorName?: string;
  consumerInflationVintage?: string;
  consumerInflationPublicationDate?: string;
  consumerInflationMethodology?: string;
  consumerInflationIsForecast?: boolean;
  consumerInflationIsFallback?: boolean;
  latestCpiInflationYear?: number;
  latestCpiInflationPeriod?: string;
  latestCpiInflationSource?: string;
  latestCpiInflationSourceUrl?: string;
  latestCpiInflationIndicatorCode?: string;
  latestCpiInflationIndicatorName?: string;
  latestCpiInflationMethodology?: string;
  latestCpiInflationIsFallback?: boolean;
};

type LoadedDataFile = DataFile & {
  data: KCollusionIndex[];
};

type ChartMode = "priceLevel" | "latestCpi" | "imfForecast";

type RefreshMetadata = Pick<
  DataFile,
  | "source"
  | "sourceUrl"
  | "indicatorCode"
  | "indicatorName"
  | "datasetType"
  | "methodology"
  | "expectedCountryCount"
  | "officialCountryCount"
  | "missingCountries"
  | "hasIncompleteOfficialPull"
  | "isFallback"
  | "consumerInflationYear"
  | "consumerInflationSource"
  | "consumerInflationSourceUrl"
  | "consumerInflationIndicatorCode"
  | "consumerInflationIndicatorName"
  | "consumerInflationVintage"
  | "consumerInflationPublicationDate"
  | "consumerInflationMethodology"
  | "consumerInflationIsForecast"
  | "consumerInflationIsFallback"
  | "latestCpiInflationYear"
  | "latestCpiInflationPeriod"
  | "latestCpiInflationSource"
  | "latestCpiInflationSourceUrl"
  | "latestCpiInflationIndicatorCode"
  | "latestCpiInflationIndicatorName"
  | "latestCpiInflationMethodology"
  | "latestCpiInflationIsFallback"
>;

const CHART_MODES: Array<{
  id: ChartMode;
  label: string;
  title: string;
  description: string;
}> = [
  {
    id: "priceLevel",
    label: "가격수준",
    title: "물가 수준 지수 비교",
    description: "World Bank WDI 가격수준 비율을 한국 기준 100으로 재산정했습니다.",
  },
  {
    id: "latestCpi",
    label: "최신 CPI",
    title: "OECD G20 월간 CPI 전년동월비",
    description: "가장 최근 공식 월간 소비자물가지수 전년동월비를 비교합니다.",
  },
  {
    id: "imfForecast",
    label: "IMF 전망",
    title: "IMF WEO 2026 연평균 소비자물가 전망",
    description: "IMF WEO의 2026년 연평균 소비자물가 상승률 전망입니다.",
  },
];

function formatSigned(value: number, unit = "포인트") {
  if (value === 0) {
    return "한국과 같습니다";
  }

  return `한국보다 ${Math.abs(value).toFixed(1)}${unit} ${
    value > 0 ? "높습니다" : "낮습니다"
  }`;
}

function getChartValue(item: KCollusionIndex, chartMode: ChartMode) {
  if (chartMode === "latestCpi") {
    return item.latestCpiInflationRate;
  }
  if (chartMode === "imfForecast") {
    return item.consumerInflationRate;
  }
  return item.indexValue;
}

async function loadIndexData(): Promise<LoadedDataFile> {
  const res = await fetch("/data/k-collusion-index.json", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`데이터 파일을 찾을 수 없습니다. (${res.status})`);
  }

  const json = (await res.json()) as DataFile;

  if (!json.success || !json.data) {
    throw new Error(json.error || "데이터가 없습니다.");
  }

  return { ...json, data: json.data };
}

function getRefreshMetadata(json: LoadedDataFile): RefreshMetadata {
  return {
    source: json.source,
    sourceUrl: json.sourceUrl,
    indicatorCode: json.indicatorCode,
    indicatorName: json.indicatorName,
    datasetType: json.datasetType,
    methodology: json.methodology,
    expectedCountryCount: json.expectedCountryCount,
    officialCountryCount: json.officialCountryCount,
    missingCountries: json.missingCountries,
    hasIncompleteOfficialPull: json.hasIncompleteOfficialPull,
    isFallback: json.isFallback,
    consumerInflationYear: json.consumerInflationYear,
    consumerInflationSource: json.consumerInflationSource,
    consumerInflationSourceUrl: json.consumerInflationSourceUrl,
    consumerInflationIndicatorCode: json.consumerInflationIndicatorCode,
    consumerInflationIndicatorName: json.consumerInflationIndicatorName,
    consumerInflationVintage: json.consumerInflationVintage,
    consumerInflationPublicationDate: json.consumerInflationPublicationDate,
    consumerInflationMethodology: json.consumerInflationMethodology,
    consumerInflationIsForecast: json.consumerInflationIsForecast,
    consumerInflationIsFallback: json.consumerInflationIsFallback,
    latestCpiInflationYear: json.latestCpiInflationYear,
    latestCpiInflationPeriod: json.latestCpiInflationPeriod,
    latestCpiInflationSource: json.latestCpiInflationSource,
    latestCpiInflationSourceUrl: json.latestCpiInflationSourceUrl,
    latestCpiInflationIndicatorCode: json.latestCpiInflationIndicatorCode,
    latestCpiInflationIndicatorName: json.latestCpiInflationIndicatorName,
    latestCpiInflationMethodology: json.latestCpiInflationMethodology,
    latestCpiInflationIsFallback: json.latestCpiInflationIsFallback,
  };
}

export default function DashboardClient() {
  const [data, setData] = useState<KCollusionIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [baseYear, setBaseYear] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<ChartMode>("priceLevel");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("KOR");
  const [refreshMetadata, setRefreshMetadata] =
    useState<RefreshMetadata | null>(null);

  const applyLoadedData = (json: LoadedDataFile) => {
    setData(json.data);
    setLastUpdated(json.timestamp || null);
    setBaseYear(json.baseYear || null);
    setRefreshMetadata(getRefreshMetadata(json));
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      applyLoadedData(await loadIndexData());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "데이터를 불러오는 과정에서 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const json = await loadIndexData();

        if (!cancelled) {
          applyLoadedData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "데이터를 불러오는 과정에서 오류가 발생했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const chartData: ChartDataItem[] = useMemo(
    () =>
      [...data]
        .sort((a, b) => getChartValue(b, chartMode) - getChartValue(a, chartMode))
        .map((item, index) => ({
          name: item.countryName,
          value: getChartValue(item, chartMode),
          rank: index + 1,
          countryCode: item.countryCode,
          source: item.source,
          sourceDetail: item.sourceDetail,
          rawPriceLevelRatio: item.rawPriceLevelRatio,
          consumerInflationRate: item.consumerInflationRate,
          consumerInflationYear: item.consumerInflationYear,
          consumerInflationIsForecast: item.consumerInflationIsForecast,
          latestCpiInflationRate: item.latestCpiInflationRate,
          latestCpiInflationYear: item.latestCpiInflationYear,
          latestCpiInflationPeriod: item.latestCpiInflationPeriod,
        })),
    [chartMode, data],
  );

  const priceLevelChartData: ChartDataItem[] = useMemo(
    () =>
      [...data]
        .sort((a, b) => b.indexValue - a.indexValue)
        .map((item, index) => ({
          name: item.countryName,
          value: item.indexValue,
          rank: index + 1,
          countryCode: item.countryCode,
          source: item.source,
          sourceDetail: item.sourceDetail,
          rawPriceLevelRatio: item.rawPriceLevelRatio,
          consumerInflationRate: item.consumerInflationRate,
          consumerInflationYear: item.consumerInflationYear,
          consumerInflationIsForecast: item.consumerInflationIsForecast,
          latestCpiInflationRate: item.latestCpiInflationRate,
          latestCpiInflationYear: item.latestCpiInflationYear,
          latestCpiInflationPeriod: item.latestCpiInflationPeriod,
        })),
    [data],
  );

  const koreaData = data.find((item) => item.countryCode === "KOR");
  const avgIndex =
    data.length > 0
      ? data.reduce((sum, item) => sum + item.indexValue, 0) / data.length
      : 0;
  const highestCountry =
    data.length > 0
      ? data.reduce((max, item) =>
          item.indexValue > max.indexValue ? item : max,
        )
      : null;
  const lowestCountry =
    data.length > 0
      ? data.reduce((min, item) =>
          item.indexValue < min.indexValue ? item : min,
        )
      : null;
  const shouldShowQualityNotice =
    refreshMetadata?.hasIncompleteOfficialPull === true ||
    refreshMetadata?.isFallback === true;
  const missingCountries = refreshMetadata?.missingCountries || [];
  const avgConsumerInflation =
    data.length > 0
      ? data.reduce((sum, item) => sum + item.consumerInflationRate, 0) /
        data.length
      : 0;
  const avgLatestCpiInflation =
    data.length > 0
      ? data.reduce((sum, item) => sum + item.latestCpiInflationRate, 0) /
        data.length
      : 0;
  const currentChartMode = CHART_MODES.find((mode) => mode.id === chartMode)!;
  const selectedCountry =
    data.find((item) => item.countryCode === selectedCountryCode) || koreaData || data[0];
  const aboveKoreaCount = data.filter((item) => item.indexValue > 100).length;
  const belowKoreaCount = data.filter((item) => item.indexValue < 100).length;
  const highestCpiCountry =
    data.length > 0
      ? data.reduce((max, item) =>
          item.latestCpiInflationRate > max.latestCpiInflationRate ? item : max,
        )
      : null;
  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleString("ko-KR")
    : "확인 중";

  const downloadCsv = () => {
    const csvHeader =
      "countryCode,countryName,indexValue,baseYear,source,sourceDetail,rawPriceLevelRatio,consumerInflationRate,consumerInflationYear,consumerInflationSource,consumerInflationSourceDetail,consumerInflationVintage,consumerInflationPublicationDate,consumerInflationIsForecast,latestCpiInflationRate,latestCpiInflationYear,latestCpiInflationPeriod,latestCpiInflationSource,latestCpiInflationSourceDetail\n";
    const csvRows = data
      .map(
        (item) =>
          `${item.countryCode},"${item.countryName}",${item.indexValue},${item.baseYear},"${item.source}","${item.sourceDetail}",${item.rawPriceLevelRatio},${item.consumerInflationRate},${item.consumerInflationYear},"${item.consumerInflationSource}","${item.consumerInflationSourceDetail}","${item.consumerInflationVintage}","${item.consumerInflationPublicationDate}",${item.consumerInflationIsForecast},${item.latestCpiInflationRate},${item.latestCpiInflationYear},"${item.latestCpiInflationPeriod}","${item.latestCpiInflationSource}","${item.latestCpiInflationSourceDetail}"`,
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "k-collusion-index.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  return (
    <div className={styles.dashboard}>
      <section className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>Korea baseline: 100</p>
          <h2 className={styles.title}>Korea Price Index</h2>
          <p className={styles.description}>
            World Bank WDI의 PPP 기반 물가수준 비율을 사용해 G20 주요 국가의
            상대적인 가격 수준을 비교합니다. 대한민국을 100으로 다시 기준화했기
            때문에 숫자가 높을수록 한국보다 전반적인 물가 수준이 높다는 뜻입니다.
          </p>
          <p className={styles.kicker}>한국 기준 글로벌 가격수준 비교 대시보드</p>
        </div>
        <div className={styles.refreshStatus}>
          <span className={styles.statusBadge}>공식 데이터</span>
          {lastUpdated && (
            <p className={styles.updated}>
              마지막 업데이트 {new Date(lastUpdated).toLocaleString("ko-KR")}
            </p>
          )}
          {baseYear && (
            <p className={styles.updated}>기준연도 {baseYear}</p>
          )}
          {refreshMetadata?.latestCpiInflationPeriod && (
            <p className={styles.updated}>
              CPI 기준월 {refreshMetadata.latestCpiInflationPeriod}
            </p>
          )}
          <p className={styles.updated}>월간 갱신</p>
          {refreshMetadata?.source && (
            <p className={styles.sourceLine}>
              출처 {refreshMetadata.source}
              {refreshMetadata.indicatorCode
                ? ` · ${refreshMetadata.indicatorCode}`
                : ""}
            </p>
          )}
          {shouldShowQualityNotice && (
            <p className={styles.qualityNotice} role="status">
              {refreshMetadata?.hasIncompleteOfficialPull
                ? `공식 데이터 누락${
                    missingCountries.length > 0
                      ? ` (${missingCountries.join(", ")})`
                      : ""
                  }`
                : "World Bank API 대신 최신 WDI 스냅샷 사용"}
            </p>
          )}
        </div>
      </section>

      <section className={styles.metrics} aria-label="핵심 지표">
        <MetricCard
          label="기준 국가"
          value={`${koreaData?.countryName || "대한민국"} 100`}
        />
        <MetricCard label="평균 지수" value={avgIndex.toFixed(1)} />
        <MetricCard
          label="가장 높은 물가 수준"
          value={
            highestCountry
              ? `${highestCountry.countryName} ${highestCountry.indexValue.toFixed(1)}`
              : "-"
          }
        />
        <MetricCard
          label="가장 낮은 물가 수준"
          value={
            lowestCountry
              ? `${lowestCountry.countryName} ${lowestCountry.indexValue.toFixed(1)}`
              : "-"
          }
        />
        <MetricCard
          label={`${refreshMetadata?.consumerInflationYear || 2026} 소비자물가지수(CPI) 전망`}
          value={`${avgConsumerInflation.toFixed(1)}%`}
        />
        <MetricCard
          label={`소비자물가지수(CPI) 전년동월비${refreshMetadata?.latestCpiInflationPeriod ? ` (${refreshMetadata.latestCpiInflationPeriod})` : ""}`}
          value={`${avgLatestCpiInflation.toFixed(1)}%`}
        />
      </section>

      <section className={styles.insights} aria-labelledby="insights-title">
        <div className={styles.sectionHeader}>
          <h3 id="insights-title">핵심 인사이트</h3>
          <p>공식 데이터에서 바로 읽을 수 있는 가격수준과 물가 흐름의 요약입니다.</p>
        </div>
        <div className={styles.insightGrid}>
          <InsightCard
            tone="warn"
            label="가격수준 상위"
            title={`${highestCountry?.countryName || "-"} ${highestCountry?.indexValue.toFixed(1) || "-"}`}
            description={`한국보다 가격수준이 높은 국가는 ${aboveKoreaCount}개, 낮은 국가는 ${belowKoreaCount}개입니다.`}
          />
          <InsightCard
            tone="info"
            label="한국 기준"
            title="대한민국 100"
            description="모든 국가는 한국의 World Bank 가격수준 비율을 기준으로 다시 계산됩니다."
          />
          <InsightCard
            tone="hot"
            label="최근 CPI"
            title={
              highestCpiCountry
                ? `${highestCpiCountry.countryName} ${highestCpiCountry.latestCpiInflationRate.toFixed(1)}%`
                : "-"
            }
            description={`OECD 월간 CPI 전년동월비 기준월은 ${refreshMetadata?.latestCpiInflationPeriod || "확인 중"}입니다.`}
          />
        </div>
      </section>

      <section className={styles.contextGrid} aria-label="지표 해석">
        <div className={styles.contextPanel}>
          <h3>가격수준 지수</h3>
          <p>
            가격수준 지수는 국가 간 가격 수준을 비교하기 위한 지표입니다. World
            Bank WDI의 PPP 기반 가격수준 비율을 한국=100으로 재산정해, 숫자가
            높을수록 한국보다 전반적인 가격 수준이 높다는 뜻입니다.
          </p>
        </div>
        <div className={styles.contextPanel}>
          <h3>소비자물가지수(CPI)</h3>
          <p>
            소비자물가지수(CPI)는 물가 상승 속도를 보여주는 보조 지표입니다.
            IMF 전망은 향후 연간 물가 흐름, OECD 전년동월비는 최근 월별 상승률을
            설명하며 가격수준 순위 계산에는 사용하지 않습니다.
          </p>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <h3>{currentChartMode.title}</h3>
          <p>{currentChartMode.description}</p>
        </div>
        <div className={styles.chartTabs} role="group" aria-label="차트 지표 선택">
          {CHART_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              aria-pressed={chartMode === mode.id}
              className={`${styles.chartTab} ${
                chartMode === mode.id ? styles.activeChartTab : ""
              }`}
              onClick={() => setChartMode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <BarChart data={chartData} />
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <h3>국가별 순위</h3>
          <p>한국 기준선과의 차이를 함께 확인합니다.</p>
        </div>
        <RankingTable data={priceLevelChartData} onSelectCountry={setSelectedCountryCode} />
      </section>

      {selectedCountry && (
        <section className={styles.detailPanel} aria-live="polite">
          <div>
            <p className={styles.eyebrow}>Country detail</p>
            <h3>{selectedCountry.countryName} 상세 해석</h3>
            <p>
              {selectedCountry.countryName}의 가격수준 지수는{" "}
              {selectedCountry.indexValue.toFixed(1)}로,{" "}
              {formatSigned(selectedCountry.indexValue - 100)}.
            </p>
          </div>
          <dl className={styles.detailStats}>
            <div>
              <dt>원자료 비율</dt>
              <dd>{selectedCountry.rawPriceLevelRatio.toFixed(3)}</dd>
            </div>
            <div>
              <dt>최신 CPI</dt>
              <dd>{selectedCountry.latestCpiInflationRate.toFixed(1)}%</dd>
            </div>
            <div>
              <dt>IMF 전망</dt>
              <dd>{selectedCountry.consumerInflationRate.toFixed(1)}%</dd>
            </div>
            <div>
              <dt>갱신 시각</dt>
              <dd>{lastUpdatedLabel}</dd>
            </div>
          </dl>
      </section>
      )}

      <div className={styles.actions}>
        <button type="button" onClick={downloadCsv} className={styles.action}>
          CSV 다운로드
        </button>
        <a
          href="/data/k-collusion-index.json"
          download
          className={styles.secondaryAction}
        >
          JSON 다운로드
        </a>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metricCard}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{value}</span>
    </div>
  );
}

function InsightCard({
  tone,
  label,
  title,
  description,
}: {
  tone: "warn" | "info" | "hot";
  label: string;
  title: string;
  description: string;
}) {
  return (
    <article className={`${styles.insightCard} ${styles[`insight-${tone}`]}`}>
      <span className={styles.insightLabel}>{label}</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </article>
  );
}
