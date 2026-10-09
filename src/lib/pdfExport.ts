import jsPDF from 'jspdf';
import type { TreeNode } from '../types';

interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  width: number;
  subtreeWidth: number;
  children: LayoutNode[];
}

const CARD_W = 140;
const CARD_H = 46;
const H_GAP = 28;
const V_GAP = 55;
const HEADER_H = 100;
const MARGIN = 40;

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// Compute total horizontal space required by a node and its descendants
function computeSubtreeWidth(node: TreeNode): number {
  if (node.children.length === 0) {
    return CARD_W;
  }
  let totalChildrenWidth = 0;
  for (let i = 0; i < node.children.length; i++) {
    totalChildrenWidth += computeSubtreeWidth(node.children[i]);
    if (i < node.children.length - 1) {
      totalChildrenWidth += H_GAP;
    }
  }
  return Math.max(CARD_W, totalChildrenWidth);
}

// Calculate (x, y) coordinates for all nodes in the tree
function layoutNode(
  node: TreeNode,
  leftX: number,
  depth: number
): LayoutNode {
  const subtreeW = computeSubtreeWidth(node);
  const y = MARGIN + HEADER_H + depth * (CARD_H + V_GAP);

  const childrenLayout: LayoutNode[] = [];
  if (node.children.length === 0) {
    const x = leftX + (subtreeW - CARD_W) / 2;
    return { node, x, y, width: CARD_W, subtreeWidth: subtreeW, children: [] };
  }

  let currentChildX = leftX;
  for (const child of node.children) {
    const childSubtreeW = computeSubtreeWidth(child);
    const childLayout = layoutNode(child, currentChildX, depth + 1);
    childrenLayout.push(childLayout);
    currentChildX += childSubtreeW + H_GAP;
  }

  // Center parent card above its children span
  const firstChildCenterX = childrenLayout[0].x + CARD_W / 2;
  const lastChildCenterX = childrenLayout[childrenLayout.length - 1].x + CARD_W / 2;
  const parentCenterX = (firstChildCenterX + lastChildCenterX) / 2;
  const x = parentCenterX - CARD_W / 2;

  return {
    node,
    x,
    y,
    width: CARD_W,
    subtreeWidth: subtreeW,
    children: childrenLayout,
  };
}

// Collect all nodes to draw lines and cards
function flattenLayout(
  root: LayoutNode,
  allNodes: LayoutNode[] = []
): LayoutNode[] {
  allNodes.push(root);
  for (const child of root.children) {
    flattenLayout(child, allNodes);
  }
  return allNodes;
}

