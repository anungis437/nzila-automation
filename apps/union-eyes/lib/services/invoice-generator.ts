/**
 * Invoice PDF Generation Service
 * 
 * Generates professional PDF invoices for dues, fees, and other charges.
 */

import { Decimal } from 'decimal.js';

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  
  // Customer info
  customerName: string;
  customerEmail: string;
  customerAddress?: {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  
  // Union info
  unionName: string;
  unionAddress: {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  unionPhone?: string;
  unionEmail?: string;
  unionWebsite?: string;
  
  // Line items
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: Decimal;
    amount: Decimal;
    taxable?: boolean;
  }>;
  
  // Totals
  subtotal: Decimal;
  taxRate?: number;
  taxAmount?: Decimal;
  totalAmount: Decimal;
  amountPaid?: Decimal;
  amountDue?: Decimal;
  
  // Additional info
  terms?: string;
  notes?: string;
  paymentInstructions?: string;
}

export class InvoiceGenerator {
  /**
   * Generate invoice HTML
   */
  static generateHTML(data: InvoiceData): string {
    const amountDue = data.amountDue || data.totalAmount.minus(data.amountPaid || 0);
    const isPaid = amountDue.isZero();
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice ${data.invoiceNumber}</title>
          <style>
            @page { size: letter; margin: 1in; }
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              font-size: 10pt;
              line-height: 1.5;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .invoice-container {
              max-width: 8.5in;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #0070f3;
            }
            .header-left {
              flex: 1;
            }
            .header-right {
              text-align: right;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #0070f3;
              margin-bottom: 5px;
            }
            .invoice-title {
              font-size: 32px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
            }
            .invoice-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px;
            }
            .invoice-info, .customer-info {
              padding: 15px;
              background: #f9f9f9;
              border-radius: 5px;
            }
            .info-label {
              font-weight: bold;
              color: #666;
              font-size: 9pt;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .info-value {
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
            }
            thead {
              background: #0070f3;
              color: white;
            }
            th {
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            th.right {
              text-align: right;
            }
            tbody tr {
              border-bottom: 1px solid #ddd;
            }
            tbody tr:last-child {
              border-bottom: 2px solid #333;
            }
            td {
              padding: 10px 12px;
            }
            td.right {
              text-align: right;
            }
            .totals {
              margin-top: 20px;
              margin-left: auto;
              width: 300px;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
            }
            .totals-row.subtotal {
              border-top: 1px solid #ddd;
            }
            .totals-row.total {
              border-top: 2px solid #333;
              margin-top: 5px;
              padding-top: 10px;
              font-size: 14pt;
              font-weight: bold;
            }
            .totals-row.amount-due {
              background: #fffbeb;
              padding: 12px;
              margin-top: 10px;
              border: 2px solid #f59e0b;
              border-radius: 5px;
              font-size: 14pt;
              font-weight: bold;
              color: #f59e0b;
            }
            .totals-row.paid-stamp {
              background: #d1fae5;
              padding: 12px;
              margin-top: 10px;
              border: 2px solid #10b981;
              border-radius: 5px;
              font-size: 14pt;
              font-weight: bold;
              color: #10b981;
              text-align: center;
            }
            .notes {
              margin-top: 40px;
              padding: 20px;
              background: #f9f9f9;
              border-radius: 5px;
            }
            .notes-title {
              font-weight: bold;
              margin-bottom: 10px;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 9pt;
              color: #666;
            }
            @media print {
              body { margin: 0; }
              .invoice-container { max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Header -->
            <div class="header">
              <div class="header-left">
                <div class="company-name">${data.unionName}</div>
                <div>${data.unionAddress.line1}</div>
                ${data.unionAddress.line2 ? `<div>${data.unionAddress.line2}</div>` : ''}
                <div>${data.unionAddress.city}, ${data.unionAddress.province} ${data.unionAddress.postalCode}</div>
                ${data.unionPhone ? `<div>Phone: ${data.unionPhone}</div>` : ''}
                ${data.unionEmail ? `<div>Email: ${data.unionEmail}</div>` : ''}
              </div>
              <div class="header-right">
                <div class="invoice-title">INVOICE</div>
                <div><strong>Invoice #:</strong> ${data.invoiceNumber}</div>
                <div><strong>Date:</strong> ${data.invoiceDate.toLocaleDateString()}</div>
                <div><strong>Due Date:</strong> ${data.dueDate.toLocaleDateString()}</div>
              </div>
            </div>

            <!-- Invoice and Customer Details -->
            <div class="invoice-details">
              <div class="customer-info">
                <div class="info-label">Bill To:</div>
                <div class="info-value">
                  <strong>${data.customerName}</strong><br>
                  ${data.customerEmail}<br>
                  ${data.customerAddress ? `
                    ${data.customerAddress.line1}<br>
                    ${data.customerAddress.line2 ? `${data.customerAddress.line2}<br>` : ''}
                    ${data.customerAddress.city}, ${data.customerAddress.province} ${data.customerAddress.postalCode}
                  ` : ''}
                </div>
              </div>
              
              <div class="invoice-info">
                <div class="info-label">Payment Terms:</div>
                <div class="info-value">${data.terms || 'Due upon receipt'}</div>
                ${data.amountPaid && data.amountPaid.greaterThan(0) ? `
                  <div class="info-label">Amount Paid:</div>
                  <div class="info-value">$${data.amountPaid.toFixed(2)} CAD</div>
                ` : ''}
              </div>
            </div>

            <!-- Line Items Table -->
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="right">Quantity</th>
                  <th class="right">Unit Price</th>
                  <th class="right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${data.lineItems.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td class="right">${item.quantity}</td>
                    <td class="right">$${item.unitPrice.toFixed(2)}</td>
                    <td class="right">$${item.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Totals -->
            <div class="totals">
              <div class="totals-row subtotal">
                <span>Subtotal:</span>
                <span>$${data.subtotal.toFixed(2)} CAD</span>
              </div>
              ${data.taxAmount && data.taxAmount.greaterThan(0) ? `
                <div class="totals-row">
                  <span>Tax (${((data.taxRate || 0) * 100).toFixed(2)}%):</span>
                  <span>$${data.taxAmount.toFixed(2)} CAD</span>
                </div>
              ` : ''}
              <div class="totals-row total">
                <span>Total:</span>
                <span>$${data.totalAmount.toFixed(2)} CAD</span>
              </div>
              ${data.amountPaid && data.amountPaid.greaterThan(0) ? `
                <div class="totals-row">
                  <span>Amount Paid:</span>
                  <span>-$${data.amountPaid.toFixed(2)} CAD</span>
                </div>
              ` : ''}
              ${isPaid ? `
                <div class="totals-row paid-stamp">
                  ✓ PAID IN FULL
                </div>
              ` : `
                <div class="totals-row amount-due">
                  <span>Amount Due:</span>
                  <span>$${amountDue.toFixed(2)} CAD</span>
                </div>
              `}
            </div>

            <!-- Notes and Payment Instructions -->
            ${data.notes || data.paymentInstructions ? `
              <div class="notes">
                ${data.notes ? `
                  <div class="notes-title">Notes:</div>
                  <div>${data.notes}</div>
                ` : ''}
                ${data.paymentInstructions ? `
                  <div class="notes-title" style="margin-top: 15px;">Payment Instructions:</div>
                  <div>${data.paymentInstructions}</div>
                ` : ''}
              </div>
            ` : ''}

            <!-- Footer -->
            <div class="footer">
              <p>Thank you for your payment!</p>
              <p>Questions? Contact us at ${data.unionEmail || 'info@union.com'}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate invoice for dues payment
   */
  static generateDuesInvoice(params: {
    memberName: string;
    memberEmail: string;
    memberAddress?: InvoiceData['customerAddress'];
    invoiceNumber: string;
    duesAmount: Decimal;
    period: string;
    dueDate: Date;
    unionInfo: {
      name: string;
      address: InvoiceData['unionAddress'];
      phone?: string;
      email?: string;
    };
  }): string {
    const data: InvoiceData = {
      invoiceNumber: params.invoiceNumber,
      invoiceDate: new Date(),
      dueDate: params.dueDate,
      customerName: params.memberName,
      customerEmail: params.memberEmail,
      customerAddress: params.memberAddress,
      unionName: params.unionInfo.name,
      unionAddress: params.unionInfo.address,
      unionPhone: params.unionInfo.phone,
      unionEmail: params.unionInfo.email,
      lineItems: [{
        description: `Union Dues - ${params.period}`,
        quantity: 1,
        unitPrice: params.duesAmount,
        amount: params.duesAmount,
        taxable: false,
      }],
      subtotal: params.duesAmount,
      totalAmount: params.duesAmount,
      amountDue: params.duesAmount,
      terms: 'Due upon receipt',
      paymentInstructions: 'Payment can be made via credit card through the member portal, bank transfer, or payroll deduction.',
    };

    return this.generateHTML(data);
  }

  /**
   * Convert HTML to PDF (placeholder - requires puppeteer or similar)
   */
  static async generatePDF(html: string): Promise<Buffer> {
    // In production, use puppeteer, playwright, or jsPDF
    // For now, return the HTML as buffer
    return Buffer.from(html, 'utf-8');
  }
}

