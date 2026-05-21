"use client";

import { useState, useEffect } from 'react';
import { KCollusionIndex, ChartDataItem } from '@/app/types/oecd';
import BarChart from '@/app/components/BarChart';
import RankingTable from '@/app/components/RankingTable';
import ErrorDisplay from '@/app/components/ErrorDisplay';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function DashboardClient() {
  const [data, setData] = useState<KCollusionIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/oecd');
      const json = await res.json();

      if (!json.success || !json.data) {
        throw new Error(json.error || '데이터가 없습니다.');
      }

      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는 과정에서 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Legacy dashboard component: retained for API/export experiments, but not used by the current route.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  // 데이터 변환
  const chartData: ChartDataItem[] = data
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
    }));

  // 통계 계산
  const avgIndex = data.length > 0
    ? data.reduce((sum, d) => sum + d.indexValue, 0) / data.length
    : 0;
  const highestCountry = data.length > 0
    ? data.reduce((max, d) => d.indexValue > max.indexValue ? d : max, data[0])
    : null;
  const lowestCountry = data.length > 0
    ? data.reduce((min, d) => d.indexValue < min.indexValue ? d : min, data[0])
    : null;

  if (loading) {
    return <LoadingSpinner message="데이터를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem', color: '#2d3748', marginBottom: '0.5rem', fontWeight: 700 }}>
          한국 물가 국제 비교
        </h2>
        <p style={{ color: '#718096', fontSize: '1.1rem', lineHeight: 1.6 }}>
          한국을 기준(100)으로 설정하여 G20 국가들의 상대적 물가 수준을 비교합니다.
        </p>
      </div>

      {/* 통계 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', textTransform: 'uppercase' }}>기준 국가</span>
          <span style={{ color: 'white', fontSize: '1.3rem', fontWeight: 600 }}>대한민국 (100)</span>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', textTransform: 'uppercase' }}>평균 지수</span>
          <span style={{ color: 'white', fontSize: '1.3rem', fontWeight: 600 }}>{avgIndex.toFixed(1)}</span>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', textTransform: 'uppercase' }}>최고 물가</span>
          <span style={{ color: 'white', fontSize: '1.3rem', fontWeight: 600 }}>
            {highestCountry ? `${highestCountry.countryName} (${highestCountry.indexValue.toFixed(1)})` : '-'}
          </span>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', textTransform: 'uppercase' }}>최저 물가</span>
          <span style={{ color: 'white', fontSize: '1.3rem', fontWeight: 600 }}>
            {lowestCountry ? `${lowestCountry.countryName} (${lowestCountry.indexValue.toFixed(1)})` : '-'}
          </span>
        </div>
      </div>

      {/* 막대 차트 */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.3rem', color: '#2d3748', marginBottom: '1rem', fontWeight: 600, borderLeft: '4px solid #667eea', paddingLeft: '0.75rem' }}>
          물가 지수 비교 chart
        </h3>
        <BarChart data={chartData} />
      </div>

      {/* 순위 테이블 */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.3rem', color: '#2d3748', marginBottom: '1rem', fontWeight: 600, borderLeft: '4px solid #667eea', paddingLeft: '0.75rem' }}>
          국가별 순위
        </h3>
        <RankingTable data={chartData} />
      </div>

      {/* 내보내기 링크 */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', padding: '1rem' }}>
        <a href="/api/export?format=csv" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: '#48bb78', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 500, transition: 'background-color 0.2s, transform 0.2s' }}>
          CSV 다운로드
        </a>
        <a href="/api/export?format=json" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: '#48bb78', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 500, transition: 'background-color 0.2s, transform 0.2s' }}>
          JSON 다운로드
        </a>
      </div>
    </div>
  );
}
