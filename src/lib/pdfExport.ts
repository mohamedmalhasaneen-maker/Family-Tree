import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export async function exportFamilyTreeToPdf(elementId = 'family-tree-content'): Promise<void> {
  const container = document.getElementById(elementId);
  const treeNode = container?.querySelector(':scope > div') as HTMLElement | null;

  if (!treeNode) {
    throw new Error('لم يتم العثور على محتوى شجرة العائلة للتحميل');
  }

  // Clone node for off-screen pristine rendering without canvas pan/zoom transforms
  const clone = treeNode.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.position = 'fixed';
  clone.style.left = '-99999px';
  clone.style.top = '0';
  clone.style.width = 'max-content';
  clone.style.backgroundColor = '#ffffff';
  clone.style.padding = '40px';
  clone.style.direction = 'rtl';

  // Add decorative header for PDF
  const titleDiv = document.createElement('div');
  titleDiv.style.textAlign = 'center';
  titleDiv.style.marginBottom = '28px';
  titleDiv.innerHTML = `
    <h1 style="font-size: 26px; font-weight: 800; color: #1c1917; font-family: Tajawal, sans-serif; margin: 0 0 6px 0;">
      شجرة العائلة
    </h1>
    <p style="font-size: 13px; color: #78716c; font-family: Tajawal, sans-serif; margin: 0;">
      مخطط الأنساب والفروع
    </p>
  `;
  clone.insertBefore(titleDiv, clone.firstChild);

  // Remove interactive buttons (action tools, toggles) from the export
  clone.querySelectorAll('button').forEach((btn) => btn.remove());

  document.body.appendChild(clone);

  try {
    // Generate high-resolution PNG using native browser rendering (fully supports Tailwind v4 oklch colors)
    const imgData = await toPng(clone, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      filter: (node) => (node as HTMLElement).tagName !== 'BUTTON',
    });

    // Create an Image object to measure natural dimensions
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('فشل تحميل صورة الشجرة'));
      img.src = imgData;
    });

    const imgNaturalWidth = img.naturalWidth;
    const imgNaturalHeight = img.naturalHeight;

    // Create A4 Landscape PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const availWidth = pageWidth - margin * 2;
    const availHeight = pageHeight - margin * 2;

    const imgWidth = availWidth;
    const imgHeight = (imgNaturalHeight * imgWidth) / imgNaturalWidth;

    let finalWidth = imgWidth;
    let finalHeight = imgHeight;

    if (imgHeight > availHeight) {
      finalHeight = availHeight;
      finalWidth = (imgNaturalWidth * finalHeight) / imgNaturalHeight;
    }

    const posX = margin + (availWidth - finalWidth) / 2;
    const posY = margin + (availHeight - finalHeight) / 2;

    pdf.addImage(imgData, 'PNG', posX, posY, finalWidth, finalHeight);
    pdf.save('family-tree.pdf');
  } finally {
    document.body.removeChild(clone);
  }
}
