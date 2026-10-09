import React, { useState, useEffect, useRef } from 'react';
import { X, Edit2, Check } from 'lucide-react';
import type { FamilyMember } from '../types';

interface EditMemberModalProps {
  isOpen: boolean;
  member: FamilyMember | null;
  allMembers: FamilyMember[];
  onClose: () => void;
  onSubmit: (id: string, name: string, parentId: string) => Promise<void>;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  member,
  allMembers,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && member) {
      setName(member.name);
      setParentId(member.parentId || '');
      setError(null);
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  // Helper to find all descendants to avoid circular parenting
  const descendantIds = new Set<string>();
  const collectDescendants = (pId: string) => {
    allMembers
      .filter((m) => m.parentId === pId)
      .forEach((c) => {
        descendantIds.add(c.id);
        collectDescendants(c.id);
      });
  };
  collectDescendants(member.id);

  // Allowed parents: all members except self and descendants
  const eligibleParents = allMembers.filter(
    (m) => m.id !== member.id && !descendantIds.has(m.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('يرجى إدخال اسم الشخص');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(member.id, trimmed, parentId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التعديل');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2 text-stone-800 font-bold text-lg">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Edit2 className="w-4 h-4" />
            </div>
            <span>تعديل الاسم</span>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              اسم الشخص <span className="text-rose-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-sm text-stone-800 transition-all"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              يندرج تحت (الوالد / الأصل)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-sm text-stone-800 transition-all bg-white cursor-pointer"
              disabled={isSubmitting}
            >
              <option value="">شخص رئيسي (جد / أصل الشجرة)</option>
              {eligibleParents.map((m) => (
                <option key={m.id} value={m.id}>
                  ابن / تفرع من: {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
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
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
