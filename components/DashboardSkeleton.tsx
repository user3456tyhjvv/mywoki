import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Header skeleton
export const HeaderSkeleton: React.FC = () => (
  <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 rounded-2xl p-6 bg-white/80 backdrop-blur-sm border border-gray-200">
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-4 h-4" />
        <Skeleton className="w-32 h-4" />
      </div>
      <div className="flex items-center gap-1 rounded-lg p-1 bg-gray-100 w-48">
        <Skeleton className="w-12 h-6" />
        <Skeleton className="w-12 h-6" />
        <Skeleton className="w-12 h-6" />
      </div>
      <div className="flex items-center gap-4 mt-4">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div>
          <Skeleton className="w-48 h-6 mb-1" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-32 h-4" />
          </div>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Skeleton className="w-20 h-8" />
      <Skeleton className="w-20 h-8" />
      <Skeleton className="w-20 h-8" />
    </div>
  </header>
);

// Metric card skeleton
export const MetricCardSkeleton: React.FC = () => (
  <div className="rounded-2xl p-6 bg-white/80 backdrop-blur-sm border border-gray-200">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="w-6 h-6" />
      <Skeleton className="w-16 h-4" />
    </div>
    <Skeleton className="w-20 h-8 mb-2" />
    <Skeleton className="w-24 h-4" />
  </div>
);

// Chart skeleton
export const ChartSkeleton: React.FC = () => (
  <div className="rounded-2xl p-6 bg-white/80 backdrop-blur-sm border border-gray-200">
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="w-32 h-4" />
      <Skeleton className="w-20 h-4" />
    </div>
    <Skeleton className="w-full h-64 rounded" />
  </div>
);

// Suggestions skeleton
export const SuggestionsSkeleton: React.FC = () => (
  <div className="rounded-2xl p-6 bg-white/80 backdrop-blur-sm border border-gray-200">
    <Skeleton className="w-32 h-6 mb-4" />
    <div className="space-y-3">
      <Skeleton className="w-full h-16" />
      <Skeleton className="w-full h-16" />
      <Skeleton className="w-full h-16" />
    </div>
  </div>
);

// Main dashboard skeleton
const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 via-white to-blue-50">
    <HeaderSkeleton />

    {/* Quick Stats Skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
    </div>

    {/* Main Content Grid */}
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Left Column */}
      <div className="xl:col-span-3 space-y-6">
        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>

        {/* Chart */}
        <ChartSkeleton />

        {/* Weekly Summary */}
        <div className="rounded-2xl p-6 bg-white/80 backdrop-blur-sm border border-gray-200">
          <Skeleton className="w-32 h-6 mb-4" />
          <Skeleton className="w-full h-32" />
        </div>
      </div>

      {/* Right Column */}
      <div className="xl:col-span-1 space-y-6">
        <SuggestionsSkeleton />

        {/* Chat Widget Skeleton */}
        <div className="rounded-2xl p-6 bg-white/80 backdrop-blur-sm border border-gray-200">
          <Skeleton className="w-24 h-6 mb-4" />
          <Skeleton className="w-full h-48" />
        </div>
      </div>
    </div>
  </div>
);

export default DashboardSkeleton;
