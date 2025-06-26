// --- pdfGenerator.js ---
function generatePDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 15;

  // Classic blue theme
  // 1. HEADER (24pt height, was 32)
  doc.setFillColor(25, 55, 109);
  doc.rect(0, 0, pageW, 24, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(35);
  doc.text('A N I L   D I A G N O S T I C S', pageW / 2, 15, { align: 'center' });

  // 2. INVOICE BOX (move up)
  const invoiceY = 36; // was 50
  doc.setFillColor(231, 238, 255);
  doc.roundedRect(margin, invoiceY, pageW - 2 * margin, 20, 4, 4, 'F');
  doc.setFontSize(16);
  doc.setTextColor(25, 55, 109);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Details', margin + 5, invoiceY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(`Receipt No: ${data.receiptNo}`, margin + 5, invoiceY + 15);
  doc.text(
    `Date: ${new Date(data.date).toLocaleDateString('en-IN')}`,
    pageW - margin - 5,
    invoiceY + 15,
    { align: 'right' }
  );

  // 3. PATIENT BOX (move up)
  const patientY = 60; // was 78
  doc.setFillColor(243, 246, 255);
  doc.roundedRect(margin, patientY, pageW - 2 * margin, 35, 4, 4, 'F');
  doc.setTextColor(25, 55, 109);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', margin + 5, patientY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.name}`, margin + 5, patientY + 15);
  doc.text(`Age: ${data.age} yrs`, margin + 5, patientY + 23);
  doc.text(`Gender: ${data.gender}`, pageW / 2, patientY + 15);
  doc.text(`Phone:  ${data.phone}`, pageW / 2, patientY + 23);

  // 4. TABLE (move down for uniform spacing)
  const tableY = patientY + 35 + 12; // 12pt space after patient info
  // Sort tests by code
  const sortedTests = (data.tests || []).slice().sort((a, b) => a.code.localeCompare(b.code));

  // Split into chunks of 7
  function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }
  const testChunks = chunkArray(sortedTests, 7);

  let tableStartY = tableY;
  testChunks.forEach((chunk, idx) => {
    doc.autoTable({
      startY: tableStartY,
      head: [[
        'S.No', 'Code', 'Test Description', 'Amount (Rs)'
      ]],
      body: chunk.map((t, i) => [
        (idx * 7 + i + 1).toString(),
        t.code,
        t.description,
        `Rs ${(t.rate * (t.qty || 1)).toFixed(2)}`
      ]),
      theme: 'grid',
      styles: { overflow: 'linebreak', cellPadding: 4, fontSize: 12 },
      headStyles: {
        fillColor: [25, 55, 109], textColor: 255, fontStyle: 'bold', fontSize: 14, halign: 'center'
      },
      bodyStyles: { halign: 'center' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin, bottom: 65 },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 30 },
        2: { cellWidth: pageW - 2 * margin - 20 - 30 - 40, halign: 'left' },
        3: { cellWidth: 40 }
      },
      tableLineColor: [25, 55, 109], tableLineWidth: 0.5,
      didDrawPage: function (data) {
        // Only show on continued pages (not last chunk)
        if (idx < testChunks.length - 1) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(10);
          doc.setTextColor(120);
          const continuedY = pageH - 40;
          doc.text('Continued on next page...', pageW / 2, continuedY, { align: 'center' });
        }
      },
    });
    tableStartY = margin + 24; // For subsequent pages, start after header
    if (idx < testChunks.length - 1) doc.addPage();
  });

  // 5. TOTAL (box 140x16 at tableEndY+8)
  const endY = doc.lastAutoTable.finalY + 8;
  const boxW = 140;
  doc.setFillColor(25, 55, 109);
  doc.roundedRect((pageW - boxW) / 2, endY, boxW, 16, 6, 6, 'F');
  doc.setTextColor(255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: Rs ${data.total.toFixed(2)}`, pageW / 2, endY + 11, { align: 'center' });

  // 6. PAYMENT MODE at y=endY+25
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(`Payment Mode: ${data.payment}`, margin, endY + 25);

  // Define stamp size for use below
  const stampW = 72, stampH = 39;
  const stampBottomMargin = 20; // Increased to move stamp up

  // 7. STAMP (draw only on last page, in reserved area)
  doc.setPage(doc.internal.getNumberOfPages()); // Go to last page
  const currentStampPage = doc.internal.getCurrentPageInfo().pageNumber;
  if (currentStampPage === doc.internal.getNumberOfPages()) {
    // Use a standard built-in font for the stamp
    doc.setFont("helvetica", "bold"); // Use built-in Helvetica Bold for the stamp
    doc.setFontSize(14);
    const stampX = pageW - margin - stampW;
    const stampY = pageH - stampH - stampBottomMargin;
    doc.setFillColor(240, 244, 255);
    doc.roundedRect(stampX, stampY, stampW, stampH, 6, 6, 'F');
    doc.setDrawColor(25, 55, 109); doc.setLineWidth(1.1);
    doc.roundedRect(stampX, stampY, stampW, stampH, 6, 6);
    doc.setTextColor(25, 55, 109);
    // Stamp text
    const head1Y = stampY + 6;
    const head2Y = head1Y + 8;
    doc.text('ANIL',             stampX + stampW/2, head1Y, { align: 'center' });
    doc.text('DIAGNOSTICS', stampX + stampW/2, head2Y, { align: 'center' });
    doc.setFont('helvetica', 'normal'); // Set normal weight for details
    doc.setFontSize(8); doc.setTextColor(70);
    const details = [
      '(Sample Collection Centre)',
      'B.S. Maktha, Begumpet',
      'Hyderabad 500016 (T.S.)',
      'Ph: 9908722079'
    ];
    let yPos = head2Y + 6;
    details.forEach(line => {
      doc.text(line, stampX + stampW/2, yPos, { align: 'center' });
      yPos += 5;
    });
  }

  // 8. FOOTER will be drawn by the page numbering loop for its last page.
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(160);
    doc.text(`Page ${i} of ${pageCount}`, pageW/2, pageH - 2, { align: 'center' });
    if (i === pageCount) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(120);
      doc.text('Thank you for choosing Anil Diagnostics.', pageW/2, pageH - 10, { align: 'center' });
    }
  }

  const filename = `Anil_Diagnostics_Invoice_${data.receiptNo}.pdf`;
  const pdfBlob = doc.output('blob');
  const pdfUrl = doc.output('bloburl');
  const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

  // Trigger download immediately
  doc.save(filename);

  // Show modal for Open/Share options after download
  const modal = document.getElementById('pdfModal');
  const openBtn = document.getElementById('openPdfBtn');
  const closeBtn = document.getElementById('closePdfModal');
  const shareBtn = document.getElementById('sharePdfBtn');

  if (modal && openBtn && closeBtn) { // removed downloadBtn here
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
    modal.style.display = 'flex';

    openBtn.onclick = () => {
      window.open(pdfUrl, '_blank');
      modal.style.opacity = '0';
      modal.style.pointerEvents = 'none';
      modal.style.display = 'none';
    };
    closeBtn.onclick = () => {
      modal.style.opacity = '0';
      modal.style.pointerEvents = 'none';
      modal.style.display = 'none';
    };
    // No downloadBtn.onclick needed here as it's already downloaded

    if (shareBtn && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      shareBtn.style.display = 'inline-block';
      shareBtn.onclick = async () => {
        try {
          await navigator.share({
            files: [pdfFile],
            title: filename,
            text: 'Here is your PDF bill from Anil Diagnostics.'
          });
          modal.style.opacity = '0';
          modal.style.pointerEvents = 'none';
          modal.style.display = 'none';
        } catch (err) {
          alert('Sharing failed or was cancelled.');
        }
      };
    } else if (shareBtn) {
      shareBtn.style.display = 'none';
    }
  }
}