import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Basic PDF export without html2canvas for fallback
export const exportBasicPDF = async () => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Company Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('The First Promovier', 20, 25);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Digital Printing Management System - Dashboard Report', 20, 35);
    
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString('en-GB')}`, 20, 45);
    
    // Line separator
    pdf.setLineWidth(0.5);
    pdf.line(20, 50, pageWidth - 20, 50);
    
    let y = 60;
    
    // Dashboard content
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Dashboard Overview', 20, y);
    y += 15;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const reportSections = [
      'Business Operations Summary',
      '• Order Management: Track and process customer orders',
      '• Inventory Control: Monitor raw materials and stock levels',
      '• Financial Tracking: Revenue, expenses, and profit analysis',
      '• Production Management: Monitor and manage production assignments',
      '• Delivery Coordination: Track shipments and deliveries',
      '',
      'System Status: Operational',
      'Last Data Refresh: ' + new Date().toLocaleString('en-GB'),
      '',
      'Key Performance Areas:',
      '• Customer orders and fulfillment',
      '• Material inventory management',
      '• Production efficiency tracking',
      '• Financial performance monitoring',
      '• Delivery schedule optimization',
      '',
      'For detailed charts and real-time data,',
      'please access the online dashboard at:',
      'http://localhost:3000/dashboard',
      '',
      'Contact Information:',
      'The First Promovier',
      'No. 123, Main Street, Colombo 03, Sri Lanka',
      'Email: contact@firstpromovier.lk',
      'Phone: +94 77 123 4567'
    ];
    
    reportSections.forEach(line => {
      if (y > pageHeight - 30) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, 20, y);
      y += 6;
    });
    
    // Footer
    pdf.setFontSize(8);
    pdf.text(
      'The First Promovier - Digital Printing Management System',
      20,
      pageHeight - 15
    );
    
    // Save
    const filename = `dashboard-basic-report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Basic PDF export failed:', error);
    throw error;
  }
};

export const exportToPDF = async (elementId, filename = 'dashboard-report') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found for PDF export');
      throw new Error('Dashboard content element not found');
    }

    // Add CSS class to fix color issues temporarily
    const originalClasses = element.className;
    element.classList.add('pdf-export-mode');

    // Measure element to capture full content height
    const targetWidth = element.scrollWidth || element.clientWidth || 750;
    const targetHeight = element.scrollHeight || element.clientHeight || 1000;

    // Create canvas from the element with better options to handle modern CSS and full height
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: true,
      logging: false,
      width: targetWidth,
      height: targetHeight,
      windowWidth: targetWidth,
      windowHeight: targetHeight,
      dpi: 300,
      ignoreElements: (element) => {
        // Ignore elements that might cause issues
        return element.classList?.contains('ignore-pdf') || 
               element.tagName === 'SCRIPT' ||
               element.tagName === 'STYLE';
      },
      onclone: (clonedDoc) => {
        // Remove all external stylesheets and problematic styles
        const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
        const styles = clonedDoc.querySelectorAll('style');
        
        links.forEach(link => {
          if (link.href.includes('tailwind') || link.href.includes('globals')) {
            link.remove();
          }
        });
        
        styles.forEach(style => {
          if (style.textContent.includes('lab(') || 
              style.textContent.includes('oklch(') ||
              style.textContent.includes('color-mix(')) {
            style.remove();
          }
        });
        
        // Add safe CSS reset - only override problematic properties, preserve backgrounds and colors set by inline styles
        const safeStyle = clonedDoc.createElement('style');
        safeStyle.textContent = `
          * {
            box-shadow: none !important;
            transition: none !important;
            transform: none !important;
          }
          .text-blue-600 { color: rgb(37, 99, 235) !important; }
          .text-green-600 { color: rgb(22, 163, 74) !important; }
          .text-yellow-600 { color: rgb(217, 119, 6) !important; }
          .text-red-600 { color: rgb(220, 38, 38) !important; }
          .text-gray-600 { color: rgb(75, 85, 99) !important; }
          .text-gray-500 { color: rgb(107, 114, 128) !important; }
          .text-gray-800 { color: rgb(31, 41, 55) !important; }
          .bg-blue-50 { background-color: rgb(239, 246, 255) !important; }
          .bg-green-50 { background-color: rgb(240, 253, 244) !important; }
          .bg-white { background-color: rgb(255, 255, 255) !important; }
          .bg-gray-50 { background-color: rgb(249, 250, 251) !important; }
          .border-gray-300 { border-color: rgb(229, 231, 235) !important; }
          .recharts-wrapper { background-color: rgb(255, 255, 255) !important; }
          .recharts-text { fill: rgb(75, 85, 99) !important; }
        `;
        clonedDoc.head.appendChild(safeStyle);
      }
    });

    // Restore original classes
    element.className = originalClasses;

    // Create PDF with multi-page support
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Margins
    const marginX = 10; // mm
    const marginTop = 10; // mm
    const marginBottom = 12; // mm (leave space for footer)

    // Calculate scale ratio: how many mm per canvas pixel when fitting width
    const usableWidthMM = pdfWidth - marginX * 2;
    const ratioMMPerPx = usableWidthMM / canvas.width;
    const usableHeightMM = pdfHeight - marginTop - marginBottom;

    // Pixel height that fits on one page
    const pageHeightPx = Math.floor(usableHeightMM / ratioMMPerPx);

    // Prepare a temporary canvas to slice the full canvas into page-sized images
    const pageCanvas = document.createElement('canvas');
    const ctx = pageCanvas.getContext('2d');
    pageCanvas.width = canvas.width;

    let renderedHeight = 0;
    let pageIndex = 0;
    while (renderedHeight < canvas.height) {
      // Add a tiny overlap (in pixels) to avoid cutting lines or text at page boundaries
      const overlapPx = 6; // ~3mm at scale=2, tweak if needed
      const remaining = canvas.height - renderedHeight;
      const sliceHeight = Math.min(pageHeightPx, remaining);
      pageCanvas.height = sliceHeight;
      ctx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
      // Copy slice from original canvas
      ctx.drawImage(
        canvas,
        0,
        renderedHeight,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
      );

      const imgData = pageCanvas.toDataURL('image/png');
      const imgWidthMM = usableWidthMM;
      const imgHeightMM = sliceHeight * ratioMMPerPx;
      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', marginX, marginTop, imgWidthMM, imgHeightMM);

      // Footer for this page
      pdf.setFontSize(8);
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        `The First Promovier Dashboard Report | ${new Date().toLocaleString('en-GB')}`,
        marginX,
        pdfHeight - 6
      );

      // Advance with overlap, but ensure we don't loop forever at the end
      if (remaining <= sliceHeight) {
        renderedHeight += sliceHeight;
      } else {
        renderedHeight += sliceHeight - overlapPx;
      }
      pageIndex += 1;
    }

    // Add page numbers
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(60, 60, 60);
      const label = `Page ${i} of ${pageCount}`;
      const labelWidth = pdf.getTextWidth(label);
      pdf.text(label, pdfWidth - marginX - labelWidth, pdfHeight - 6);
    }

    // Save the PDF
    pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const exportDashboardToPDF = async () => {
  try {
    console.log('Starting PDF export...');
    // Try primary method with html2canvas
    return await exportToPDF('dashboard-content', 'dashboard-report');
  } catch (error) {
    console.warn('Primary PDF export failed:', error.message);
    
    // Check if it's the specific lab() color function error
    if (error.message?.includes('lab') || 
        error.message?.includes('color function') ||
        error.message?.includes('Attempting to parse')) {
      console.log('Detected CSS color function issue, trying alternative...');
    }
    
    try {
      // Try alternative method with simpler jsPDF
      console.log('Attempting alternative export method...');
      return await exportToPDFAlternative();
    } catch (altError) {
      console.warn('Alternative PDF export failed:', altError.message);
      
      try {
        // Final fallback - basic PDF report
        console.log('Using basic PDF export fallback...');
        return await exportBasicPDF();
      } catch (basicError) {
        console.error('All PDF export methods failed:', basicError);
        throw new Error('PDF export failed. Please try refreshing the page and attempting again.');
      }
    }
  }
};

