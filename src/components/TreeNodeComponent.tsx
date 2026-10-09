import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { FamilyMember, TreeNode } from '../types';
import { MemberCard } from './MemberCard';

interface TreeNodeComponentProps {
  node: TreeNode;
  expandedIds: Set<string>;
  highlightedId: string | null;
  isReadOnly?: boolean;
  onToggleExpand: (id: string) => void;
  onAddChild: (parentMember: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}

export const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({
  node,
  expandedIds,
  highlightedId,
  isReadOnly = false,
  onToggleExpand,
  onAddChild,
  onEdit,
  onDelete,
}) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.member.id);
  const isHighlighted = highlightedId === node.member.id;

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <MemberCard
        member={node.member}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        isHighlighted={isHighlighted}
        isReadOnly={isReadOnly}
        onToggleExpand={() => onToggleExpand(node.member.id)}
        onAddChild={onAddChild}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {/* Children Branch with smooth animation */}
      <AnimatePresence initial={false}>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex flex-col items-center overflow-visible"
          >
            {/* Vertical stem descending from parent */}
            <div className="w-[2px] h-6 bg-stone-300" />

            {/* Container for children */}
            <div className="flex flex-row justify-center items-start">
              {node.children.map((child, index) => {
                const isOnly = node.children.length === 1;
                const isFirst = index === 0;
                const isLast = index === node.children.length - 1;

                return (
                  <div key={child.member.id} className="relative flex flex-col items-center px-3 sm:px-5">
                    {/* Horizontal connecting line above each child */}
                    {!isOnly && (
                      <div className="absolute top-0 left-0 right-0 h-[2px]">
                        {/* Right half (in RTL: leads towards start if first) */}
                        <div
                          className={`absolute top-0 right-0 w-1/2 h-[2px] ${
                            isFirst ? 'bg-transparent' : 'bg-stone-300'
                          }`}
                        />
                        {/* Left half (in RTL: leads towards end if last) */}
                        <div
                          className={`absolute top-0 left-0 w-1/2 h-[2px] ${
                            isLast ? 'bg-transparent' : 'bg-stone-300'
                          }`}
                        />
                      </div>
                    )}

                    {/* Vertical connector down into this child card */}
                    <div className="w-[2px] h-6 bg-stone-300" />

                    {/* Recursive child tree */}
                    <TreeNodeComponent
                      node={child}
                      expandedIds={expandedIds}
                      highlightedId={highlightedId}
                      isReadOnly={isReadOnly}
                      onToggleExpand={onToggleExpand}
                      onAddChild={onAddChild}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
