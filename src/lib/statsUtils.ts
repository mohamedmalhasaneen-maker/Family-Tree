import type { FamilyMember, TreeNode } from '../types';

export interface BranchStat {
  id: string;
  name: string;
  count: number; // total descendants including the branch head
  percentage: number;
}

export interface TreeStats {
  totalMembers: number;
  totalGenerations: number;
  rootNames: string[];
  largestBranch: BranchStat | null;
  branchBreakdown: BranchStat[];
  parentsCount: number;
  unexpandedCount: number;
}

// Calculate the maximum depth (generations)
function getMaxDepth(node: TreeNode, currentDepth = 1): number {
  if (node.children.length === 0) return currentDepth;
  let maxChildDepth = currentDepth;
  for (const child of node.children) {
    const depth = getMaxDepth(child, currentDepth + 1);
    if (depth > maxChildDepth) {
      maxChildDepth = depth;
    }
  }
  return maxChildDepth;
}

// Count total descendants of a node recursively
function countDescendants(node: TreeNode): number {
  let count = 1; // Count this node
  for (const child of node.children) {
    count += countDescendants(child);
  }
  return count;
}

export function calculateTreeStats(
  members: FamilyMember[],
  rootNodes: TreeNode[]
): TreeStats {
  const totalMembers = members.length;

  if (totalMembers === 0 || rootNodes.length === 0) {
    return {
      totalMembers: 0,
      totalGenerations: 0,
      rootNames: [],
      largestBranch: null,
      branchBreakdown: [],
      parentsCount: 0,
      unexpandedCount: 0,
    };
  }

  // Calculate max generations across all roots
  let totalGenerations = 0;
  for (const root of rootNodes) {
    const depth = getMaxDepth(root, 1);
    if (depth > totalGenerations) {
      totalGenerations = depth;
    }
  }

  const rootNames = rootNodes.map((r) => r.member.name);

  // Identify main branches:
  // If there's 1 root with multiple children, the main branches are those children.
  // If there are multiple roots, the main branches are the roots themselves.
  let branchCandidates: TreeNode[] = [];
  if (rootNodes.length === 1 && rootNodes[0].children.length > 0) {
    branchCandidates = rootNodes[0].children;
  } else {
    branchCandidates = rootNodes;
  }

  const branchBreakdown: BranchStat[] = branchCandidates.map((branch) => {
    const count = countDescendants(branch);
    const percentage = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
    return {
      id: branch.member.id,
      name: branch.member.name,
      count,
      percentage,
    };
  });

  // Sort branches by count descending
  branchBreakdown.sort((a, b) => b.count - a.count);

  const largestBranch = branchBreakdown.length > 0 ? branchBreakdown[0] : null;

  // Parents count: members who have at least one child
  const parentIds = new Set(members.map((m) => m.parentId).filter(Boolean));
  const parentsCount = parentIds.size;

  return {
    totalMembers,
    totalGenerations,
    rootNames,
    largestBranch,
    branchBreakdown,
    parentsCount,
    unexpandedCount: totalMembers - parentsCount,
  };
}
