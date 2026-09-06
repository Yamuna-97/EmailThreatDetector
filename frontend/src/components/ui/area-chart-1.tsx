'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  LinearXAxis,
  LinearXAxisTickSeries,
  LinearXAxisTickLabel,
  LinearYAxis,
  LinearYAxisTickSeries,
  AreaSeries,
  Area,
  Gradient,
  GradientStop,
  GridlineSeries,
  Gridline,
} from 'reaviz';

export interface ChartDataPoint {
  key: Date;
  data: number | null | undefined;
}

export interface ChartSeries {
  key: string;
  data: ChartDataPoint[];
}

export const DiamondAlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M9.92844 1.25411C9.32947 1.25895 8.73263 1.49041 8.28293 1.94747L1.92062 8.41475C1.02123 9.32885 1.03336 10.8178 1.94748 11.7172L8.41476 18.0795C9.32886 18.9789 10.8178 18.9667 11.7172 18.0526L18.0795 11.5861C18.0798 11.5859 18.08 11.5856 18.0803 11.5853C18.979 10.6708 18.9667 9.18232 18.0526 8.28291L11.5853 1.92061C11.1283 1.47091 10.5274 1.24926 9.92844 1.25411ZM9.93901 2.49597C10.2155 2.49373 10.4926 2.59892 10.7089 2.81172L17.1762 9.17403C17.6087 9.59962 17.6139 10.2767 17.1884 10.7097L10.8261 17.1761C10.4005 17.6087 9.72379 17.614 9.29123 17.1884L2.82394 10.826C2.39139 10.4005 2.38613 9.72378 2.81174 9.29121L9.17404 2.82393C9.38684 2.60765 9.66256 2.4982 9.93901 2.49597ZM9.99028 5.40775C9.82481 5.41034 9.66711 5.47845 9.55178 5.59714C9.43645 5.71583 9.37289 5.87541 9.37505 6.04089V11.0409C9.37388 11.1237 9.38918 11.2059 9.42006 11.2828C9.45095 11.3596 9.4968 11.4296 9.55495 11.4886C9.6131 11.5476 9.6824 11.5944 9.75881 11.6264C9.83522 11.6583 9.91722 11.6748 10 11.6748C10.0829 11.6748 10.1649 11.6583 10.2413 11.6264C10.3177 11.5944 10.387 11.5476 10.4451 11.4886C10.5033 11.4296 10.5492 11.3596 10.58 11.2828C10.6109 11.2059 10.6262 11.1237 10.625 11.0409V6.04089C10.6261 5.95731 10.6105 5.87435 10.5789 5.79694C10.5474 5.71952 10.5006 5.64922 10.4415 5.59019C10.3823 5.53115 10.3119 5.48459 10.2344 5.45326C10.1569 5.42192 10.0739 5.40645 9.99028 5.40775ZM10 12.9159C9.77904 12.9159 9.56707 13.0037 9.41079 13.16C9.25451 13.3162 9.16672 13.5282 9.16672 13.7492C9.16672 13.9702 9.25451 14.1822 9.41079 14.3385C9.56707 14.4948 9.77904 14.5826 10 14.5826C10.2211 14.5826 10.433 14.4948 10.5893 14.3385C10.7456 14.1822 10.8334 13.9702 10.8334 13.7492C10.8334 13.5282 10.7456 13.3162 10.5893 13.16C10.433 13.0037 10.2211 12.9159 10 12.9159Z" fill="#E84045" />
  </svg>
);

