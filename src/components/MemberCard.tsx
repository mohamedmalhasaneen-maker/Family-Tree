import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Edit2, Trash2 } from 'lucide-react';
import type { FamilyMember } from '../types';

interface MemberCardProps {
  member: FamilyMember;
  hasChildren: boolean;
  isExpanded: boolean;
  isHighlighted?: boolean;
  onToggleExpand: () => void;
  onAddChild: (parentMember: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  hasChildren,
  isExpanded,
  isHighlighted,
  onToggleExpand,
  onAddChild,
  onEdit,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      id={`member-card-${member.id}`}
      className="relative flex flex-col items-center group transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Person Name Card */}
      <div
        className={`relative flex items-center justify-center min-w-[130px] max-w-[200px] px-4 py-2.5 rounded-2xl bg-white border text-center select-none transition-all duration-300 ${
          isHighlighted
            ? 'ring-4 ring-emerald-400 border-emerald-500 shadow-lg scale-105 bg-emerald-50/50'
            : isHovered
            ? 'border-emerald-300 shadow-md -translate-y-0.5'
            : 'border-stone-200 shadow-xs'
        }`}
      >
        {/* Name only */}
        <span className="text-base font-bold text-stone-800 tracking-wide truncate px-1">
          {member.name}
        </span>

        {/* Hover / Quick Action Buttons */}
        <div
          className={`absolute -top-3.5 right-1/2 translate-x-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-stone-900/90 text-white shadow-lg backdrop-blur-xs transition-all duration-200 ${
            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            title="إضافة ابن / ابنة"
            aria-label="إضافة ابن"
            onClick={() => onAddChild(member)}
            className="p-1 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3 bg-stone-700" />
          <button
            type="button"
            title="تعديل الاسم"
            aria-label="تعديل"
            onClick={() => onEdit(member)}
            className="p-1 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3 bg-stone-700" />
          <button
            type="button"
            title="حذف الشخص"
            aria-label="حذف"
            onClick={() => onDelete(member)}
            className="p-1 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Down/Up Arrow Toggle (Shown ONLY if person has children) */}
      {hasChildren ? (
        <button
          type="button"
          onClick={onToggleExpand}
          title={isExpanded ? 'طي الأبناء' : 'عرض الأبناء'}
          aria-label={isExpanded ? 'طي الأبناء' : 'عرض الأبناء'}
          className={`mt-1 flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 cursor-pointer shadow-xs ${
            isExpanded
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-200'
              : 'bg-stone-100 text-stone-600 hover:bg-emerald-100 hover:text-emerald-700 border border-stone-200'
          }`}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 transition-transform duration-200" />
          ) : (
            <ChevronDown className="w-4 h-4 transition-transform duration-200" />
          )}
        </button>
      ) : (
        /* If no children, no toggle arrow is shown. Provide a clean stem placeholder if needed */
        <div className="h-2" />
      )}
    </div>
  );
};
