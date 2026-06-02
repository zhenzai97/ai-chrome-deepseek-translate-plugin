import { jsPDF } from 'jspdf';
import type { TranslationDoc } from '../../shared/types';
import { blockToHtml } from '../../shared/utils/blocks';
import { buildExportFilename } from '../../shared/utils/filename';

function buildHtml(doc: TranslationDoc): string {
  const body = doc.blocks.map((block) => blockToHtml(block)).join('');
  return `
    <div style="font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif; font-size: 14px; line-height: 1.6; color: #111;">
      <h1 style="font-size: 22px; margin-bottom: 16px;">${doc.titleTranslated}</h1>
      ${body}
    </div>
  `;
}

export async function exportPdf(doc: TranslationDoc): Promise<{
  blob: Blob;
  filename: string;
}> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '595px';
  container.style.padding = '40px';
  container.style.background = '#fff';
  container.innerHTML = buildHtml(doc);
  document.body.appendChild(container);

  try {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    await pdf.html(container, {
      x: 0,
      y: 0,
      width: 515,
      windowWidth: 595,
      autoPaging: 'text',
      margin: [40, 40, 40, 40],
    });

    return {
      blob: pdf.output('blob'),
      filename: buildExportFilename(doc.titleTranslated, doc.targetLang, 'pdf'),
    };
  } finally {
    document.body.removeChild(container);
  }
}
