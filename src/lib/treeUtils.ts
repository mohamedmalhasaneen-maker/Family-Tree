import type { FamilyMember, TreeNode } from '../types';

export function buildTree(members: FamilyMember[]): TreeNode[] {
  const memberMap = new Map<string, TreeNode>();
  const childrenMap = new Map<string, TreeNode[]>();

  // Create TreeNode for every member
  members.forEach((m) => {
    memberMap.set(m.id, {
      member: m,
      children: [],
    });
  });

  // Map children to parent IDs
  members.forEach((m) => {
    const parentId = m.parentId || '';
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    const node = memberMap.get(m.id);
    if (node) {
      childrenMap.get(parentId)!.push(node);
    }
  });

  // Attach children to each node
  memberMap.forEach((node, id) => {
    const children = childrenMap.get(id) || [];
    node.children = children;
  });

  // Identify root nodes:
  // Either parentId is empty string, OR parentId does not exist in memberMap
  const rootNodes: TreeNode[] = [];
  members.forEach((m) => {
    const isRoot = !m.parentId || !memberMap.has(m.parentId);
    if (isRoot) {
      const node = memberMap.get(m.id);
      if (node) {
        rootNodes.push(node);
      }
    }
  });

  return rootNodes;
}

export function getAncestorIds(targetId: string, members: FamilyMember[]): string[] {
  const memberMap = new Map<string, FamilyMember>();
  members.forEach((m) => memberMap.set(m.id, m));

  const ancestors: string[] = [];
  let current = memberMap.get(targetId);

  while (current && current.parentId && memberMap.has(current.parentId)) {
    ancestors.push(current.parentId);
    current = memberMap.get(current.parentId);
  }

  return ancestors;
}

export function getAllNodeIdsWithChildren(members: FamilyMember[]): string[] {
  const parentIds = new Set<string>();
  members.forEach((m) => {
    if (m.parentId) {
      parentIds.add(m.parentId);
    }
  });
  return Array.from(parentIds);
}
