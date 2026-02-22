import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface SessionReminderEmailProps {
  memberName: string;
  courseName: string;
  sessionDate: string;
  sessionTime: string;
  daysUntilSession: number;
  location?: string;
  instructorName?: string;
  sessionDuration?: number;
  materialsNeeded?: string[];
  specialInstructions?: string;
  dashboardUrl: string;
  unionName: string;
}

export default function SessionReminderEmail({
  memberName = "Member",
  courseName = "Training Course",
  sessionDate = "December 15, 2025",
  sessionTime = "9:00 AM",
  daysUntilSession = 7,
  location,
  instructorName,
  sessionDuration,
  materialsNeeded = [],
  specialInstructions,
  dashboardUrl = "https://example.com/dashboard",
  unionName = "Union",
}: SessionReminderEmailProps) {
  const urgencyColor = daysUntilSession <= 1 ? "#dc2626" : daysUntilSession <= 3 ? "#f59e0b" : "#1e40af";
  const urgencyBg = daysUntilSession <= 1 ? "#fef2f2" : daysUntilSession <= 3 ? "#fffbeb" : "#eff6ff";
  
  return (
    <Html>
      <Head />
      <Preview>
        {daysUntilSession === 1 ? "Tomorrow" : `In ${daysUntilSession} days`}: {courseName} session
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>
              {daysUntilSession === 1 ? "Session Tomorrow!" : `Session in ${daysUntilSession} Days`}
            </Heading>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Hello {memberName},</Text>

            <Section style={{...alertBox, backgroundColor: urgencyBg, borderColor: urgencyColor}}>
              <Text style={{...alertText, color: urgencyColor}}>
                <strong>
                  {daysUntilSession === 1
                    ? "Your training session starts tomorrow!"
                    : `Your training session starts in ${daysUntilSession} days.`}
                </strong>
              </Text>
            </Section>

            <Text style={paragraph}>
              This is a reminder about your upcoming session for <strong>{courseName}</strong>.
            </Text>

            <Section style={infoBox}>
              <Heading as="h2" style={h2}>
                Session Details
              </Heading>

              <table style={detailsTable}>
                <tbody>
                  <tr>
                    <td style={labelCell}>📅 Date:</td>
                    <td style={valueCell}>{sessionDate}</td>
                  </tr>
                  <tr>
                    <td style={labelCell}>🕐 Time:</td>
                    <td style={valueCell}>{sessionTime}</td>
                  </tr>
                  {sessionDuration && (
                    <tr>
                      <td style={labelCell}>⏱️ Duration:</td>
                      <td style={valueCell}>{sessionDuration} hours</td>
                    </tr>
                  )}
                  {location && (
                    <tr>
                      <td style={labelCell}>📍 Location:</td>
                      <td style={valueCell}>{location}</td>
                    </tr>
                  )}
                  {instructorName && (
                    <tr>
                      <td style={labelCell}>👤 Instructor:</td>
                      <td style={valueCell}>{instructorName}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Section>

            {materialsNeeded.length > 0 && (
              <Section style={materialsBox}>
                <Heading as="h3" style={h3}>
                  Materials to Bring
                </Heading>
                <ul style={materialsList}>
                  {materialsNeeded.map((material, index) => (
                    <li key={index} style={materialsItem}>
                      {material}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {specialInstructions && (
              <Section style={instructionsBox}>
                <Heading as="h3" style={h3}>
                  Special Instructions
                </Heading>
                <Text style={instructionsText}>{specialInstructions}</Text>
              </Section>
            )}

            <Section style={ctaSection}>
              <Button style={button} href={dashboardUrl}>
                View Session Details
              </Button>
            </Section>

            <Text style={importantNote}>
              <strong>Important:</strong> Please arrive 15 minutes early to check in. Late arrivals
              may not be admitted to the session. If you cannot attend, please notify your training
              coordinator as soon as possible.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This is an automated reminder from {unionName} Training System.
              <br />
              Questions? Contact your training coordinator.
            </Text>
            <Text style={footerText}>
              <Link href={dashboardUrl} style={footerLink}>
                Manage Reminders
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  backgroundColor: "#1e40af",
  padding: "32px 48px",
  textAlign: "center" as const,
};

const h1 = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
  padding: "0",
};

const content = {
  padding: "0 48px",
};

const greeting = {
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "16px",
  marginTop: "32px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "16px",
};

const h2 = {
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
  color: "#1e40af",
};

const h3 = {
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 12px 0",
  color: "#0f172a",
};

const alertBox = {
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "24px",
  border: "2px solid",
  textAlign: "center" as const,
};

const alertText = {
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
};

const infoBox = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "24px",
};

const detailsTable = {
  width: "100%",
  marginTop: "16px",
};

const labelCell = {
  fontSize: "14px",
  color: "#64748b",
  paddingBottom: "12px",
  paddingRight: "16px",
  verticalAlign: "top" as const,
  width: "120px",
};

const valueCell = {
  fontSize: "14px",
  color: "#0f172a",
  fontWeight: "500",
  paddingBottom: "12px",
};

const materialsBox = {
  backgroundColor: "#eff6ff",
  border: "1px solid #93c5fd",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const materialsList = {
  margin: "8px 0 0 0",
  paddingLeft: "20px",
};

const materialsItem = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#1e40af",
  marginBottom: "8px",
};

const instructionsBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #fbbf24",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const instructionsText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#78350f",
  margin: "0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#1e40af",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const importantNote = {
  fontSize: "14px",
  lineHeight: "22px",
  backgroundColor: "#fef2f2",
  border: "1px solid #fca5a5",
  borderRadius: "6px",
  padding: "16px",
  marginTop: "24px",
  color: "#991b1b",
};

const footer = {
  borderTop: "1px solid #e2e8f0",
  marginTop: "32px",
  padding: "24px 48px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "18px",
  marginBottom: "8px",
};

const footerLink = {
  color: "#1e40af",
  textDecoration: "underline",
};