// Alternative PDF export method using jsPDF directly
export const exportToPDFAlternative = async () => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Add company header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('The First Promovier', 20, 30);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Digital Printing Management System', 20, 40);
    
    pdf.setFontSize(12);
    pdf.text('Dashboard Report', 20, 50);
    
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`, 20, 60);
    
    // Add a line separator
    pdf.setLineWidth(0.5);
    pdf.line(20, 65, pageWidth - 20, 65);
    
    let yPosition = 80;
    
    // Get dashboard data from localStorage or make API calls
    try {
      // Try to get data from the page
      const overviewCards = document.querySelectorAll('[class*="text-2xl font-bold"]');
      const cardTitles = document.querySelectorAll('[class*="text-sm font-medium"]');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Dashboard Summary', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Extract key metrics
      if (overviewCards.length > 0 && cardTitles.length > 0) {
        for (let i = 0; i < Math.min(4, overviewCards.length); i++) {
          const title = cardTitles[i]?.textContent || `Metric ${i + 1}`;
          const value = overviewCards[i]?.textContent || '0';
          pdf.text(`${title}: ${value}`, 20, yPosition);
          yPosition += 8;
        }
      } else {
        pdf.text('Dashboard data could not be extracted', 20, yPosition);
        yPosition += 8;
      }
      
      yPosition += 10;
      
      // Add note about chart data
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Order Activity', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('For detailed charts and visualizations, please view the dashboard online.', 20, yPosition);
      yPosition += 8;
      pdf.text('This report contains summary information extracted from the dashboard.', 20, yPosition);
      
    } catch (dataError) {
      console.warn('Could not extract dashboard data:', dataError);
      pdf.setFontSize(10);
      pdf.text('Dashboard data extraction failed. Please ensure you are viewing the dashboard.', 20, yPosition);
    }
    
    // Add footer
    pdf.setFontSize(8);
    pdf.text(
      'The First Promovier - Digital Printing Management System',
      20,
      pageHeight - 20
    );
    
    // Save the PDF
    const filename = `dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Alternative PDF export failed:', error);
    throw error;
  }
};

export const exportOrdersToPDF = () => {
  return exportToPDF('orders-content', 'orders-report');
};
