/**
 * Email Template: Deadline Alert Email
 * 
 * Alerts user about approaching or past deadlines
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface DeadlineAlertEmailProps {
  itemType: 'claim' | 'grievance' | 'document';
  itemId: string;
  itemTitle: string;
  deadline: Date;
  daysUntilDeadline: number;
  actionUrl: string;
}

export default function DeadlineAlertEmail({
  itemType = 'claim',
  itemId = '',
  itemTitle = '',
  deadline = new Date(),
  daysUntilDeadline = 0,
  actionUrl = '#',
}: DeadlineAlertEmailProps) {
  const isPastDue = daysUntilDeadline < 0;
  const isUrgent = daysUntilDeadline <= 3 && daysUntilDeadline >= 0;

  const previewText = isPastDue
    ? `OVERDUE: ${itemTitle}`
    : `Deadline reminder: ${itemTitle}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {isPastDue ? (
            <>
              <Heading style={{...h1, color: '#dc2626'}}>
                ⚠️ OVERDUE DEADLINE
              </Heading>
              <Text style={{...text, color: '#dc2626', fontWeight: '600'}}>
                This {itemType} is past its deadline!
              </Text>
            </>
          ) : isUrgent ? (
            <>
              <Heading style={{...h1, color: '#f59e0b'}}>
                ⏰ Urgent Deadline Approaching
              </Heading>
              <Text style={{...text, color: '#f59e0b', fontWeight: '600'}}>
                This {itemType} deadline is in {daysUntilDeadline} day{daysUntilDeadline !== 1 ? 's' : ''}!
              </Text>
            </>
          ) : (
            <>
              <Heading style={h1}>Deadline Reminder</Heading>
              <Text style={text}>
                This {itemType} has an upcoming deadline in {daysUntilDeadline} days.
              </Text>
            </>
          )}

          <Section style={itemSection}>
            <Text style={itemLabel}>{itemType.toUpperCase()}</Text>
            <Heading as="h2" style={h2}>
              {itemTitle}
            </Heading>
            <Text style={itemIdStyle}>ID: {itemId}</Text>
            <Text style={deadlineText}>
              <strong>Deadline:</strong> {new Date(deadline).toLocaleDateString()} at{' '}
              {new Date(deadline).toLocaleTimeString()}
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={isPastDue ? urgentButton : button} href={actionUrl}>
              {isPastDue ? 'Take Action Now' : 'View Details'}
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            To manage your deadline notifications,{' '}
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications`} style={link}>
              update your preferences
            </Link>
            .
          </Text>

          <Text style={footer}>
            © {new Date().getFullYear()} Union Claims. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
};

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: '600',
  margin: '10px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
};

const itemSection = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 40px',
};

const itemLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 5px',
};

const itemIdStyle = {
  color: '#9ca3af',
  fontSize: '14px',
  margin: '5px 0',
};

const deadlineText = {
  color: '#374151',
  fontSize: '16px',
  margin: '15px 0 0',
};

const buttonContainer = {
  padding: '27px 40px',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
};

const urgentButton = {
  ...button,
  backgroundColor: '#dc2626',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
  marginTop: '12px',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};

