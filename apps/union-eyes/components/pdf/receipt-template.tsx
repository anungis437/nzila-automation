import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: '2 solid #333',
    paddingBottom: 15,
  },
  logo: {
    width: 80,
    height: 80,
  },
  unionInfo: {
    textAlign: 'right',
    fontSize: 10,
    lineHeight: 1.4,
  },
  unionName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  receiptNumber: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  section: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  label: {
    fontSize: 9,
    color: '#666',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 11,
    color: '#000',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  rowLabel: {
    fontSize: 11,
    color: '#333',
  },
  rowValue: {
    fontSize: 11,
    color: '#000',
    fontWeight: 'bold',
  },
  divider: {
    borderTop: '1 solid #ccc',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2 solid #333',
    paddingHorizontal: 5,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #ccc',
    fontSize: 9,
    textAlign: 'center',
    color: '#999',
    lineHeight: 1.5,
  },
  thankYou: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    padding: '4 8',
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  badgeSuccess: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
});

// Define the data type for the receipt
export interface ReceiptData {
  // Receipt info
  receiptNumber: string;
  paymentDate: string;
  generatedAt?: string;

  // Union info
  unionName: string;
  unionAddress?: string;
  unionPhone?: string;
  unionEmail?: string;
  unionLogo?: string;

  // Member info
  memberName: string;
  memberNumber: string;
  memberEmail?: string;

  // Payment details
  duesAmount: string;
  lateFee?: string;
  processingFee?: string;
  totalAmount: string;

  // Payment method
  paymentMethod: string;
  paymentReference: string;

  // Period info
  billingPeriod?: string;
  dueDate?: string;

  // Notes
  notes?: string;
}

export const ReceiptDocument: React.FC<{ data: ReceiptData }> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with union logo and info */}
        <View style={styles.header}>
          <View>
            {data.unionLogo ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={data.unionLogo} style={styles.logo} />
            ) : (
              <View style={styles.logo}>
                <Text style={{ fontSize: 10, color: '#999' }}>
                  {data.unionName}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.unionInfo}>
            <Text style={styles.unionName}>{data.unionName}</Text>
            {data.unionAddress && <Text>{data.unionAddress}</Text>}
            {data.unionPhone && <Text>Phone: {data.unionPhone}</Text>}
            {data.unionEmail && <Text>Email: {data.unionEmail}</Text>}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>PAYMENT RECEIPT</Text>
        <Text style={styles.receiptNumber}>Receipt #{data.receiptNumber}</Text>

        {/* Payment Status Badge */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={[styles.badge, styles.badgeSuccess]}>
            <Text>✓ PAID</Text>
          </View>
        </View>

        {/* Receipt details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receipt Information</Text>
          <View style={styles.row}>
            <View style={{ width: '50%' }}>
              <Text style={styles.label}>Receipt Number</Text>
              <Text style={styles.value}>{data.receiptNumber}</Text>
            </View>
            <View style={{ width: '50%' }}>
              <Text style={styles.label}>Payment Date</Text>
              <Text style={styles.value}>{data.paymentDate}</Text>
            </View>
          </View>
          {(data.billingPeriod || data.dueDate) && (
            <View style={styles.row}>
              {data.billingPeriod && (
                <View style={{ width: '50%' }}>
                  <Text style={styles.label}>Billing Period</Text>
                  <Text style={styles.value}>{data.billingPeriod}</Text>
                </View>
              )}
              {data.dueDate && (
                <View style={{ width: '50%' }}>
                  <Text style={styles.label}>Due Date</Text>
                  <Text style={styles.value}>{data.dueDate}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Member information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Information</Text>
          <View style={styles.row}>
            <View style={{ width: '50%' }}>
              <Text style={styles.label}>Member Name</Text>
              <Text style={styles.value}>{data.memberName}</Text>
            </View>
            <View style={{ width: '50%' }}>
              <Text style={styles.label}>Member Number</Text>
              <Text style={styles.value}>{data.memberNumber}</Text>
            </View>
          </View>
          {data.memberEmail && (
            <View>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{data.memberEmail}</Text>
            </View>
          )}
        </View>

        {/* Payment details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Dues Amount</Text>
            <Text style={styles.rowValue}>${data.duesAmount}</Text>
          </View>
          {data.lateFee && parseFloat(data.lateFee) > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Late Fee</Text>
              <Text style={styles.rowValue}>${data.lateFee}</Text>
            </View>
          )}
          {data.processingFee && parseFloat(data.processingFee) > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Processing Fee</Text>
              <Text style={styles.rowValue}>${data.processingFee}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>${data.totalAmount}</Text>
          </View>
        </View>

        {/* Payment method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.row}>
            <View style={{ width: '50%' }}>
              <Text style={styles.label}>Method</Text>
              <Text style={styles.value}>{data.paymentMethod}</Text>
            </View>
            <View style={{ width: '50%' }}>
              <Text style={styles.label}>Reference</Text>
              <Text style={styles.value}>{data.paymentReference}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.value}>{data.notes}</Text>
          </View>
        )}

        {/* Thank you message */}
        <Text style={styles.thankYou}>Thank you for your payment!</Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This is an official receipt for your payment to {data.unionName}.
          </Text>
          <Text>
            For questions or concerns, please contact {data.unionEmail || 'your union office'}.
          </Text>
          <Text>
            Generated on {data.generatedAt || new Date().toLocaleString()}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

