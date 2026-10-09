import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { FamilyMember } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  member: FamilyMember | null;
  allMembers: FamilyMember[];
  onClose: () => void;
  onConfirm: (id: string, cascadeDelete: boolean) => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  member,
  allMembers,
  onClose,
  onConfirm,
}) => {
  const [cascadeDelete, setCascadeDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const childrenCount = allMembers.filter((m) => m.parentId === member.id).length;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await onConfirm(member.id, cascadeDelete);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-stone-100 bg-rose-50/50">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-lg">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span>تأكيد حذف الشخص</span>
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
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {error}
            </div>
          )}

          <p className="text-sm text-stone-700 leading-relaxed">
            هل أنت متأكد من رغبتك في حذف <span className="font-bold text-stone-900">«{member.name}»</span> من شجرة العائلة؟
          </p>

          {childrenCount > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <span>تنبيه: هذا الشخص لديه {childrenCount} من الأبناء المباشرين.</span>
              </p>
              <label className="flex items-center gap-2 cursor-pointer select-none mt-2">
                <input
                  type="checkbox"
                  checked={cascadeDelete}
                  onChange={(e) => setCascadeDelete(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className="text-stone-700">
                  حذف جميع الأبناء والأحفاد المتفرعين منه أيضًا
                </span>
              </label>
              {!cascadeDelete && (
                <p className="text-stone-500 text-[11px]">
                  (إذا لم تحدد هذا الخيار، سيتم الاحتفاظ بالأبناء وفصلهم ليصبحوا رؤوس فروع مستقلة)
                </p>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'جارٍ الحذف...' : 'تأكيد الحذف'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
