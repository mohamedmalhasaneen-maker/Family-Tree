import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  ChevronsDownUp,
  ChevronsUpDown,
  LogIn,
  LogOut,
  Sparkles,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { FamilyMember } from '../types';

interface HeaderProps {
  user: User | null;
  allMembers: FamilyMember[];
  onAddPersonClick: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSelectMember: (member: FamilyMember) => void;
  onSeedSample: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  allMembers,
  onAddPersonClick,
  onExpandAll,
  onCollapseAll,
  onSelectMember,
  onSeedSample,
  onOpenAuth,
  onSignOut,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredMembers = searchQuery.trim()
    ? allMembers.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (member: FamilyMember) => {
    onSelectMember(member);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 sm:px-6 py-3 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Stats */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <span className="text-xl">🌳</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-stone-900 leading-tight">
                شجرة العائلة
              </h1>
              <p className="text-xs text-stone-500 font-medium">
                {allMembers.length > 0 ? (
                  <span>{allMembers.length} أفراد مسجلين</span>
                ) : (
                  <span>شجرة تفاعلية متفرعة</span>
                )}
              </p>
            </div>
          </div>

          {/* Mobile Add Person quick button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={onAddPersonClick}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة شخص</span>
            </button>
          </div>
        </div>

        {/* Center: Search input */}
        <div ref={searchRef} className="relative w-full md:w-72 lg:w-80">
          <div className="relative flex items-center">
            <Search className="absolute right-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="ابحث عن اسم شخص..."
              className="w-full pr-10 pl-8 py-2 rounded-2xl bg-stone-100 hover:bg-stone-100/80 focus:bg-white border border-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium text-stone-800 transition-all outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 p-1 text-stone-400 hover:text-stone-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute top-full mt-1.5 right-0 left-0 bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden max-h-64 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
              {filteredMembers.length > 0 ? (
                <div className="py-1">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-stone-400 border-b border-stone-100">
                    نتائج البحث ({filteredMembers.length})
                  </div>
                  {filteredMembers.map((member) => {
                    const parent = allMembers.find((m) => m.id === member.parentId);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handleSelectResult(member)}
                        className="w-full text-right px-3.5 py-2 hover:bg-emerald-50/70 flex items-center justify-between text-xs text-stone-800 transition-colors cursor-pointer"
                      >
                        <span className="font-bold text-stone-900">{member.name}</span>
                        {parent ? (
                          <span className="text-[11px] text-stone-400">
                            ابن: {parent.name}
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500">
                            رأس الشجرة
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-stone-400">
                  لم يتم العثور على اسم مطابق
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Actions: Expand/Collapse, Add Person, Auth */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* Expand All / Collapse All */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200/60">
            <button
              type="button"
              onClick={onExpandAll}
              title="فتح جميع الفروع"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-white text-stone-700 text-xs font-semibold hover:shadow-2xs transition-all cursor-pointer"
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">توسيع الكل</span>
            </button>
            <button
              type="button"
              onClick={onCollapseAll}
              title="طي جميع الفروع"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-white text-stone-700 text-xs font-semibold hover:shadow-2xs transition-all cursor-pointer"
            >
              <ChevronsDownUp className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">طي الكل</span>
            </button>
          </div>

          {/* Add Person (Desktop) */}
          <button
            type="button"
            onClick={onAddPersonClick}
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة شخص</span>
          </button>

          {/* Seed Sample (if tree has very few or 0 items) */}
          {allMembers.length <= 1 && (
            <button
              type="button"
              onClick={onSeedSample}
              title="إضافة شجرة نموذجية تجريبية للبدء"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 text-xs font-semibold border border-stone-200 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden lg:inline">شجرة نموذجية</span>
            </button>
          )}

          {/* Auth Button */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 border-r border-stone-200 pr-2">
              <div
                title={user.displayName || user.email || ''}
                className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-300 overflow-hidden"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {(user.displayName || user.email || 'م')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onSignOut}
                title="تسجيل الخروج"
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-bold border border-stone-200 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-600" />
              <span>تسجيل الدخول</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
