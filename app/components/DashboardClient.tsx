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
  consumerInflationMethodology?: string;
  consumerInflationIsForecast?: boolean;
  consumerInflationIsFallback?: boolean;
  latestCpiInflationYear?: number;
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
  | "consumerInflationMethodology"
  | "consumerInflationIsForecast"
  | "consumerInflationIsFallback"
  | "latestCpiInflationYear"
  | "latestCpiInflationSource"
  | "latestCpiInflationSourceUrl"
  | "latestCpiInflationIndicatorCode"
  | "latestCpiInflationIndicatorName"
  | "latestCpiInflationMethodology"
  | "latestCpiInflationIsFallback"
>;

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
    consumerInflationMethodology: json.consumerInflationMethodology,
    consumerInflationIsForecast: json.consumerInflationIsForecast,
    consumerInflationIsFallback: json.consumerInflationIsFallback,
    latestCpiInflationYear: json.latestCpiInflationYear,
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

  const downloadCsv = () => {
    const csvHeader =
      "countryCode,countryName,indexValue,baseYear,source,sourceDetail,rawPriceLevelRatio,consumerInflationRate,consumerInflationYear,consumerInflationSource,consumerInflationSourceDetail,consumerInflationIsForecast,latestCpiInflationRate,latestCpiInflationYear,latestCpiInflationSource,latestCpiInflationSourceDetail\n";
    const csvRows = data
      .map(
        (item) =>
          `${item.countryCode},"${item.countryName}",${item.indexValue},${item.baseYear},"${item.source}","${item.sourceDetail}",${item.rawPriceLevelRatio},${item.consumerInflationRate},${item.consumerInflationYear},"${item.consumerInflationSource}","${item.consumerInflationSourceDetail}",${item.consumerInflationIsForecast},${item.latestCpiInflationRate},${item.latestCpiInflationYear},"${item.latestCpiInflationSource}","${item.latestCpiInflationSourceDetail}"`,
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
          <h2 className={styles.title}>한국 기준 국제 물가 수준 비교</h2>
          <p className={styles.description}>
            World Bank WDI의 PPP 기반 물가수준 비율을 사용해 G20 주요 국가의
            상대적인 가격 수준을 비교합니다. 대한민국을 100으로 다시 기준화했기
            때문에 숫자가 높을수록 한국보다 전반적인 물가 수준이 높다는 뜻입니다.
          </p>
        </div>
        <div className={styles.refreshStatus}>
          {lastUpdated && (
            <p className={styles.updated}>
              마지막 업데이트 {new Date(lastUpdated).toLocaleString("ko-KR")}
            </p>
          )}
          {baseYear && (
            <p className={styles.updated}>기준 연도 {baseYear}</p>
          )}
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
          label={`${refreshMetadata?.consumerInflationYear || 2026} CPI 전망`}
          value={`${avgConsumerInflation.toFixed(1)}%`}
        />
        <MetricCard
          label={`${refreshMetadata?.latestCpiInflationYear || 2024} CPI 상승률`}
          value={`${avgLatestCpiInflation.toFixed(1)}%`}
        />
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <h3>물가 수준 지수 비교</h3>
          <p>PPP 기반 가격수준 비율을 한국 기준 100으로 재산정했습니다.</p>
        </div>
        <BarChart data={chartData} />
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <h3>국가별 순위</h3>
          <p>한국 기준선과의 차이를 함께 확인합니다.</p>
        </div>
        <RankingTable data={chartData} />
      </section>

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
