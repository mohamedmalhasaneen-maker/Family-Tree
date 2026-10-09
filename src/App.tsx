import { useState, useEffect, useMemo, useCallback } from 'react';
import type { FamilyMember } from './types';
import {
  subscribeFamilyMembers,
  addMember,
  addMultipleMembers,
  updateMember,
  deleteMember,
  seedSampleFamily,
} from './lib/familyService';
import {
  buildTree,
  getAncestorIds,
  getAllNodeIdsWithChildren,
} from './lib/treeUtils';
import { Header } from './components/Header';
import { FamilyTreeCanvas } from './components/FamilyTreeCanvas';
import { AddMemberModal } from './components/AddMemberModal';
import { EditMemberModal } from './components/EditMemberModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { PasswordModal } from './components/PasswordModal';
import { StatsDashboardModal } from './components/StatsDashboardModal';
import { AllDataViewModal } from './components/AllDataViewModal';
import { exportFamilyTreeToPdf } from './lib/pdfExport';
import { calculateTreeStats } from './lib/statsUtils';

const STORAGE_PASSWORD_KEY = 'family_tree_edit_password';

export default function App() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isAllDataOpen, setIsAllDataOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Read-only mode & Password protection state
  const [isReadOnly, setIsReadOnly] = useState<boolean>(true);
  const [passwordHash, setPasswordHash] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_PASSWORD_KEY);
    if (!saved || saved === '1234') {
      localStorage.setItem(STORAGE_PASSWORD_KEY, '2010');
      return '2010';
    }
    return saved;
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordModalMode, setPasswordModalMode] = useState<'unlock' | 'change'>('unlock');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<string>('');
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<FamilyMember | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 3500);
  };

  // Firestore real-time listener for Family Members
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeFamilyMembers(
      (newMembers) => {
        setMembers(newMembers);
        setIsLoading(false);

        // Auto-expand roots on initial data load
        setExpandedIds((prev) => {
          if (prev.size === 0 && newMembers.length > 0) {
            const rootIds = newMembers
              .filter((m) => !m.parentId)
              .map((m) => m.id);
            return new Set(rootIds);
          }
          return prev;
        });
      },
      (error) => {
        console.error('Subscription error:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Build tree hierarchy & statistics
  const rootNodes = useMemo(() => buildTree(members), [members]);
  const treeStats = useMemo(() => calculateTreeStats(members, rootNodes), [members, rootNodes]);

  // Select search result
  const handleSelectMember = useCallback(
    (member: FamilyMember) => {
      const ancestors = getAncestorIds(member.id, members);
      setExpandedIds((prev) => {
        const next = new Set(prev);
        ancestors.forEach((aId) => next.add(aId));
        return next;
      });

      setHighlightedId(member.id);
      setTimeout(() => {
        setHighlightedId((curr) => (curr === member.id ? null : curr));
      }, 3000);
    },
    [members]
  );

  const handleSelectBranch = useCallback(
    (branchId: string) => {
      const member = members.find((m) => m.id === branchId);
      if (member) {
        handleSelectMember(member);
      }
    },
    [members, handleSelectMember]
  );

  // Toggle Read-Only Mode with password check
  const handleToggleReadOnly = () => {
    if (isReadOnly) {
      // Prompt password to unlock
      setPasswordModalMode('unlock');
      setIsPasswordModalOpen(true);
    } else {
      // Re-lock immediately
      setIsReadOnly(true);
      showNotification('تم تفعيل وضع القراءة فقط 🔒');
    }
  };

  const handleSuccessUnlock = () => {
    setIsReadOnly(false);
    showNotification('تم تفعيل وضع التعديل بنجاح 🔓');
  };

  const handleChangePassword = (newPassword: string) => {
    localStorage.setItem(STORAGE_PASSWORD_KEY, newPassword);
    setPasswordHash(newPassword);
    showNotification('تم تحديث كلمة المرور بنجاح 🔑');
  };

  // Check if locked before modifying
  const ensureUnlocked = useCallback(
    (action: () => void) => {
      if (isReadOnly) {
        setPasswordModalMode('unlock');
        setIsPasswordModalOpen(true);
        return false;
      }
      action();
      return true;
    },
    [isReadOnly]
  );

  // Toggle child expansion for a node
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Expand All / Collapse All
  const handleExpandAll = useCallback(() => {
    const allParentIds = getAllNodeIdsWithChildren(members);
    setExpandedIds(new Set(allParentIds));
    showNotification('تم فتح جميع فروع الشجرة');
  }, [members]);

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set());
    showNotification('تم طي جميع الفروع');
  }, []);

  // Action handlers
  const handleOpenAddModal = (parentId = '') => {
    ensureUnlocked(() => {
      setAddParentId(parentId);
      setIsAddModalOpen(true);
    });
  };

  const handleOpenEditModal = (member: FamilyMember) => {
    ensureUnlocked(() => {
      setEditingMember(member);
    });
  };

  const handleOpenDeleteModal = (member: FamilyMember) => {
    ensureUnlocked(() => {
      setDeletingMember(member);
    });
  };

  const handleAddSubmit = async (names: string[], parentId: string) => {
    if (names.length === 1) {
      await addMember(names[0], parentId);
      showNotification(`تمت إضافة «${names[0]}» إلى الشجرة بنجاح`);
    } else {
      await addMultipleMembers(names, parentId);
      showNotification(`تمت إضافة (${names.length}) أشخاص إلى الشجرة بنجاح 🎉`);
    }
    // Ensure parent is expanded so new member(s) are immediately visible
    if (parentId) {
      setExpandedIds((prev) => new Set([...prev, parentId]));
    }
  };

  const handleEditSubmit = async (id: string, name: string, parentId: string) => {
    const existing = members.find((m) => m.id === id);
    if (!existing) return;
    await updateMember(id, name, parentId, existing);
    showNotification(`تم تعديل الاسم إلى «${name}»`);
  };

  const handleDeleteConfirm = async (id: string, cascadeDelete: boolean) => {
    await deleteMember(id, members, cascadeDelete);
    showNotification('تم حذف الشخص بنجاح');
  };

  const handleSeedSample = async () => {
    ensureUnlocked(async () => {
      try {
        await seedSampleFamily();
        showNotification('تم إنشاء شجرة نموذجية بنجاح');
      } catch (err) {
        console.error(err);
        showNotification('تعذر إضافة الشجرة النموذجية', 'error');
      }
    });
  };

  // Download Family Tree as PDF
  const handleDownloadPdf = useCallback(async () => {
    try {
      setIsGeneratingPdf(true);
      showNotification('جارٍ إنشاء ملف PDF عالي الدقة لشجرة عائلات الحسنين...');

      await exportFamilyTreeToPdf(rootNodes, members.length);
      showNotification('تم تحميل ملف PDF بنجاح 📄');
    } catch (error) {
      console.error('PDF export error:', error);
      showNotification('حدث خطأ أثناء إنشاء ملف PDF', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [rootNodes, members.length]);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-['Tajawal',sans-serif] selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold border flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-stone-900 text-white border-stone-800'
                : 'bg-rose-600 text-white border-rose-700'
            }`}
          >
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Top Navigation Header */}
      <Header
        allMembers={members}
        isReadOnly={isReadOnly}
        onToggleReadOnly={handleToggleReadOnly}
        onChangePasswordClick={() => {
          setPasswordModalMode('change');
          setIsPasswordModalOpen(true);
        }}
        onAddPersonClick={() => handleOpenAddModal('')}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onSelectMember={handleSelectMember}
        onSeedSample={handleSeedSample}
        onDownloadPdf={handleDownloadPdf}
        isGeneratingPdf={isGeneratingPdf}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenAllData={() => setIsAllDataOpen(true)}
      />

      {/* Main Family Tree Canvas */}
      <main className="flex-1 relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-73px)] gap-3 text-stone-500">
            <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">جارٍ تحميل شجرة العائلة...</span>
          </div>
        ) : (
          <FamilyTreeCanvas
            rootNodes={rootNodes}
            expandedIds={expandedIds}
            highlightedId={highlightedId}
            isReadOnly={isReadOnly}
            onToggleExpand={handleToggleExpand}
            onAddChild={(parent) => handleOpenAddModal(parent.id)}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
            onAddRoot={() => handleOpenAddModal('')}
          />
        )}
      </main>

      {/* Modals */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        preselectedParentId={addParentId}
        allMembers={members}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
      />

      <EditMemberModal
        isOpen={editingMember !== null}
        member={editingMember}
        allMembers={members}
        onClose={() => setEditingMember(null)}
        onSubmit={handleEditSubmit}
      />

      <DeleteConfirmModal
        isOpen={deletingMember !== null}
        member={deletingMember}
        allMembers={members}
        onClose={() => setDeletingMember(null)}
        onConfirm={handleDeleteConfirm}
      />

      <PasswordModal
        isOpen={isPasswordModalOpen}
        mode={passwordModalMode}
        currentPasswordHash={passwordHash}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccessUnlock={handleSuccessUnlock}
        onChangePassword={handleChangePassword}
      />

      <StatsDashboardModal
        isOpen={isStatsOpen}
        stats={treeStats}
        onClose={() => setIsStatsOpen(false)}
        onSelectBranch={handleSelectBranch}
      />

      <AllDataViewModal
        isOpen={isAllDataOpen}
        members={members}
        rootNodes={rootNodes}
        stats={treeStats}
        onClose={() => setIsAllDataOpen(false)}
        onSelectMember={handleSelectMember}
      />
    </div>
  );
}