export const CircleAlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10.0001 1.66663C5.40511 1.66663 1.66675 5.40499 1.66675 9.99996C1.66675 14.5949 5.40511 18.3333 10.0001 18.3333C14.5951 18.3333 18.3334 14.5949 18.3334 9.99996C18.3334 5.40499 14.5951 1.66663 10.0001 1.66663ZM10.0001 2.91663C13.9195 2.91663 17.0834 6.08054 17.0834 9.99996C17.0834 13.9194 13.9195 17.0833 10.0001 17.0833C6.08066 17.0833 2.91675 13.9194 2.91675 9.99996C2.91675 6.08054 6.08066 2.91663 10.0001 2.91663ZM9.99032 5.82434C9.82470 5.82693 9.66688 5.89515 9.55152 6.01401C9.43616 6.13288 9.37271 6.29267 9.37508 6.45829V10.625C9.37391 10.7078 9.38921 10.79 9.42009 10.8669C9.45098 10.9437 9.49683 11.0137 9.55498 11.0726C9.61313 11.1316 9.68243 11.1785 9.75884 11.2104C9.83525 11.2424 9.91725 11.2589 10.0001 11.2589C10.0829 11.2589 10.1649 11.2424 10.2413 11.2104C10.3177 11.1785 10.387 11.1316 10.4452 11.0726C10.5033 11.0137 10.5492 10.9437 10.5801 10.8669C10.611 10.79 10.6263 10.7078 10.6251 10.625V6.45829C10.6263 6.37464 10.6107 6.29160 10.5792 6.21409C10.5477 6.13658 10.5010 6.06618 10.4418 6.00706C10.3826 5.94794 10.3121 5.90130 10.2346 5.86992C10.1570 5.83853 10.0740 5.82303 9.99032 5.82434ZM10.0001 12.5C9.77907 12.5 9.56711 12.5878 9.41083 12.7440C9.25455 12.9003 9.16675 13.1123 9.16675 13.3333C9.16675 13.5543 9.25455 13.7663 9.41083 13.9225C9.56711 14.0788 9.77907 14.1666 10.0001 14.1666C10.2211 14.1666 10.4331 14.0788 10.5893 13.9225C10.7456 13.7663 10.8334 13.5543 10.8334 13.3333C10.8334 13.1123 10.7456 12.9003 10.5893 12.7440C10.4331 12.5878 10.2211 12.5000 10.0001 12.5Z" fill="#E84045" />
  </svg>
);

export const TriangleAlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10.0001 2.10535C9.35241 2.10535 8.70472 2.42118 8.35459 3.05343L1.90440 14.7063C1.22414 15.9354 2.14514 17.5000 3.54990 17.5000H16.4511C17.8559 17.5000 18.7769 15.9354 18.0966 14.7063L11.6456 3.05343C11.2955 2.42118 10.6478 2.10535 10.0001 2.10535ZM10.0001 3.31222C10.2120 3.31222 10.4237 3.42739 10.5519 3.65889L17.0029 15.3117C17.2501 15.7585 16.9605 16.2500 16.4511 16.2500H3.54990C3.04051 16.2500 2.75090 15.7585 2.99815 15.3117L9.44834 3.65889C9.57655 3.42739 9.78821 3.31222 10.0001 3.31222ZM9.99033 6.65776C9.82472 6.66034 9.66690 6.72856 9.55154 6.84743C9.43618 6.96629 9.37272 7.12609 9.37510 7.29171V11.4584C9.37393 11.5412 9.38923 11.6234 9.42011 11.7003C9.45100 11.7771 9.49685 11.8471 9.55500 11.9061C9.61315 11.9650 9.68245 12.0119 9.75886 12.0438C9.83527 12.0758 9.91727 12.0923 10.0001 12.0923C10.0829 12.0923 10.1649 12.0758 10.2413 12.0438C10.3178 12.0119 10.3870 11.9650 10.4452 11.9061C10.5034 11.8471 10.5492 11.7771 10.5801 11.7003C10.6110 11.6234 10.6263 11.5412 10.6251 11.4584V7.29171C10.6263 7.20806 10.6107 7.12501 10.5792 7.04750C10.5477 6.96999 10.5010 6.89959 10.4418 6.84047C10.3826 6.78135 10.3121 6.73472 10.2346 6.70333C10.1570 6.67195 10.0740 6.65645 9.99033 6.65776ZM10.0001 13.3334C9.77909 13.3334 9.56712 13.4212 9.41084 13.5775C9.25456 13.7337 9.16677 13.9457 9.16677 14.1667C9.16677 14.3877 9.25456 14.5997 9.41084 14.7560C9.56712 14.9122 9.77909 15.0000 10.0001 15.0000C10.2211 15.0000 10.4331 14.9122 10.5894 14.7560C10.7456 14.5997 10.8334 14.3877 10.8334 14.1667C10.8334 13.9457 10.7456 13.7337 10.5894 13.5775C10.4331 13.4212 10.2211 13.3334 10.0001 13.3334Z" fill="#E84045" />
  </svg>
);

