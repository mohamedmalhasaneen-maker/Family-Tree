import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Unlock, Key, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  mode: 'unlock' | 'change';
  currentPasswordHash: string;
  onClose: () => void;
  onSuccessUnlock: () => void;
  onChangePassword: (newPassword: string) => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  mode: initialMode,
  currentPasswordHash,
  onClose,
  onSuccessUnlock,
  onChangePassword,
}) => {
  const [mode, setMode] = useState<'unlock' | 'change'>(initialMode);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccessMsg(null);
      setShowPassword(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    if (password === currentPasswordHash) {
      setError(null);
      onSuccessUnlock();
      onClose();
    } else {
      setError('كلمة المرور غير صحيحة! يرجى المحاولة مجدداً.');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('يرجى إدخال كلمة المرور الحالية');
      return;
    }
    if (password !== currentPasswordHash) {
      setError('كلمة المرور الحالية غير صحيحة');
      return;
    }
    if (!newPassword || newPassword.length < 3) {
      setError('كلمة المرور الجديدة يجب أن تكون 3 أحرف/أرقام على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    onChangePassword(newPassword);
    setSuccessMsg('تم تغيير كلمة المرور بنجاح!');
    setError(null);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2 text-stone-800 font-bold text-base sm:text-lg">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                mode === 'unlock'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {mode === 'unlock' ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Key className="w-4 h-4" />
              )}
            </div>
            <span>
              {mode === 'unlock' ? 'إلغاء وضع القراءة فقط' : 'تغيير كلمة المرور'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'unlock' ? (
            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <p className="text-xs text-stone-600 leading-relaxed">
                أدخل كلمة المرور لتعطيل «وضع القراءة فقط» وإظهار أزرار إضافة وتعديل وحذف أفراد الشجرة.
              </p>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-sm text-stone-800 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
                  <span>
                    كلمة المرور الافتراضية: <strong className="font-mono text-stone-700">1234</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('change');
                      setError(null);
                      setPassword('');
                    }}
                    className="text-emerald-700 hover:underline font-semibold cursor-pointer"
                  >
                    تغيير كلمة المرور
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>تفعيل وضع التعديل</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  كلمة المرور الحالية
                </label>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور الحالية (الافتراضية: 1234)"
                  className="w-full px-4 py-2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm text-stone-800 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="كلمة المرور الجديدة..."
                  className="w-full px-4 py-2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm text-stone-800 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  تأكيد كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور الجديدة..."
                  className="w-full px-4 py-2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm text-stone-800 transition-all font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setMode('unlock');
                    setError(null);
                    setPassword('');
                  }}
                  className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                >
                  الرجوع لنافذة الفتح
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>حفظ كلمة المرور</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
