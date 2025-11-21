'use client'

import React from 'react';
import { GeoCard } from '@/components/GeoCard';

const geo_Reports = () => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GeoCard type="countries" />
        <GeoCard type="active_users" />
        <GeoCard type="states" />
        <GeoCard type="cities" />
      </div>
    </div>
  );
};

export default geo_Reports;