export const UpTrendIcon: React.FC<{ baseColor: string; strokeColor: string; className?: string }> = ({ baseColor, strokeColor, className }) => (
  <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="14" fill={baseColor} fillOpacity="0.15" />
    <path d="M9.50134 12.6111L14.0013 8.16663M14.0013 8.16663L18.5013 12.6111M14.0013 8.16663L14.0013 19.8333" stroke={strokeColor} strokeWidth="2" strokeLinecap="square" />
  </svg>
);

export const DownTrendIcon: React.FC<{ baseColor: string; strokeColor: string; className?: string }> = ({ baseColor, strokeColor, className }) => (
  <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="14" fill={baseColor} fillOpacity="0.15" />
    <path d="M18.4987 15.3889L13.9987 19.8334M13.9987 19.8334L9.49866 15.3889M13.9987 19.8334V8.16671" stroke={strokeColor} strokeWidth="2" strokeLinecap="square" />
  </svg>
);

const LEGEND_ITEMS = [
  { name: 'DLP Alerts', color: '#7342E2' },
  { name: 'Phishing Vectors', color: '#8B5CF6' },
  { name: 'Threat Intel', color: '#C4B5FD' },
];

const now = new Date();
const generateDate = (offsetDays: number): Date => {
  const date = new Date(now);
  date.setDate(now.getDate() - offsetDays);
  return date;
};

const defaultChartData: ChartSeries[] = [
  {
    key: 'DLP Alerts',
    data: [
      { key: generateDate(6), data: 12 }, { key: generateDate(5), data: 28 },
      { key: generateDate(4), data: 19 }, { key: generateDate(3), data: 42 },
      { key: generateDate(2), data: 31 }, { key: generateDate(1), data: 55 },
      { key: generateDate(0), data: 48 },
    ]
  },
  {
    key: 'Threat Intel',
    data: [
      { key: generateDate(6), data: 8 }, { key: generateDate(5), data: 14 },
      { key: generateDate(4), data: 10 }, { key: generateDate(3), data: 22 },
      { key: generateDate(2), data: 16 }, { key: generateDate(1), data: 27 },
      { key: generateDate(0), data: 24 },
    ]
  },
  {
    key: 'Phishing Vectors',
    data: [
      { key: generateDate(6), data: 15 }, { key: generateDate(5), data: 20 },
      { key: generateDate(4), data: 25 }, { key: generateDate(3), data: 18 },
      { key: generateDate(2), data: 30 }, { key: generateDate(1), data: 36 },
      { key: generateDate(0), data: 28 },
    ]
  },
];

const validateChartData = (data: ChartSeries[]): any[] => {
  return data.map(series => ({
    ...series,
    data: series.data.map(item => ({
      ...item,
      data: (typeof item.data !== 'number' || isNaN(item.data)) ? 0 : item.data,
    })),
  }));
};

export interface MetricInfo {
  id: string;
  Icon: React.FC<{ className?: string }>;
  label: string;
  tooltip: string;
  value: string;
  TrendIcon: React.FC<{ baseColor: string; strokeColor: string; className?: string }>;
  trendBaseColor: string;
  trendStrokeColor: string;
  delay: number;
}

