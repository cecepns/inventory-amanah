import * as XLSX from 'xlsx';

// Print utility function
export const printReport = (reportTitle) => {
  // Create a new window for printing
  const printWindow = window.open('', '', 'height=600,width=800');
  
  // Get the current page content (excluding header buttons)
  const printContent = document.querySelector('.space-y-6').cloneNode(true);
  
  // Remove the action buttons (Print/Export buttons)
  const actionButtons = printContent.querySelector('.flex.space-x-2');
  if (actionButtons) {
    actionButtons.remove();
  }
  
  // Remove filter sections for cleaner print
  const filterSections = printContent.querySelectorAll('.card');
  if (filterSections.length > 0) {
    // Keep only tables and charts, remove filter cards
    const elementsToRemove = [];
    filterSections.forEach(section => {
      const hasTable = section.querySelector('table');
      const hasChart = section.querySelector('.recharts-wrapper');
      const hasCards = section.querySelector('.grid');
      if (!hasTable && !hasChart && !hasCards) {
        elementsToRemove.push(section);
      }
    });
    elementsToRemove.forEach(el => el.remove());
  }
  
  // Create print HTML
  const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportTitle}</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 20px;
          color: #111827;
          line-height: 1.6;
        }
        .space-y-6 > * + * {
          margin-top: 1.5rem;
        }
        .grid {
          display: grid;
          gap: 1rem;
        }
        .grid-cols-1 {
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }
        .grid-cols-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .grid-cols-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .grid-cols-4 {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        .card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          text-align: left;
          font-size: 12px;
        }
        th {
          background-color: #f9fafb;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.05em;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .text-2xl {
          font-size: 1.5rem;
          line-height: 2rem;
        }
        .text-lg {
          font-size: 1.125rem;
          line-height: 1.75rem;
        }
        .font-bold {
          font-weight: 700;
        }
        .font-semibold {
          font-weight: 600;
        }
        .font-medium {
          font-weight: 500;
        }
        .text-gray-900 {
          color: #111827;
        }
        .text-gray-600 {
          color: #4b5563;
        }
        .text-primary-600 {
          color: #2563eb;
        }
        .text-red-600 {
          color: #dc2626;
        }
        .text-green-600 {
          color: #16a34a;
        }
        .text-yellow-600 {
          color: #ca8a04;
        }
        .bg-primary-50 {
          background-color: #eff6ff;
        }
        .bg-red-50 {
          background-color: #fef2f2;
        }
        .bg-green-50 {
          background-color: #f0fdf4;
        }
        .bg-yellow-50 {
          background-color: #fefce8;
        }
        .bg-secondary-50 {
          background-color: #f8fafc;
        }
        .bg-accent-50 {
          background-color: #faf5ff;
        }
        .rounded-lg {
          border-radius: 0.5rem;
        }
        .p-4 {
          padding: 1rem;
        }
        .mb-1 {
          margin-bottom: 0.25rem;
        }
        .mb-4 {
          margin-bottom: 1rem;
        }
        .mt-1 {
          margin-top: 0.25rem;
        }
        .overflow-x-auto {
          overflow-x: auto;
        }
        .whitespace-nowrap {
          white-space: nowrap;
        }
        .px-6 {
          padding-left: 1.5rem;
          padding-right: 1.5rem;
        }
        .py-3 {
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
        }
        .py-4 {
          padding-top: 1rem;
          padding-bottom: 1rem;
        }
        .text-center {
          text-align: center;
        }
        .inline-flex {
          display: inline-flex;
        }
        .items-center {
          align-items: center;
        }
        .justify-between {
          justify-content: space-between;
        }
        .space-y-3 > * + * {
          margin-top: 0.75rem;
        }
        .recharts-wrapper {
          display: none;
        }
        @media print {
          body {
            margin: 0;
            padding: 10px;
          }
          .card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          table {
            font-size: 10px;
          }
          th, td {
            padding: 4px 6px;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-header" style="margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">${reportTitle}</h1>
        <p style="margin: 5px 0 0 0; color: #6b7280;">Dicetak pada: ${new Date().toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>
      ${printContent.innerHTML}
    </body>
    </html>
  `;
  
  printWindow.document.write(printHTML);
  printWindow.document.close();
  
  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 250);
};

// Excel export utility function
export const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fullFilename = `${filename}_${timestamp}.xlsx`;
    
    // Save the file
    XLSX.writeFile(workbook, fullFilename);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Gagal mengekspor data ke Excel. Silakan coba lagi.');
    return false;
  }
};

// Utility function to format currency for Excel (without symbols)
export const formatCurrencyForExcel = (value) => {
  return typeof value === 'number' ? value : 0;
};

// Utility function to format date for Excel
export const formatDateForExcel = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID');
};

// Stock Report specific export data formatter
export const formatStockDataForExcel = (stockData) => {
  return stockData.map(item => ({
    'Kode': item.code,
    'Nama Barang': item.name,
    'Kategori': item.category,
    'Stok Saat Ini': item.currentStock,
    'Stok Minimum': item.minStock,
    'Stok Maksimum': item.maxStock,
    'Harga Satuan': formatCurrencyForExcel(item.unitPrice),
    'Nilai Total': formatCurrencyForExcel(item.totalValue),
    'Lokasi': item.location,
    'Status': item.status === 'low' ? 'Stok Rendah' : item.status === 'normal' ? 'Normal' : 'Overstock',
    'Terakhir Diperbarui': formatDateForExcel(item.lastMovement)
  }));
};

// Purchase Report specific export data formatter
export const formatPurchaseDataForExcel = (purchaseData) => {
  return purchaseData.map(purchase => ({
    'No. Order': purchase.order_number,
    'Supplier': purchase.supplier_name,
    'Tanggal Order': formatDateForExcel(purchase.order_date),
    'Tanggal Diharapkan': formatDateForExcel(purchase.expected_date),
    'Total Amount': formatCurrencyForExcel(purchase.total_amount),
    'Status': purchase.status === 'completed' ? 'Selesai' : purchase.status === 'pending' ? 'Menunggu' : 'Dibatalkan',
    'Catatan': purchase.notes || ''
  }));
};

// Usage Report specific export data formatter
export const formatUsageDataForExcel = (usageData) => {
  return usageData.map(item => ({
    'Kode': item.itemCode,
    'Nama Barang': item.itemName,
    'Kategori': item.category,
    'Total Pemakaian': item.totalUsage,
    'Rata-rata Harian': item.averageDaily,
    'Tren': item.trend === 'up' ? 'Naik' : item.trend === 'down' ? 'Turun' : 'Stabil',
    'Terakhir Digunakan': formatDateForExcel(item.lastUsage)
  }));
}; 