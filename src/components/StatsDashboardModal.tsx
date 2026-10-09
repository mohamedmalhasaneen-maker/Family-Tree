import React from 'react';
import {
  X,
  Users,
  Layers,
  Crown,
  GitFork,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import type { TreeStats } from '../lib/statsUtils';

interface StatsDashboardModalProps {
  isOpen: boolean;
  stats: TreeStats;
  onClose: () => void;
  onSelectBranch: (branchId: string) => void;
}

export const StatsDashboardModal: React.FC<StatsDashboardModalProps> = ({
  isOpen,
  stats,
  onClose,
  onSelectBranch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 leading-tight">
                لوحة إحصائيات شجرة عائلات الحسنين
              </h2>
              <p className="text-[11px] text-stone-500">
                نظرة شاملة وسريعة على الأنساب والتفرعات
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Metric KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Total Members */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-700 mb-2">
                <span className="text-xs font-semibold">إجمالي الأفراد</span>
                <Users className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-emerald-950">
                {stats.totalMembers}
                <span className="text-xs font-semibold text-emerald-700 mr-1.5">فرد</span>
              </div>
            </div>

            {/* Total Generations */}
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-sky-700 mb-2">
                <span className="text-xs font-semibold">عدد الأجيال</span>
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-sky-950">
                {stats.totalGenerations}
                <span className="text-xs font-semibold text-sky-700 mr-1.5">أجيال</span>
              </div>
            </div>

            {/* Largest Branch */}
            <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-amber-50/70 border border-amber-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-700 mb-2">
                <span className="text-xs font-semibold">أكبر الفروع</span>
                <Crown className="w-4 h-4" />
              </div>
              <div>
                {stats.largestBranch ? (
                  <>
                    <div className="text-lg font-black text-amber-950 truncate" title={stats.largestBranch.name}>
                      فرع {stats.largestBranch.name}
                    </div>
                    <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                      {stats.largestBranch.count} فرد ({stats.largestBranch.percentage}%)
                    </p>
                  </>
                ) : (
                  <div className="text-sm font-bold text-amber-900">—</div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Quick Stats Pill Row */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-stone-100/80 border border-stone-200/60 flex items-center justify-between">
              <span className="text-stone-500 font-medium">رأس الشجرة (المؤسس):</span>
              <span className="font-bold text-stone-900">
                {stats.rootNames.length > 0 ? stats.rootNames.join('، ') : '—'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-100/80 border border-stone-200/60 flex items-center justify-between">
              <span className="text-stone-500 font-medium">أفراد لديهم أبناء:</span>
              <span className="font-bold text-stone-900">{stats.parentsCount} آباء</span>
            </div>
          </div>

          {/* Branch Distribution Breakdown */}
          {stats.branchBreakdown.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <GitFork className="w-3.5 h-3.5 text-stone-500" />
                  <span>توزيع الفروع الرئيسية في الشجرة</span>
                </h3>
                <span className="text-[11px] text-stone-400 font-medium">
                  {stats.branchBreakdown.length} فروع رئيسية
                </span>
              </div>

              <div className="space-y-2 bg-stone-50/50 p-3 rounded-2xl border border-stone-200/70">
                {stats.branchBreakdown.map((branch, index) => {
                  const isTop = index === 0;
                  return (
                    <div
                      key={branch.id}
                      onClick={() => {
                        onSelectBranch(branch.id);
                        onClose();
                      }}
                      className="group p-2.5 rounded-xl bg-white border border-stone-200/80 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer select-none"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {isTop && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                              الأكبر
                            </span>
                          )}
                          <span className="text-xs font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                            فرع {branch.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-extrabold text-stone-900">
                            {branch.count} فرد
                          </span>
                          <span className="text-[11px] text-stone-400">
                            ({branch.percentage}%)
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-emerald-600 transition-colors mr-1" />
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isTop ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(branch.percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between text-xs text-stone-500">
          <span>انقر على أي فرع لتحديده والانتقال إليه في الشجرة</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
