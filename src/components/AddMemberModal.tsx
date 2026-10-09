import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Check, Plus, Trash2, Users } from 'lucide-react';
import type { FamilyMember } from '../types';
import { getMemberFullName } from '../lib/treeUtils';

interface AddMemberModalProps {
  isOpen: boolean;
  preselectedParentId?: string;
  allMembers: FamilyMember[];
  onClose: () => void;
  onSubmit: (names: string[], parentId: string) => Promise<void>;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  preselectedParentId = '',
  allMembers,
  onClose,
  onSubmit,
}) => {
  const [names, setNames] = useState<string[]>(['']);
  const [parentId, setParentId] = useState(preselectedParentId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNames(['']);
      setParentId(preselectedParentId);
      setError(null);
      setIsSubmitting(false);
      setTimeout(() => firstInputRef.current?.focus(), 80);
    }
  }, [isOpen, preselectedParentId]);

  if (!isOpen) return null;

  const handleUpdateName = (index: number, value: string) => {
    setNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddNameField = () => {
    setNames((prev) => [...prev, '']);
  };

  const handleRemoveNameField = (index: number) => {
    if (names.length <= 1) return;
    setNames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse all names, splitting by commas/newlines as well if entered
    const parsedNames: string[] = [];
    names.forEach((item) => {
      item.split(/[,،\n]/).forEach((part) => {
        const trimmed = part.trim();
        if (trimmed) {
          parsedNames.push(trimmed);
        }
      });
    });

    if (parsedNames.length === 0) {
      setError('يرجى إدخال اسم شخص واحد على الأقل');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(parsedNames, parentId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الإضافة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedParent = allMembers.find((m) => m.id === parentId);

  // Count valid non-empty names
  const validNamesCount = names.reduce((acc, curr) => {
    const parts = curr.split(/[,،\n]/).map((p) => p.trim()).filter(Boolean);
    return acc + parts.length;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2.5 text-stone-900 font-extrabold text-base sm:text-lg">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <span>إضافة أفراد للشجرة</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4.5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {error}
            </div>
          )}

          {/* Parent selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              يندرج تحت (الوالد / الأصل)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm text-stone-800 transition-all bg-white cursor-pointer"
              disabled={isSubmitting}
            >
              <option value="">شخص رئيسي (جد / أصل الشجرة)</option>
              {allMembers.map((m) => {
                const fullName = getMemberFullName(m.id, allMembers, 3);
                const isRoot = !m.parentId;
                return (
                  <option key={m.id} value={m.id}>
                    تفرع من: {fullName} {isRoot ? '(جد / رأس الشجرة)' : ''}
                  </option>
                );
              })}
            </select>
            {selectedParent && (
              <p className="mt-1 text-xs text-emerald-700 font-medium">
                سيتم إضافة الأشخاص كأبناء تحت:{' '}
                <span className="font-bold">
                  {getMemberFullName(selectedParent.id, allMembers, 3)}
                </span>
              </p>
            )}
          </div>

          {/* Names List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-800">
                أسماء الأبناء / الأشخاص المراد إضافتهم <span className="text-rose-500">*</span>
              </label>
              {validNamesCount > 1 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  <Users className="w-3 h-3" />
                  <span>{validNamesCount} أشخاص</span>
                </span>
              )}
            </div>

            <div className="space-y-2">
              {names.map((nameVal, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-6 text-center text-xs font-extrabold text-stone-400">
                    {index + 1}.
                  </div>
                  <input
                    ref={index === 0 ? firstInputRef : undefined}
                    type="text"
                    value={nameVal}
                    onChange={(e) => handleUpdateName(index, e.target.value)}
                    placeholder={
                      index === 0
                        ? 'مثال: أحمد'
                        : index === 1
                        ? 'اسم الابن الثاني (مثال: محمود)'
                        : `اسم الشخص ${index + 1}`
                    }
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm text-stone-800 transition-all"
                    disabled={isSubmitting}
                  />
                  {names.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveNameField(index)}
                      title="حذف هذا الحقل"
                      className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Another Person Button */}
            <button
              type="button"
              onClick={handleAddNameField}
              disabled={isSubmitting}
              className="mt-1.5 w-full py-2.5 px-3 border border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/70 rounded-xl text-xs font-bold text-emerald-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>+ إضافة شخص آخر لنفس الوالد</span>
            </button>

            <p className="text-[11px] text-stone-500 font-medium">
              💡 يمكنك أيضاً كتابة عدة أسماء في سطر واحد مفصولة بفواصل (مثال: أحمد، محمود، علي).
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'جارٍ الحفظ...'
                  : validNamesCount > 1
                  ? `إضافة (${validNamesCount}) أشخاص إلى الشجرة`
                  : 'إضافة إلى الشجرة'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
