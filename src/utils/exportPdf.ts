export function printResumeDocument(elementId: string, candidateName: string = 'Resume') {
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    console.error(`Element with id "${elementId}" not found.`);
    return;
  }

  const title = `${candidateName.replace(/[^a-zA-Z0-9]/g, '_') || 'Resume'}`;

  // Clone active document CSS & font links
  const styleElements = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n');

  // Clone content cleanly
  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.no-print').forEach((node) => node.remove());
  clone.style.transform = 'none';
  clone.style.margin = '0 auto';
  clone.style.width = '794px';
  clone.style.boxShadow = 'none';

  // Construct isolated sandbox document
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
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
  let iframe = document.getElementById('resume-print-iframe') as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'resume-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error('Cannot access iframe document');
    return;
  }

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Allow fonts & styles to settle, then invoke clean print
  setTimeout(() => {
    iframe?.contentWindow?.focus();
    iframe?.contentWindow?.print();
  }, 250);
}