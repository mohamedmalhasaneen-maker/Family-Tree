import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Users,
  Layers,
  GitFork,
  ExternalLink,
  Table as TableIcon,
  LayoutGrid,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react';
import type { FamilyMember, TreeNode } from '../types';
import { getMemberFullName, getMemberGeneration } from '../lib/treeUtils';
import type { TreeStats } from '../lib/statsUtils';

interface AllDataViewModalProps {
  isOpen: boolean;
  members: FamilyMember[];
  rootNodes: TreeNode[];
  stats: TreeStats;
  onClose: () => void;
  onSelectMember: (member: FamilyMember) => void;
}

export const AllDataViewModal: React.FC<AllDataViewModalProps> = ({
  isOpen,
  members,
  rootNodes,
  stats,
  onClose,
  onSelectMember,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'generations' | 'branches' | 'table'>('generations');

  // Map for fast lookups
  const memberMap = useMemo(() => {
    const map = new Map<string, FamilyMember>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  // Map children to parent IDs
  const childrenMap = useMemo(() => {
    const map = new Map<string, FamilyMember[]>();
    members.forEach((m) => {
      const pid = m.parentId || '';
      if (!map.has(pid)) {
        map.set(pid, []);
      }
      map.get(pid)!.push(m);
    });
    return map;
  }, [members]);

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      const fullName = getMemberFullName(m.id, members, 4).toLowerCase();
      const parent = memberMap.get(m.parentId);
      const parentName = parent?.name.toLowerCase() || '';
      return fullName.includes(q) || parentName.includes(q);
    });
  }, [members, searchQuery, memberMap]);

  // Group by generation
  const generationGroups = useMemo(() => {
    const groups = new Map<number, FamilyMember[]>();
    filteredMembers.forEach((m) => {
      const gen = getMemberGeneration(m.id, members);
      if (!groups.has(gen)) {
        groups.set(gen, []);
      }
      groups.get(gen)!.push(m);
    });

    // Sort by generation ascending
    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredMembers, members]);

  // Group by branch
  const branchGroups = useMemo(() => {
    // Collect all descendants for a node
    const getDescendantMembers = (node: TreeNode, result: FamilyMember[] = []) => {
      result.push(node.member);
      for (const child of node.children) {
        getDescendantMembers(child, result);
      }
      return result;
    };

    let branches: TreeNode[] = [];
    if (rootNodes.length === 1 && rootNodes[0].children.length > 0) {
      branches = rootNodes[0].children;
    } else {
      branches = rootNodes;
    }

    return branches.map((branch) => {
      const branchMembers = getDescendantMembers(branch);
      const filteredBranchMembers = searchQuery.trim()
        ? branchMembers.filter((m) => filteredMembers.some((fm) => fm.id === m.id))
        : branchMembers;

      return {
        branch,
        members: filteredBranchMembers,
        totalInBranch: branchMembers.length,
      };
    });
  }, [rootNodes, filteredMembers, searchQuery]);

  if (!isOpen) return null;

  const getGenerationTitle = (gen: number): string => {
    switch (gen) {
      case 1:
        return 'الجيل الأول (رأس الشجرة / المؤسس)';
      case 2:
        return 'الجيل الثاني (الأبناء)';
      case 3:
        return 'الجيل الثالث (الأحفاد)';
      case 4:
        return 'الجيل الرابع (أبناء الأحفاد)';
      case 5:
        return 'الجيل الخامس';
      default:
        return `الجيل ${gen}`;
    }
  };

  const handleLocate = (member: FamilyMember) => {
    onSelectMember(member);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/50 backdrop-blur-xs">
      <div
        className="w-full max-w-5xl h-[92vh] bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-stone-100 bg-stone-50/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs text-xl">
              📖
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900 leading-tight">
                سجل بيانات عائلات الحسنين الكامل
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                عرض شامل لجميع أفراد الشجرة والأنساب في صفحة واحدة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div className="px-6 py-3 bg-stone-100/60 border-b border-stone-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-stone-800">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>إجمالي الأفراد:</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs">
                {members.length} فرد
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-bold text-stone-800">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>عدد الأجيال:</span>
              <span className="px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800 text-xs">
                {stats.totalGenerations} أجيال
              </span>
            </div>

            {stats.largestBranch && (
              <div className="hidden sm:flex items-center gap-1.5 font-bold text-stone-800">
                <GitFork className="w-3.5 h-3.5 text-amber-600" />
                <span>أكبر الفروع:</span>
                <span className="text-amber-800">
                  فرع {stats.largestBranch.name} ({stats.largestBranch.count} فرد)
                </span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-stone-500 font-medium">
            عرض {filteredMembers.length} من أصل {members.length} أفراد
          </div>
        </div>

        {/* Search and Tabs Toolbar */}
        <div className="p-4 sm:px-6 border-b border-stone-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200/70 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('generations')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'generations'
                  ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>حسب الأجيال</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('branches')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'branches'
                  ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>حسب الفروع</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>جدول البيانات</span>
            </button>
          </div>

          {/* Quick Search inside modal */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في جميع الأسماء..."
              className="w-full pr-10 pl-8 py-2 rounded-xl bg-stone-50 hover:bg-stone-100/80 focus:bg-white border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium text-stone-800 transition-all outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50/40">
          {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-stone-400">
              <Search className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-sm font-semibold">لم يتم العثور على أي نتائج مطابقة</p>
              <p className="text-xs text-stone-400 mt-1">جرب البحث بكلمة أو اسم آخر</p>
            </div>
          ) : activeTab === 'generations' ? (
            /* Tab 1: Grouped by Generations */
            <div className="space-y-6">
              {generationGroups.map(([genNumber, genMembers]) => (
                <div key={genNumber} className="bg-white rounded-3xl border border-stone-200 p-5 shadow-2xs">
                  {/* Generation header banner */}
                  <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center">
                        {genNumber}
                      </span>
                      <h3 className="text-sm font-extrabold text-stone-900">
                        {getGenerationTitle(genNumber)}
                      </h3>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-stone-100 text-stone-600">
                      {genMembers.length} فرد
                    </span>
                  </div>

                  {/* Generation member cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {genMembers.map((member) => {
                      const parent = memberMap.get(member.parentId);
                      const fullName = getMemberFullName(member.id, members, 3);
                      const children = childrenMap.get(member.id) || [];

                      return (
                        <div
                          key={member.id}
                          className="p-3.5 rounded-2xl border border-stone-200/80 bg-stone-50/50 hover:bg-emerald-50/30 hover:border-emerald-300 transition-all flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-extrabold text-stone-900 text-sm group-hover:text-emerald-700 transition-colors">
                                {member.name}
                              </h4>
                              <button
                                type="button"
                                onClick={() => handleLocate(member)}
                                title="انتقال للشخص في الشجرة"
                                className="p-1 text-stone-400 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors cursor-pointer shrink-0"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <p className="text-xs text-stone-500 font-medium mb-2">
                              {fullName}
                            </p>

                            <div className="space-y-1 text-[11px] text-stone-500 border-t border-stone-200/60 pt-2">
                              {parent ? (
                                <div className="flex items-center justify-between">
                                  <span>ابن / يندرج تحت:</span>
                                  <span className="font-bold text-stone-800">{parent.name}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-emerald-700 font-bold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>رأس الشجرة (أصل العائلة)</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <span>الأبناء:</span>
                                <span className="font-bold text-stone-800">
                                  {children.length > 0 ? (
                                    <span>
                                      {children.length} ({children.map((c) => c.name).join('، ')})
                                    </span>
                                  ) : (
                                    <span className="text-stone-400 font-normal">لا يوجد</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'branches' ? (
            /* Tab 2: Grouped by Main Branches */
            <div className="space-y-6">
              {branchGroups.map(({ branch, members: bMembers, totalInBranch }) => (
                <div key={branch.member.id} className="bg-white rounded-3xl border border-stone-200 p-5 shadow-2xs">
                  {/* Branch header */}
                  <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                        🌿
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-stone-900">
                          فرع {branch.member.name}
                        </h3>
                        <p className="text-[11px] text-stone-400">
                          النسب الكامل لفرع {getMemberFullName(branch.member.id, members, 3)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                        {totalInBranch} أفراد في هذا الفرع
                      </span>
                      <button
                        type="button"
                        onClick={() => handleLocate(branch.member)}
                        className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                        title="الانتقال إلى رأس هذا الفرع في الشجرة"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Branch members grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {bMembers.map((member) => {
                      const gen = getMemberGeneration(member.id, members);
                      const parent = memberMap.get(member.parentId);
                      const fullName = getMemberFullName(member.id, members, 3);
                      const children = childrenMap.get(member.id) || [];

                      return (
                        <div
                          key={member.id}
                          className="p-3.5 rounded-2xl border border-stone-200/80 bg-stone-50/50 hover:bg-amber-50/30 hover:border-amber-300 transition-all flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <h4 className="font-extrabold text-stone-900 text-sm group-hover:text-amber-800 transition-colors">
                                  {member.name}
                                </h4>
                                <span className="text-[10px] font-bold text-stone-500">
                                  الجيل {gen}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleLocate(member)}
                                title="انتقال للشخص في الشجرة"
                                className="p-1 text-stone-400 hover:text-amber-700 hover:bg-white rounded-lg transition-colors cursor-pointer shrink-0"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <p className="text-xs text-stone-500 font-medium mb-2">
                              {fullName}
                            </p>

                            <div className="space-y-1 text-[11px] text-stone-500 border-t border-stone-200/60 pt-2">
                              <div className="flex items-center justify-between">
                                <span>الأصل / الوالد:</span>
                                <span className="font-bold text-stone-800">
                                  {parent ? parent.name : 'رأس الشجرة'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>الأبناء:</span>
                                <span className="font-bold text-stone-800">
                                  {children.length} أفراد
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Tab 3: Full Table View */
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-stone-100/80 text-stone-700 font-extrabold border-b border-stone-200">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">الاسم</th>
                      <th className="py-3 px-4">الاسم الكامل (ثلاثي)</th>
                      <th className="py-3 px-4">الجيل</th>
                      <th className="py-3 px-4">يندرج تحت (الوالد)</th>
                      <th className="py-3 px-4">عدد الأبناء</th>
                      <th className="py-3 px-4 text-center">عرض في الشجرة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredMembers.map((member, idx) => {
                      const gen = getMemberGeneration(member.id, members);
                      const parent = memberMap.get(member.parentId);
                      const fullName = getMemberFullName(member.id, members, 3);
                      const children = childrenMap.get(member.id) || [];

                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-emerald-50/50 transition-colors group"
                        >
                          <td className="py-3 px-4 text-center text-stone-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-extrabold text-stone-900 group-hover:text-emerald-800">
                            {member.name}
                          </td>
                          <td className="py-3 px-4 font-semibold text-stone-700">
                            {fullName}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-bold">
                              الجيل {gen}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-stone-600">
                            {parent ? (
                              <span className="font-medium text-stone-800">{parent.name}</span>
                            ) : (
                              <span className="text-[11px] text-emerald-700 font-bold">
                                رأس الشجرة (جد)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-stone-800">
                            {children.length > 0 ? (
                              <span>{children.length} أبناء</span>
                            ) : (
                              <span className="text-stone-300 font-normal">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleLocate(member)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-emerald-600 hover:text-white text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              <span>انتقال</span>
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-stone-100 bg-stone-50/70 flex items-center justify-between text-xs text-stone-500">
          <span>
            إجمالي البيانات المسجلة: <strong className="text-stone-900 font-bold">{members.length} أفراد</strong> عبر{' '}
            <strong className="text-stone-900 font-bold">{stats.totalGenerations} أجيال</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 text-white font-bold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
