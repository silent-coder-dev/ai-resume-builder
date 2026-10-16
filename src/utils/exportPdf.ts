const PRINT_FRAME_ID = 'resume-print-iframe';
const MAX_STYLE_WAIT_MS = 2500;

function buildFileTitle(candidateName: string): string {
  const safeName = candidateName
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return safeName ? `${safeName}_Resume` : 'Resume';
}

// Resolves when every stylesheet and web font inside the print frame is ready,
// or after a short safety timeout so printing never hangs.
function waitForPrintAssets(doc: Document): Promise<void> {
  const stylesheetLoads = Array.from(
    doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
  )
    .filter((link) => !link.sheet)
    .map(
      (link) =>
        new Promise<void>((resolve) => {
          link.addEventListener('load', () => resolve(), { once: true });
          link.addEventListener('error', () => resolve(), { once: true });
        })
    );

  const assetsReady = Promise.all(stylesheetLoads).then(() =>
    doc.fonts ? doc.fonts.ready.then(() => undefined) : undefined
  );
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, MAX_STYLE_WAIT_MS));
  return Promise.race([assetsReady, timeout]);
}

export function printResumeDocument(elementId: string, candidateName: string = '') {
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    console.error(`Element with id "${elementId}" not found.`);
    return;
  }

  const title = buildFileTitle(candidateName);

  // Copy the app's CSS so the printed page looks exactly like the preview
  const styleElements = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n');
  // The <html> class carries the font variables (Geist) used by the templates
  const htmlClassName = document.documentElement.className.replace(/"/g, '');

  // Clone content and drop editor-only parts (page-break markers, placeholders)
  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.no-print').forEach((node) => node.remove());

  // Construct isolated sandbox document
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en" class="${htmlClassName}">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        ${styleElements}
        <style>
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 210mm !important;
          }
          #print-root {
            width: 794px !important;
            margin: 0 auto !important;
            background: #ffffff !important;
          }
          section, article, li {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        </style>
      </head>
      <body>
        <div id="print-root">
          ${clone.innerHTML}
        </div>
      </body>
    </html>
  `;

  // Use isolated hidden iframe to bypass browser extension hooks
  let iframe = document.getElementById(PRINT_FRAME_ID) as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = PRINT_FRAME_ID;
    iframe.title = 'Resume print preview';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
  }

  const frameWindow = iframe.contentWindow;
  const iframeDoc = frameWindow?.document;
  if (!frameWindow || !iframeDoc) {
    console.error('Cannot access iframe document');
    return;
  }

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Wait for styles and fonts, then open the browser's "Save as PDF" dialog
  void waitForPrintAssets(iframeDoc).then(() => {
    frameWindow.focus();
    frameWindow.print();
  });
}
