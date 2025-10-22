import React from 'react';
import { MetricsGrid } from '@/components/MetricsGrid';

const geo_Reports = () => {
  return (
    <div>
      <MetricsGrid
        metrics={['impressions', 'interactions', 'impressions', 'interactions', 'impressions', 'interactions']}
        className="mb-8"
      />
    </div>
  );
};

export default geo_Reports;