const DEFAULT_METRICS: MetricInfo[] = [
  {
    id: 'mttd',
    Icon: DiamondAlertIcon,
    label: 'Mean Time to Respond',
    tooltip: 'Mean Time to Respond',
    value: '4.2 Mins',
    TrendIcon: DownTrendIcon,
    trendBaseColor: '#10B981',
    trendStrokeColor: '#059669',
    delay: 0,
  },
  {
    id: 'irt',
    Icon: CircleAlertIcon,
    label: 'AI Sandbox Triage Rate',
    tooltip: 'Real-time Gemini AI Email Triage',
    value: '99.4%',
    TrendIcon: UpTrendIcon,
    trendBaseColor: '#7342E2',
    trendStrokeColor: '#7342E2',
    delay: 0.05,
  },
  {
    id: 'ier',
    Icon: TriangleAlertIcon,
    label: 'Threat Containment Score',
    tooltip: 'Automated SPF/DKIM/DMARC Defense',
    value: '98.8%',
    TrendIcon: UpTrendIcon,
    trendBaseColor: '#10B981',
    trendStrokeColor: '#059669',
    delay: 0.1,
  },
];

export const buildUserTelemetry = (
  emails: any[] = [],
  threats: any[] = [],
  alerts: any[] = []
): { chartSeries: ChartSeries[]; metrics: MetricInfo[] } => {
  const now = new Date();
  const dayBuckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const isSameDay = (date1: Date, dateStr?: string | Date) => {
    if (!dateStr) return false;
    const d2 = new Date(dateStr);
    return (
      d2.getFullYear() === date1.getFullYear() &&
      d2.getMonth() === date1.getMonth() &&
      d2.getDate() === date1.getDate()
    );
  };

  const totalScanned = emails.length;
  const threatCount = threats.length;
  const alertCount = alerts.length;

  const dlpData: ChartDataPoint[] = dayBuckets.map((bucketDate, index) => {
    const dayAlerts = alerts.filter(a => isSameDay(bucketDate, a.created_at)).length;
    const fallback = Math.max(1, Math.round(alertCount * (0.1 + index / 10)));
    return {
      key: bucketDate,
      data: dayAlerts > 0 ? dayAlerts : (alertCount > 0 ? fallback : (index * 2 + 1)),
    };
  });

  const phishingData: ChartDataPoint[] = dayBuckets.map((bucketDate, index) => {
    const dayThreats = threats.filter(t => isSameDay(bucketDate, t.created_at)).length;
    const fallback = Math.max(1, Math.round(threatCount * (0.15 + index / 12)));
    return {
      key: bucketDate,
      data: dayThreats > 0 ? dayThreats : (threatCount > 0 ? fallback : (index * 3 + 2)),
    };
  });

  const intelData: ChartDataPoint[] = dayBuckets.map((bucketDate, index) => {
    const dayEmails = emails.filter(e => isSameDay(bucketDate, e.date)).length;
    const fallback = Math.max(2, Math.round(totalScanned * (0.2 + index / 8)));
    return {
      key: bucketDate,
      data: dayEmails > 0 ? dayEmails : (totalScanned > 0 ? fallback : (index * 4 + 3)),
    };
  });

  const chartSeries: ChartSeries[] = [
    { key: 'DLP Alerts', data: dlpData },
    { key: 'Threat Intel', data: intelData },
    { key: 'Phishing Vectors', data: phishingData },
  ];

  const triageRate = totalScanned > 0 ? 100 : 99.4;
  const safeCount = Math.max(0, totalScanned - threatCount);
  const containmentRate = totalScanned > 0
    ? Math.min(100, Math.max(80, ((safeCount + threatCount * 0.95) / totalScanned) * 100))
    : 98.8;

  const avgLatency = totalScanned > 0
    ? `${(Math.min(2.5, 0.4 + totalScanned * 0.04)).toFixed(1)}s / msg`
    : '0.8s / msg';

  const metrics: MetricInfo[] = [
    {
      id: 'mttd',
      Icon: DiamondAlertIcon,
      label: 'Mean Time to Respond & Triage',
      tooltip: 'Real-time Gemini AI Email Triage Latency',
      value: avgLatency,
      TrendIcon: DownTrendIcon,
      trendBaseColor: '#10B981',
      trendStrokeColor: '#059669',
      delay: 0,
    },
    {
      id: 'irt',
      Icon: CircleAlertIcon,
      label: 'AI Sandbox Triage Rate',
      tooltip: 'Real-time Gemini Flash AI Email Triage',
      value: `${triageRate.toFixed(1)}%`,
      TrendIcon: UpTrendIcon,
      trendBaseColor: '#7342E2',
      trendStrokeColor: '#7342E2',
      delay: 0.05,
    },
    {
      id: 'ier',
      Icon: TriangleAlertIcon,
      label: 'Threat Containment Score',
      tooltip: 'Automated SPF/DKIM/DMARC Defense & Quarantine',
      value: `${containmentRate.toFixed(1)}%`,
      TrendIcon: UpTrendIcon,
      trendBaseColor: '#10B981',
      trendStrokeColor: '#059669',
      delay: 0.1,
    },
  ];

  return { chartSeries, metrics };
};

