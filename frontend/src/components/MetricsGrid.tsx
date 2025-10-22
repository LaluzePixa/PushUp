'use client'

import React from 'react';
import MetricCard from './MetricCard';
import { ThemeStyle, ThemeColorConfig } from "@/components/ui/theme-style"
import { THEMES } from "@/components/ui/theme"

interface MetricsGridProps {
  metrics: string[];
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  color?: string | Partial<Record<keyof typeof THEMES, string>>;
}

const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  className = "",
  columns = 3,
  color
}) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  };

  const themeId = React.useId().replace(/:/g, "")
  const themeConfig: ThemeColorConfig = color ? { 'mi-bg': color } : {}

  return (
    <>
      {color && <ThemeStyle id={themeId} config={themeConfig} />}
      <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
        {metrics.map((metricName) => (
          <MetricCard
            key={metricName}
            metricName={metricName}
          />
        ))}
      </div>
    </>
  );
};

export { MetricsGrid };