export async function exportFamilyTreeToPdf(
  rootNodes: TreeNode[],
  totalMembersCount: number
): Promise<void> {
  if (rootNodes.length === 0) {
    throw new Error('لا توجد بيانات في شجرة العائلة لتحميلها');
  }

  // Wait for fonts to be ready
  if (document.fonts) {
    await document.fonts.ready;
  }

  // 1. Calculate positions for all roots and descendants
  let currentX = MARGIN;
  const rootLayouts: LayoutNode[] = [];
  for (const root of rootNodes) {
    const rootSubtreeW = computeSubtreeWidth(root);
    const layout = layoutNode(root, currentX, 0);
    rootLayouts.push(layout);
    currentX += rootSubtreeW + H_GAP * 2;
  }

  // 2. Determine canvas bounding box
  const allLayoutNodes: LayoutNode[] = [];
  for (const rootLayout of rootLayouts) {
    flattenLayout(rootLayout, allLayoutNodes);
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of allLayoutNodes) {
    if (n.x < minX) minX = n.x;
    if (n.x + CARD_W > maxX) maxX = n.x + CARD_W;
    if (n.y + CARD_H > maxY) maxY = n.y + CARD_H;
  }

  // If tree extends to the left of MARGIN, shift all nodes
  const offsetX = minX < MARGIN ? MARGIN - minX : 0;
  if (offsetX > 0) {
    for (const n of allLayoutNodes) {
      n.x += offsetX;
    }
    maxX += offsetX;
  }

  const canvasWidth = Math.max(maxX + MARGIN, 800);
  const canvasHeight = Math.max(maxY + MARGIN, 550);

  // 3. Create high-resolution Canvas (Scale 2x for Retina sharpness)
  const SCALE = 2;
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth * SCALE;
  canvas.height = canvasHeight * SCALE;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('تعذر إنشاء مساحة الرسم للـ PDF');
  }

  ctx.scale(SCALE, SCALE);

  // Draw background
  ctx.fillStyle = '#fafaf9';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw subtle border around whole document
  ctx.strokeStyle = '#e7e5e4';
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, canvasWidth - 16, canvasHeight - 16);

  // 4. Draw Header
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';

  // Title
  ctx.font = 'bold 28px "Tajawal", -apple-system, sans-serif';
  ctx.fillStyle = '#1c1917';
  ctx.fillText('شجرة عائلات الحسنين', canvasWidth / 2, MARGIN + 36);

  // Subtitle & stats
  ctx.font = '500 13px "Tajawal", -apple-system, sans-serif';
  ctx.fillStyle = '#78716c';
  ctx.fillText(
    `مخطط النسب العائلي الشامل • إجمالي أفراد الشجرة: ${totalMembersCount} فرد`,
    canvasWidth / 2,
    MARGIN + 62
  );

  // Decorative divider line under header
  ctx.strokeStyle = '#d6d3d1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(canvasWidth / 2 - 180, MARGIN + 76);
  ctx.lineTo(canvasWidth / 2 + 180, MARGIN + 76);
  ctx.stroke();

  // 5. Draw Branch Connecting Lines
  ctx.strokeStyle = '#78716c';
  ctx.lineWidth = 2;

  for (const parent of allLayoutNodes) {
    if (parent.children.length === 0) continue;

    const parentBottomX = parent.x + CARD_W / 2;
    const parentBottomY = parent.y + CARD_H;
    const branchMidY = parentBottomY + V_GAP / 2;

    // Stem coming down from parent
    ctx.beginPath();
    ctx.moveTo(parentBottomX, parentBottomY);
    ctx.lineTo(parentBottomX, branchMidY);
    ctx.stroke();

    if (parent.children.length === 1) {
      // Single child: connect straight down
      const child = parent.children[0];
      const childTopX = child.x + CARD_W / 2;
      ctx.beginPath();
      ctx.moveTo(parentBottomX, branchMidY);
      ctx.lineTo(childTopX, child.y);
      ctx.stroke();
    } else {
      // Multiple children: horizontal branching bar
      const firstChildCenterX = parent.children[0].x + CARD_W / 2;
      const lastChildCenterX = parent.children[parent.children.length - 1].x + CARD_W / 2;
      const minChildX = Math.min(firstChildCenterX, lastChildCenterX);
      const maxChildX = Math.max(firstChildCenterX, lastChildCenterX);

      ctx.beginPath();
      ctx.moveTo(minChildX, branchMidY);
      ctx.lineTo(maxChildX, branchMidY);
      ctx.stroke();

      // Vertical stem down to each child
      for (const child of parent.children) {
        const childCenterX = child.x + CARD_W / 2;
        ctx.beginPath();
        ctx.moveTo(childCenterX, branchMidY);
        ctx.lineTo(childCenterX, child.y);
        ctx.stroke();
      }
    }
  }

  // 6. Draw Member Cards
  for (const n of allLayoutNodes) {
    // Card background & shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.04)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    drawRoundedRect(ctx, n.x, n.y, CARD_W, CARD_H, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // Card border
    drawRoundedRect(ctx, n.x, n.y, CARD_W, CARD_H, 12);
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Person Name text
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 16px "Tajawal", -apple-system, sans-serif';

    // Truncate or measure text if extremely long
    let displayName = n.node.member.name;
    if (ctx.measureText(displayName).width > CARD_W - 16) {
      ctx.font = 'bold 14px "Tajawal", -apple-system, sans-serif';
    }

    ctx.fillText(displayName, n.x + CARD_W / 2, n.y + CARD_H / 2);
  }

  // 7. Embed in jsPDF with A4 Landscape Page Scaling
  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginMm = 8;
  const availWidth = pageWidth - marginMm * 2;
  const availHeight = pageHeight - marginMm * 2;

  const canvasAspect = canvasWidth / canvasHeight;
  const availAspect = availWidth / availHeight;

  let renderWidth = availWidth;
  let renderHeight = availWidth / canvasAspect;

  if (renderHeight > availHeight) {
    renderHeight = availHeight;
    renderWidth = availHeight * canvasAspect;
  }

  const posX = marginMm + (availWidth - renderWidth) / 2;
  const posY = marginMm + (availHeight - renderHeight) / 2;

  pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');
  pdf.save('شجرة_عائلات_الحسنين.pdf');
}
