import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import { OperationType, handleFirestoreError } from './firestore-errors';
import type { FamilyMember } from '../types';

const MEMBERS_PATH = 'members';

function generateId(): string {
  return 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}

export function subscribeFamilyMembers(
  onSuccess: (members: FamilyMember[]) => void,
  onError?: (error: Error) => void
): () => void {
  const membersRef = collection(db, MEMBERS_PATH);

  const unsubscribe = onSnapshot(
    membersRef,
    (snapshot) => {
      const members: FamilyMember[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        members.push({
          id: docSnap.id,
          name: data.name || '',
          parentId: data.parentId || '',
          createdBy: data.createdBy || '',
          createdAt: data.createdAt || '',
          updatedAt: data.updatedAt || '',
        });
      });
      onSuccess(members);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, MEMBERS_PATH);
      } catch (err) {
        if (onError && err instanceof Error) {
          onError(err);
        }
      }
    }
  );

  return unsubscribe;
}

export async function addMember(
  name: string,
  parentId: string
): Promise<FamilyMember> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('الاسم مطلوب');
  }

  const id = generateId();
  const docRef = doc(db, MEMBERS_PATH, id);
  const now = new Date().toISOString();

  const newMember: FamilyMember = {
    id,
    name: trimmedName,
    parentId: parentId || '',
    createdBy: '',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(docRef, {
      name: newMember.name,
      parentId: newMember.parentId,
      createdAt: newMember.createdAt,
      updatedAt: newMember.updatedAt,
    });
    return newMember;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${MEMBERS_PATH}/${id}`);
  }
}

export async function updateMember(
  id: string,
  name: string,
  parentId: string,
  existingMember: FamilyMember
): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('الاسم مطلوب');
  }

  // Prevent self-parenting loop
  if (parentId === id) {
    throw new Error('لا يمكن للشخص أن يكون والداً لنفسه');
  }

  const docRef = doc(db, MEMBERS_PATH, id);
  const now = new Date().toISOString();

  try {
    await updateDoc(docRef, {
      name: trimmedName,
      parentId: parentId || '',
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${MEMBERS_PATH}/${id}`);
  }
}

export async function deleteMember(
  id: string,
  allMembers: FamilyMember[],
  cascadeDeleteChildren: boolean
): Promise<void> {
  const docRef = doc(db, MEMBERS_PATH, id);
  const targetMember = allMembers.find((m) => m.id === id);

  if (!targetMember) return;

  // Find all children
  const directChildren = allMembers.filter((m) => m.parentId === id);

  try {
    if (cascadeDeleteChildren && directChildren.length > 0) {
      // Find all descendants recursively
      const descendantIds = new Set<string>();
      const gatherDescendants = (parentId: string) => {
        allMembers
          .filter((m) => m.parentId === parentId)
          .forEach((child) => {
            descendantIds.add(child.id);
            gatherDescendants(child.id);
          });
      };
      gatherDescendants(id);

      const batch = writeBatch(db);
      batch.delete(docRef);
      descendantIds.forEach((dId) => {
        batch.delete(doc(db, MEMBERS_PATH, dId));
      });
      await batch.commit();
    } else {
      // Re-parent direct children to the deleted person's parent (or make root)
      if (directChildren.length > 0) {
        const batch = writeBatch(db);
        const newParentId = targetMember.parentId || '';
        const now = new Date().toISOString();
        directChildren.forEach((child) => {
          batch.update(doc(db, MEMBERS_PATH, child.id), {
            parentId: newParentId,
            updatedAt: now,
          });
        });
        batch.delete(docRef);
        await batch.commit();
      } else {
        await deleteDoc(docRef);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${MEMBERS_PATH}/${id}`);
  }
}

export async function seedSampleFamily(): Promise<void> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  // Grandfather (root)
  const rootId = generateId();
  const rootRef = doc(db, MEMBERS_PATH, rootId);
  batch.set(rootRef, {
    name: 'عبدالله',
    parentId: '',
    createdAt: now,
    updatedAt: now,
  });

  // Sons of Abdullah: محمد, أحمد, محمود
  const mohamedId = generateId();
  const ahmedId = generateId();
  const mahmoudId = generateId();

  batch.set(doc(db, MEMBERS_PATH, mohamedId), {
    name: 'محمد',
    parentId: rootId,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(doc(db, MEMBERS_PATH, ahmedId), {
    name: 'أحمد',
    parentId: rootId,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(doc(db, MEMBERS_PATH, mahmoudId), {
    name: 'محمود',
    parentId: rootId,
    createdAt: now,
    updatedAt: now,
  });

  // Sons of Mohamed: علي, حسن
  const aliId = generateId();
  const hassanId = generateId();

  batch.set(doc(db, MEMBERS_PATH, aliId), {
    name: 'علي',
    parentId: mohamedId,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(doc(db, MEMBERS_PATH, hassanId), {
    name: 'حسن',
    parentId: mohamedId,
    createdAt: now,
    updatedAt: now,
  });

  // Children of Ali: عمر, فاطمة
  const omarId = generateId();
  const fatimaId = generateId();

  batch.set(doc(db, MEMBERS_PATH, omarId), {
    name: 'عمر',
    parentId: aliId,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(doc(db, MEMBERS_PATH, fatimaId), {
    name: 'فاطمة',
    parentId: aliId,
    createdAt: now,
    updatedAt: now,
  });

  // Children of Ahmed: يوسف, سارة
  batch.set(doc(db, MEMBERS_PATH, generateId()), {
    name: 'يوسف',
    parentId: ahmedId,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(doc(db, MEMBERS_PATH, generateId()), {
    name: 'سارة',
    parentId: ahmedId,
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();
}
