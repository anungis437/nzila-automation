/**
 * Receipt Generation Utility
 * Generate PDF receipts for dues payments
 */
import { jsPDF } from 'jspdf';
import { put } from '@vercel/blob';
import { logger } from '@/lib/logger';

interface ReceiptData {
  transactionId: string;
  memberId: string;
  memberName: string;
  organizationName: string;
  duesAmount: number;
  copeAmount: number;
  pacAmount: number;
  strikeFundAmount: number;
  lateFeeAmount: number;
  totalAmount: number;
  paidDate: Date;
  paymentReference: string;
  periodStart: Date;
  periodEnd: Date;
}

export async function generateReceipt(data: ReceiptData): Promise<string> {
  try {
    // Create PDF document
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('UNION DUES RECEIPT', 105, 20, { align: 'center' });
    
    // Organization info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(data.organizationName, 105, 30, { align: 'center' });
    
    // Receipt details
    doc.setFontSize(10);
    doc.text(`Receipt #: ${data.transactionId.substring(0, 8).toUpperCase()}`, 20, 50);
    doc.text(`Date: ${data.paidDate.toLocaleDateString('en-CA')}`, 20, 60);
    doc.text(`Payment Reference: ${data.paymentReference}`, 20, 70);
    doc.text(`Member: ${data.memberName}`, 20, 80);
    doc.text(`Period: ${data.periodStart.toLocaleDateString('en-CA')} - ${data.periodEnd.toLocaleDateString('en-CA')}`, 20, 90);
    
    // Payment breakdown
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Breakdown:', 20, 110);
    doc.setFont('helvetica', 'normal');
    
    const lineHeight = 8;
    let yPos = 120;
    
    doc.text('Base Dues:', 30, yPos);
    doc.text(`$${data.duesAmount.toFixed(2)}`, 150, yPos, { align: 'right' });
    yPos += lineHeight;
    
    doc.text('COPE Contribution:', 30, yPos);
    doc.text(`$${data.copeAmount.toFixed(2)}`, 150, yPos, { align: 'right' });
    yPos += lineHeight;
    
    doc.text('PAC Contribution:', 30, yPos);
    doc.text(`$${data.pacAmount.toFixed(2)}`, 150, yPos, { align: 'right' });
    yPos += lineHeight;
    
    doc.text('Strike Fund Contribution:', 30, yPos);
    doc.text(`$${data.strikeFundAmount.toFixed(2)}`, 150, yPos, { align: 'right' });
    yPos += lineHeight;
    
    if (data.lateFeeAmount > 0) {
      doc.text('Late Fees:', 30, yPos);
      doc.text(`$${data.lateFeeAmount.toFixed(2)}`, 150, yPos, { align: 'right' });
      yPos += lineHeight;
    }
    
    // Total
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total Paid:', 30, yPos);
    doc.text(`$${data.totalAmount.toFixed(2)}`, 150, yPos, { align: 'right' });
    
    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This receipt is for your records. Please retain for tax purposes.', 105, 270, { align: 'center' });
    doc.text('COPE and PAC contributions may be tax deductible. Consult your tax advisor.', 105, 278, { align: 'center' });
    
    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    // Upload to Vercel Blob
    const filename = `receipt-${data.transactionId}-${Date.now()}.pdf`;
    const blob = await put(`receipts/${data.memberId}/${filename}`, pdfBuffer, {
      access: 'public',
      contentType: 'application/pdf',
    });
    
    logger.info('Receipt generated successfully', {
      transactionId: data.transactionId,
      memberId: data.memberId,
      receiptUrl: blob.url,
    });
    
    return blob.url;
  } catch (error) {
    logger.error('Failed to generate receipt', error as Error, {
      transactionId: data.transactionId,
      memberId: data.memberId,
    });
    throw error;
  }
}