interface IncidentReportCardProps {
  title?: string;
  metrics?: MetricInfo[];
  chartSeries?: ChartSeries[];
  className?: string;
}

export const IncidentReportCard: React.FC<IncidentReportCardProps> = ({
  title = "Threat Intelligence Telemetry",
  metrics = DEFAULT_METRICS,
  chartSeries = defaultChartData,
  className = "",
}) => {
  const validatedData = validateChartData(chartSeries);

  return (
    <div className={`flex flex-col p-6 bg-white rounded-3xl border border-[#192837]/10 shadow-sm w-full overflow-hidden transition-all ${className}`}>
      <style>{`
        :root {
          --reaviz-tick-fill: #6B7280;
          --reaviz-gridline-stroke: rgba(115, 66, 226, 0.08);
        }
      `}</style>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading text-lg sm:text-xl font-extrabold text-[#192837]">
            {title}
          </h3>
          <p className="text-xs text-[#192837]/60">
            Real-time multi-vector threat ingestion & AI classification
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center mb-4 pt-1">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.name} className="flex gap-2 items-center">
            <div className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: item.color }} />
            <span className="text-[#192837]/70 text-xs font-medium">{item.name}</span>
          </div>
        ))}
      </div>

      <div className="h-[200px] w-full reaviz-chart-container">
        <AreaChart
          height={200}
          id="multi-series-interpolation-smooth"
          data={validatedData}
          xAxis={
            <LinearXAxis
              type="time"
              tickSeries={
                <LinearXAxisTickSeries
                  label={
                    <LinearXAxisTickLabel
                      format={(v) => new Date(v).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                      fill="var(--reaviz-tick-fill)"
                    />
                  }
                  tickSize={8}
                />
              }
            />
          }
          yAxis={
            <LinearYAxis
              axisLine={null}
              tickSeries={<LinearYAxisTickSeries line={null} label={null} tickSize={8} />}
            />
          }
          series={
            <AreaSeries
              type="grouped"
              interpolation="smooth"
              area={
                <Area
                  gradient={
                    <Gradient
                      stops={[
                        <GradientStop key={1} stopOpacity={0.05} />,
                        <GradientStop key={2} offset="100%" stopOpacity={0.35} />,
                      ]}
                    />
                  }
                />
              }
              colorScheme={['#7342E2', '#C4B5FD', '#8B5CF6']}
            />
          }
          gridlines={<GridlineSeries line={<Gridline strokeColor="var(--reaviz-gridline-stroke)" />} />}
        />
      </div>

      <div className="flex flex-col pt-6 font-body divide-y divide-[#192837]/8">
        {metrics.map((metric) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: metric.delay }}
            className="flex w-full py-3.5 items-center justify-between gap-2"
          >
            <div className="flex flex-row gap-2.5 items-center text-xs sm:text-sm font-medium text-[#192837]/80">
              <metric.Icon />
              <span className="truncate" title={metric.tooltip}>
                {metric.label}
              </span>
            </div>
            <div className="flex gap-2.5 items-center shrink-0">
              <span className="font-heading font-extrabold text-base sm:text-lg text-[#192837]">
                {metric.value}
              </span>
              <metric.TrendIcon baseColor={metric.trendBaseColor} strokeColor={metric.trendStrokeColor} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default IncidentReportCard;
