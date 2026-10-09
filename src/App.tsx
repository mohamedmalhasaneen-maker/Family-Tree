import { useState, useEffect, useMemo, useCallback } from 'react';
import type { User } from 'firebase/auth';
import type { FamilyMember } from './types';
import {
  auth,
  onAuthStateChanged,
  signOutUser,
} from './lib/firebase';
import {
  subscribeFamilyMembers,
  addMember,
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
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<string>('');
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<FamilyMember | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
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

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    });
    return () => unsubscribe();
  }, [pendingAction]);

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

  // Build tree hierarchy
  const rootNodes = useMemo(() => buildTree(members), [members]);

  // Require Auth guard
  const requireAuth = useCallback(
    (action: () => void) => {
      if (!user) {
        setPendingAction(() => action);
        setIsAuthModalOpen(true);
        return false;
      }
      action();
      return true;
    },
    [user]
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

  // Action handlers
  const handleOpenAddModal = (parentId = '') => {
    requireAuth(() => {
      setAddParentId(parentId);
      setIsAddModalOpen(true);
    });
  };

  const handleOpenEditModal = (member: FamilyMember) => {
    requireAuth(() => {
      setEditingMember(member);
    });
  };

  const handleOpenDeleteModal = (member: FamilyMember) => {
    requireAuth(() => {
      setDeletingMember(member);
    });
  };

  const handleAddSubmit = async (name: string, parentId: string) => {
    if (!user) return;
    await addMember(name, parentId, user);
    showNotification(`تمت إضافة «${name}» إلى الشجرة بنجاح`);
    // Ensure parent is expanded so new member is immediately visible
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
    requireAuth(async () => {
      if (!user) return;
      try {
        await seedSampleFamily(user);
        showNotification('تم إنشاء شجرة نموذجية بنجاح');
      } catch (err) {
        console.error(err);
        showNotification('تعذر إضافة الشجرة النموذجية', 'error');
      }
    });
  };

  const handleSignOut = async () => {
    await signOutUser();
    showNotification('تم تسجيل الخروج بنجاح');
  };

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
        user={user}
        allMembers={members}
        onAddPersonClick={() => handleOpenAddModal('')}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onSelectMember={handleSelectMember}
        onSeedSample={handleSeedSample}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
