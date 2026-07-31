/** Build WhatsApp text + trigger PDF download for grocery lists */

/** jsPDF Helvetica is WinAnsi — ₹ / × / fancy dashes become garbage like "¹&2&8&0" */
function pdfSafe(input: unknown): string {
  return String(input ?? '')
    .replace(/₹/g, 'Rs.')
    .replace(/[×✕✖]/g, 'x')
    .replace(/[—–−]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[½]/g, '1/2')
    .replace(/[¼]/g, '1/4')
    .replace(/[¾]/g, '3/4')
    .replace(/[≈]/g, '~')
    .replace(/[•·]/g, '-')
    .replace(/[^\x20-\x7E\n]/g, ''); // drop remaining non-ASCII
}

function inr(n: unknown): string {
  const num = Number(n);
  return `Rs.${Number.isFinite(num) ? Math.round(num) : 0}`;
}

export function groceryToWhatsAppText(groceryList: any): string {
  const lines: string[] = ['*MealDeal grocery list*', ''];

  lines.push('*THIS WEEK (fresh)*');
  for (const row of groceryList.weekly || []) {
    lines.push(
      `• ${row.name} — ${row.packQty}× ${row.packSize} | ${row.brand} | ₹${row.lineTotalInr}`
    );
  }
  lines.push(`_Weekly fresh total: ₹${groceryList.weeklyTotalInr}_`, '');

  lines.push('*MONTHLY STAPLES (full pack price)*');
  for (const row of groceryList.monthly || []) {
    lines.push(
      `• ${row.name} — ${row.packQty}× ${row.packSize} | ${row.brand} | ₹${row.lineTotalInr}`
    );
  }
  lines.push(`_Monthly staples total: ₹${groceryList.monthlyTotalInr}_`, '');

  if (groceryList.spendBreakdown?.plainEnglish) {
    lines.push('*This week food cost*', groceryList.spendBreakdown.plainEnglish);
  } else {
    lines.push(
      `*Est. this week food cost: ₹${groceryList.estimatedWeekFoodSpendInr}*`,
      '(weekly fresh + ¼ of monthly staples)'
    );
  }

  return lines.join('\n');
}

export function shareGroceryWhatsApp(groceryList: any) {
  const text = groceryToWhatsAppText(groceryList);
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

export async function downloadGroceryPdf(groceryList: any) {
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable =
    (autoTableMod as any).default ||
    (autoTableMod as any).autoTable ||
    (typeof autoTableMod === 'function' ? autoTableMod : null);

  const doc = new jsPDF();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.text('MealDeal - Grocery List', 14, 18);
  doc.setFontSize(10);
  doc.text(pdfSafe(new Date().toLocaleDateString('en-IN')), 14, 24);

  const weeklyBody = (groceryList.weekly || []).map((r: any) => [
    pdfSafe(r.name),
    pdfSafe(r.brand),
    pdfSafe(r.qtyPerItem || ''),
    pdfSafe(`${r.packQty} x ${r.packSize}`),
    inr(r.lineTotalInr),
  ]);

  const monthlyBody = (groceryList.monthly || []).map((r: any) => [
    pdfSafe(r.name),
    pdfSafe(r.brand),
    pdfSafe(`${r.packQty} x ${r.packSize}`),
    inr(r.lineTotalInr),
  ]);

  if (typeof autoTable !== 'function') {
    let y = 34;
    doc.setFontSize(12);
    doc.text('This week (fresh)', 14, y);
    y += 6;
    doc.setFontSize(9);
    for (const row of weeklyBody) {
      const line = doc.splitTextToSize(row.join(' | '), 180);
      doc.text(line, 14, y);
      y += 5 * line.length;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }
    y += 6;
    doc.setFontSize(12);
    doc.text(`Weekly total: ${inr(groceryList.weeklyTotalInr)}`, 14, y);
    y += 10;
    doc.text('Monthly staples', 14, y);
    y += 6;
    doc.setFontSize(9);
    for (const row of monthlyBody) {
      const line = doc.splitTextToSize(row.join(' | '), 180);
      doc.text(line, 14, y);
      y += 5 * line.length;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }
    doc.save(`MealDeal-grocery-${new Date().toISOString().slice(0, 10)}.pdf`);
    return;
  }

  autoTable(doc, {
    startY: 30,
    head: [['Item', 'Brand', 'Qty/item', 'Buy', 'Price']],
    body: weeklyBody,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
  });

  let y = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.text(`Weekly fresh total: ${inr(groceryList.weeklyTotalInr)}`, 14, y);

  y += 10;
  doc.setFontSize(12);
  doc.text('Monthly staples', 14, y);

  autoTable(doc, {
    startY: y + 4,
    head: [['Item', 'Brand', 'Buy', 'Full pack']],
    body: monthlyBody,
    theme: 'striped',
    headStyles: { fillColor: [5, 150, 105], textColor: 255 },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  const explain = pdfSafe(
    groceryList.spendBreakdown?.plainEnglish ||
      `Est. this week: ${inr(groceryList.estimatedWeekFoodSpendInr)} = weekly + 1/4 monthly`
  );
  const split = doc.splitTextToSize(explain, 180);
  doc.text(split, 14, y);

  doc.save(`MealDeal-grocery-${new Date().toISOString().slice(0, 10)}.pdf`);
}
