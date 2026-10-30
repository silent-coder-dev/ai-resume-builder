'use client';

import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { ResumeRecord } from '@/lib/resume/record';
import { renderResumeTemplate } from '@/components/preview/templateCatalog';
import { printResumeDocument } from '@/utils/exportPdf';

// Prints any saved resume (for example from My Resumes) without opening it:
// renders it off-screen, hands it to the PDF print engine, then cleans up.
export function printResumeRecord(record: ResumeRecord) {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;pointer-events:none;';
  const target = document.createElement('div');
  target.id = `print-source-${record.id}`;
  host.appendChild(target);
  document.body.appendChild(host);

  const root = createRoot(target);
  try {
    flushSync(() => {
      root.render(renderResumeTemplate(record.templateId, record.data, record.accentColor, record.sectionOrder));
    });
    printResumeDocument(target.id, record.data.personalInfo.fullName || record.title);
  } finally {
    root.unmount();
    host.remove();
  }
}
