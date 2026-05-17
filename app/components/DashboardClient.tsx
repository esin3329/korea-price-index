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
  datasetType?: string;
  isFallback?: boolean;
  expectedCountryCount?: number;
  oecdCountryCount?: number;
  sampleBackedCountryCount?: number;
  missingOecdCountries?: string[];
  hasIncompleteOecdPull?: boolean;
};

type LoadedDataFile = DataFile & {
  data: KCollusionIndex[];
};

type RefreshMetadata = Pick<
  DataFile,
  | "source"
  | "datasetType"
  | "isFallback"
  | "expectedCountryCount"
  | "oecdCountryCount"
  | "sampleBackedCountryCount"
  | "missingOecdCountries"
  | "hasIncompleteOecdPull"
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
    datasetType: json.datasetType,
    isFallback: json.isFallback,
    expectedCountryCount: json.expectedCountryCount,
    oecdCountryCount: json.oecdCountryCount,
    sampleBackedCountryCount: json.sampleBackedCountryCount,
    missingOecdCountries: json.missingOecdCountries,
    hasIncompleteOecdPull: json.hasIncompleteOecdPull,
  };
}

export default function DashboardClient() {
  const [data, setData] = useState<KCollusionIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshMetadata, setRefreshMetadata] =
    useState<RefreshMetadata | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const json = await loadIndexData();
      setData(json.data);
      setLastUpdated(json.timestamp || null);
      setRefreshMetadata(getRefreshMetadata(json));
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

        if (cancelled) {
          return;
        }

        setData(json.data);
        setLastUpdated(json.timestamp || null);
        setRefreshMetadata(getRefreshMetadata(json));
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "데이터를 불러오는 과정에서 오류가 발생했습니다.",
        );
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
          isSampleBacked: item.isSampleBacked,
          sourceDetail: item.sourceDetail,
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
    refreshMetadata?.hasIncompleteOecdPull === true ||
    refreshMetadata?.isFallback === true;
  const sampleBackedCount = refreshMetadata?.sampleBackedCountryCount || 0;
  const missingCountries = refreshMetadata?.missingOecdCountries || [];

  const downloadCsv = () => {
    const csvHeader =
      "countryCode,countryName,indexValue,baseYear,source,isSampleBacked,sourceDetail\n";
    const csvRows = data
      .map(
        (item) =>
          `${item.countryCode},"${item.countryName}",${item.indexValue},${item.baseYear},${item.source},${item.isSampleBacked},${item.sourceDetail}`,
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
          <h2 className={styles.title}>한국 물가 국제 비교</h2>
          <p className={styles.description}>
            대한민국을 기준값 100으로 두고 G20 주요 국가의 상대 물가 수준을
            비교합니다. 숫자가 높을수록 한국보다 물가 부담이 큰 것으로
            해석합니다.
          </p>
        </div>
        <div className={styles.refreshStatus}>
          {lastUpdated && (
            <p className={styles.updated}>
              마지막 업데이트 {new Date(lastUpdated).toLocaleString("ko-KR")}
            </p>
          )}
          {shouldShowQualityNotice && (
            <p className={styles.qualityNotice} role="status">
              샘플 기반 행: {sampleBackedCount}
              {missingCountries.length > 0
                ? ` (${missingCountries.join(", ")})`
                : ""}
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
          label="최고 물가"
          value={
            highestCountry
              ? `${highestCountry.countryName} ${highestCountry.indexValue.toFixed(1)}`
              : "-"
          }
        />
        <MetricCard
          label="최저 물가"
          value={
            lowestCountry
              ? `${lowestCountry.countryName} ${lowestCountry.indexValue.toFixed(1)}`
              : "-"
          }
        />
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <h3>물가 지수 비교</h3>
          <p>국가명을 바로 읽을 수 있도록 가로 막대로 정렬했습니다.</p>
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
