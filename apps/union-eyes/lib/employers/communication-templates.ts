/**
 * Employer Communication Templates
 *
 * Pre-built message templates for common employer communications
 * in the grievance workflow. All templates use {{variable}} placeholders
 * resolved at render time from GrievanceContext.
 *
 * Templates:
 * - grievanceNotification: initial formal notice to employer
 * - documentationRequest: request for employer documents
 * - meetingRequest: schedule a meeting with employer
 * - responseReminder: follow-up for overdue employer response
 * - resolutionProposal: proposed resolution terms
 *
 * @module lib/employers/communication-templates
 */

import type { MessageTemplate, TemplateCategory } from "@/components/employers/employer-message-drafts";

// ─── Template Definitions ─────────────────────────────────────

export const EMPLOYER_TEMPLATES: MessageTemplate[] = [
  {
    id: "tpl_grievance_notification",
    name: "Grievance Notification",
    category: "initial_notification" as TemplateCategory,
    subject: "Formal Grievance Notice — {{grievanceNumber}}",
    body: `Dear {{recipientName}},

This letter serves as formal notification that a grievance ({{grievanceNumber}}) has been filed under the provisions of the collective agreement.

Grievance Title: {{grievanceTitle}}
Grievant: {{grievantName}}
Employer: {{employerName}}
Date Filed: {{date}}

We request a meeting at the earliest mutually convenient time to discuss this matter in accordance with the grievance procedure outlined in our collective agreement.

Please acknowledge receipt of this notice within five (5) business days.

Respectfully,
[Steward Name]
[Union Local]`,
    variables: [
      "grievanceNumber",
      "grievanceTitle",
      "grievantName",
      "employerName",
      "recipientName",
      "date",
    ],
  },
  {
    id: "tpl_documentation_request",
    name: "Documentation Request",
    category: "request_documentation" as TemplateCategory,
    subject: "Request for Documentation — {{grievanceNumber}}",
    body: `Dear {{recipientName}},

In relation to grievance {{grievanceNumber}} ({{grievanceTitle}}), we are requesting the following documentation to support the review process:

1. [Specify document type]
2. [Specify document type]
3. [Specify document type]

Under Article [X] of the collective agreement, the employer is obligated to provide relevant documentation within [Y] business days of this request.

Please forward the requested documents to the undersigned at your earliest convenience.

Thank you for your cooperation.

Respectfully,
[Steward Name]
[Union Local]`,
    variables: [
      "grievanceNumber",
      "grievanceTitle",
      "recipientName",
    ],
  },
  {
    id: "tpl_meeting_request",
    name: "Meeting Request",
    category: "meeting_request" as TemplateCategory,
    subject: "Meeting Request — Grievance {{grievanceNumber}}",
    body: `Dear {{recipientName}},

We are writing to request a meeting regarding grievance {{grievanceNumber}} ({{grievanceTitle}}).

We propose the following options:
- Date/Time Option 1: [Insert date and time]
- Date/Time Option 2: [Insert date and time]
- Date/Time Option 3: [Insert date and time]

Location: [Insert preferred location or virtual meeting link]

Attendees from the union side will include:
- {{grievantName}} (Grievant)
- [Steward Name] (Steward)

Please confirm a suitable date and time within three (3) business days.

Respectfully,
[Steward Name]
[Union Local]`,
    variables: [
      "grievanceNumber",
      "grievanceTitle",
      "grievantName",
      "recipientName",
    ],
  },
  {
    id: "tpl_response_reminder",
    name: "Response Reminder",
    category: "request_response" as TemplateCategory,
    subject: "Follow-Up: Awaiting Response — {{grievanceNumber}}",
    body: `Dear {{recipientName}},

This is a follow-up regarding grievance {{grievanceNumber}} ({{grievanceTitle}}) filed on behalf of {{grievantName}}.

As of {{date}}, we have not received the employer's response within the timeframe prescribed by the collective agreement. We respectfully remind you that a response is required within [X] business days of the filing date.

Failure to respond within the prescribed period may result in escalation to the next step of the grievance procedure.

We look forward to your prompt reply.

Respectfully,
[Steward Name]
[Union Local]`,
    variables: [
      "grievanceNumber",
      "grievanceTitle",
      "grievantName",
      "recipientName",
      "date",
    ],
  },
  {
    id: "tpl_resolution_proposal",
    name: "Resolution Proposal",
    category: "resolution_proposal" as TemplateCategory,
    subject: "Proposed Resolution — {{grievanceNumber}}",
    body: `Dear {{recipientName}},

Following our discussions regarding grievance {{grievanceNumber}} ({{grievanceTitle}}) on behalf of {{grievantName}}, we would like to propose the following resolution:

Proposed Terms:
1. [Insert proposed action / remedy]
2. [Insert timeline for implementation]
3. [Insert any conditions]

This proposal is made without prejudice and in an effort to resolve the matter at the earliest possible stage. If the above terms are acceptable, we request written confirmation within five (5) business days.

Should you wish to discuss alternative terms, we remain open to further dialogue.

Respectfully,
[Steward Name]
[Union Local]`,
    variables: [
      "grievanceNumber",
      "grievanceTitle",
      "grievantName",
      "recipientName",
    ],
  },
];

// ─── Lookup helpers ───────────────────────────────────────────

export function getTemplateById(id: string): MessageTemplate | undefined {
  return EMPLOYER_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: TemplateCategory): MessageTemplate[] {
  return EMPLOYER_TEMPLATES.filter((t) => t.category === category);
}
