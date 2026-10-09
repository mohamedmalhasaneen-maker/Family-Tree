export interface FamilyMember {
  id: string;
  name: string;
  parentId: string; // "" for root ancestors
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TreeNode {
  member: FamilyMember;
  children: TreeNode[];
}
