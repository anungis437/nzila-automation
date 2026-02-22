// =====================================================================================
// ORGANIZING TOOLS SCHEMA - TypeScript/Drizzle Schema
// =====================================================================================
// Version: 1.0
// Created: December 6, 2025
// Purpose: Complete organizing campaign management with card signing, NLRB/CLRB filings,
//          certification workflow, vote management, field organizer tools, employer tracking
// =====================================================================================

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  date,
  timestamp,
  time,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from '../schema-organizations';
import { profiles } from './profiles-schema';

// =====================================================================================
// TABLE: organizing_campaigns
// =====================================================================================
export const organizingCampaigns = pgTable(
  'organizing_campaigns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

    // Campaign identification
    campaignName: varchar('campaign_name', { length: 255 }).notNull(),
    campaignCode: varchar('campaign_code', { length: 50 }).notNull().unique(),
    targetEmployer: varchar('target_employer', { length: 255 }).notNull(),
    workplaceLocation: text('workplace_location').notNull(),

    // Campaign details
    industry: varchar('industry', { length: 100 }),
    campaignType: varchar('campaign_type', { length: 50 }).notNull().default('voluntary_recognition'),
    status: varchar('status', { length: 50 }).notNull().default('planning'),
    priority: varchar('priority', { length: 20 }).default('medium'),

    // Workplace demographics
    estimatedUnitSize: integer('estimated_unit_size').notNull(),
    targetCardCount: integer('target_card_count'),
    cardsSigned: integer('cards_signed').default(0),
    cardSigningProgress: decimal('card_signing_progress', { precision: 5, scale: 2 }),

    // Key personnel
    leadOrganizerId: text('lead_organizer_id').references(() => profiles.userId),
    organizingTeam: uuid('organizing_team').array(),

    // Campaign timeline
    campaignStartDate: date('campaign_start_date'),
    targetCardDeadline: date('target_card_deadline'),
    filingDate: date('filing_date'),
    electionDate: date('election_date'),
    certificationDate: date('certification_date'),
    campaignEndDate: date('campaign_end_date'),

    // Campaign strategy
    organizingStrategy: text('organizing_strategy'),
    keyIssues: text('key_issues').array(),
    employerVulnerabilities: text('employer_vulnerabilities').array(),
    unionAdvantages: text('union_advantages').array(),

    // Progress metrics
    contactsIdentified: integer('contacts_identified').default(0),
    contactsCommitted: integer('contacts_committed').default(0),
    houseVisitsCompleted: integer('house_visits_completed').default(0),
    workplaceMeetingsHeld: integer('workplace_meetings_held').default(0),

    // Campaign outcomes
    electionEligibleVoters: integer('election_eligible_voters'),
    votesForUnion: integer('votes_for_union'),
    votesAgainstUnion: integer('votes_against_union'),
    challengedBallots: integer('challenged_ballots'),
    electionResult: varchar('election_result', { length: 50 }),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by').references(() => profiles.userId),
    updatedBy: text('updated_by').references(() => profiles.userId),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (table) => ({
    organizationIdx: index('idx_organizing_campaigns_organization').on(table.organizationId),
    statusIdx: index('idx_organizing_campaigns_status').on(table.status),
    leadIdx: index('idx_organizing_campaigns_lead').on(table.leadOrganizerId),
    employerIdx: index('idx_organizing_campaigns_employer').on(table.targetEmployer),
    progressIdx: index('idx_organizing_campaigns_progress').on(table.cardSigningProgress),
  })
);

// =====================================================================================
// TABLE: organizing_contacts
// =====================================================================================
export const organizingContacts = pgTable(
  'organizing_contacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').notNull().references(() => organizingCampaigns.id, { onDelete: 'cascade' }),

    // Contact information
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    preferredContactMethod: varchar('preferred_contact_method', { length: 20 }).default('phone'),

    // Workplace details
    jobTitle: varchar('job_title', { length: 100 }),
    department: varchar('department', { length: 100 }),
    shift: varchar('shift', { length: 50 }),
    hireDate: date('hire_date'),
    seniorityYears: decimal('seniority_years', { precision: 4, scale: 1 }),

    // Workplace mapping
    workLocation: varchar('work_location', { length: 255 }),
    supervisor: varchar('supervisor', { length: 100 }),
    immediateCoworkers: text('immediate_coworkers').array(),
    influenceLevel: varchar('influence_level', { length: 20 }).default('low'),

    // Organizing assessment
    commitmentLevel: varchar('commitment_level', { length: 50 }).notNull().default('unknown'),
    unionSentiment: varchar('union_sentiment', { length: 20 }),
    cardSigned: boolean('card_signed').default(false),
    cardSignedDate: date('card_signed_date'),
    willingToOrganize: boolean('willing_to_organize').default(false),
    issuesConcernedAbout: text('issues_concerned_about').array(),

    // Contact history
    firstContactDate: date('first_contact_date'),
    lastContactDate: date('last_contact_date'),
    totalContacts: integer('total_contacts').default(0),
    houseVisitCompleted: boolean('house_visit_completed').default(false),
    houseVisitDate: date('house_visit_date'),

    // Risk assessment
    likelyToVoteYes: boolean('likely_to_vote_yes'),
    employerLoyalist: boolean('employer_loyalist').default(false),
    potentialRisks: text('potential_risks'),

    // Notes and tags
    notes: text('notes'),
    tags: text('tags').array(),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by').references(() => profiles.userId),
    updatedBy: text('updated_by').references(() => profiles.userId),
  },
  (table) => ({
    organizationIdx: index('idx_organizing_contacts_organization').on(table.organizationId),
    campaignIdx: index('idx_organizing_contacts_campaign').on(table.campaignId),
    commitmentIdx: index('idx_organizing_contacts_commitment').on(table.commitmentLevel),
    cardSignedIdx: index('idx_organizing_contacts_card_signed').on(table.cardSigned),
    nameIdx: index('idx_organizing_contacts_name').on(table.lastName, table.firstName),
    departmentIdx: index('idx_organizing_contacts_department').on(table.campaignId, table.department),
    influenceIdx: index('idx_organizing_contacts_influence').on(table.campaignId, table.influenceLevel),
  })
);

// =====================================================================================
// TABLE: card_signing_events
// =====================================================================================
export const cardSigningEvents = pgTable(
  'card_signing_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').notNull().references(() => organizingCampaigns.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id').notNull().references(() => organizingContacts.id, { onDelete: 'cascade' }),

    // Signing details
    signedDate: date('signed_date').notNull().defaultNow(),
    signedTime: time('signed_time'),
    signingLocation: varchar('signing_location', { length: 255 }),

    // Witness and validation
    witnessedBy: text('witnessed_by').references(() => profiles.userId),
    witnessSignatureData: jsonb('witness_signature_data'),
    cardPhotoUrl: text('card_photo_url'),

    // Card details
    cardType: varchar('card_type', { length: 50 }).default('authorization'),
    cardStatus: varchar('card_status', { length: 50 }).notNull().default('valid'),
    invalidationReason: text('invalidation_reason'),

    // Legal compliance
    voluntarySignature: boolean('voluntary_signature').notNull().default(true),
    signatureObtainedProperly: boolean('signature_obtained_properly').notNull().default(true),
    dateAccurate: boolean('date_accurate').notNull().default(true),
    meetsLegalRequirements: boolean('meets_legal_requirements'),

    // Submission tracking
    submittedToNlrbClrb: boolean('submitted_to_nlrb_clrb').default(false),
    submissionDate: date('submission_date'),
    submissionBatchId: uuid('submission_batch_id'),

    // Notes
    notes: text('notes'),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by').references(() => profiles.userId),
  },
  (table) => ({
    organizationIdx: index('idx_card_signing_organization').on(table.organizationId),
    campaignIdx: index('idx_card_signing_campaign').on(table.campaignId),
    contactIdx: index('idx_card_signing_contact').on(table.contactId),
    dateIdx: index('idx_card_signing_date').on(table.signedDate),
    statusIdx: index('idx_card_signing_status').on(table.cardStatus),
    submittedIdx: index('idx_card_signing_submitted').on(table.submittedToNlrbClrb),
  })
);

// =====================================================================================
// TABLE: nlrb_clrb_filings
// =====================================================================================
export const nlrbClrbFilings = pgTable(
  'nlrb_clrb_filings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').notNull().references(() => organizingCampaigns.id, { onDelete: 'cascade' }),

    // Filing identification
    filingType: varchar('filing_type', { length: 50 }).notNull(),
    filingNumber: varchar('filing_number', { length: 100 }).unique(),
    jurisdiction: varchar('jurisdiction', { length: 50 }).notNull(),

    // Filing details
    filedDate: date('filed_date').notNull(),
    filedBy: varchar('filed_by', { length: 255 }),
    employerNotifiedDate: date('employer_notified_date'),

    // Unit description
    bargainingUnitDescription: text('bargaining_unit_description').notNull(),
    unitSizeClaimed: integer('unit_size_claimed').notNull(),
    unitJobClassifications: text('unit_job_classifications').array(),
    excludedPositions: text('excluded_positions').array(),

    // Supporting evidence
    showingOfInterestPercentage: decimal('showing_of_interest_percentage', { precision: 5, scale: 2 }),
    cardsSubmittedCount: integer('cards_submitted_count'),
    cardSubmissionBatchIds: uuid('card_submission_batch_ids').array(),

    // NLRB/CLRB process stages
    status: varchar('status', { length: 50 }).notNull().default('filed'),
    hearingDate: date('hearing_date'),
    hearingLocation: text('hearing_location'),
    hearingOutcome: varchar('hearing_outcome', { length: 50 }),

    // Election details
    electionScheduledDate: date('election_scheduled_date'),
    electionLocation: text('election_location'),
    electionType: varchar('election_type', { length: 50 }),
    electionConducted: boolean('election_conducted').default(false),

    // Documents
    petitionDocumentUrl: text('petition_document_url'),
    showingOfInterestDocumentUrl: text('showing_of_interest_document_url'),
    hearingTranscriptsUrl: text('hearing_transcripts_url'),
    decisionDocumentUrl: text('decision_document_url'),

    // Employer response
    employerContested: boolean('employer_contested').default(false),
    employerObjections: text('employer_objections').array(),
    employerCounterArguments: text('employer_counter_arguments'),
    employerRepresentation: varchar('employer_representation', { length: 255 }),

    // Decision and outcomes
    decisionDate: date('decision_date'),
    decisionSummary: text('decision_summary'),
    unitApproved: boolean('unit_approved'),
    approvedUnitSize: integer('approved_unit_size'),
    approvedJobClassifications: text('approved_job_classifications').array(),
    appealFiled: boolean('appeal_filed').default(false),
    appealStatus: varchar('appeal_status', { length: 50 }),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by').references(() => profiles.userId),
    updatedBy: text('updated_by').references(() => profiles.userId),
  },
  (table) => ({
    organizationIdx: index('idx_nlrb_clrb_organization').on(table.organizationId),
    campaignIdx: index('idx_nlrb_clrb_campaign').on(table.campaignId),
    statusIdx: index('idx_nlrb_clrb_status').on(table.status),
    filingNumberIdx: index('idx_nlrb_clrb_filing_number').on(table.filingNumber),
    jurisdictionIdx: index('idx_nlrb_clrb_jurisdiction').on(table.jurisdiction),
    electionDateIdx: index('idx_nlrb_clrb_election_date').on(table.electionScheduledDate),
  })
);

// =====================================================================================
// TABLE: union_representation_votes
// =====================================================================================
export const unionRepresentationVotes = pgTable(
  'union_representation_votes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').notNull().references(() => organizingCampaigns.id, { onDelete: 'cascade' }),
    filingId: uuid('filing_id').references(() => nlrbClrbFilings.id),

    // Vote details
    voteDate: date('vote_date').notNull(),
    voteType: varchar('vote_type', { length: 50 }).notNull(),
    votingMethod: varchar('voting_method', { length: 50 }),

    // Eligibility and participation
    eligibleVoters: integer('eligible_voters').notNull(),
    ballotsCast: integer('ballots_cast').notNull(),
    voterTurnoutPercentage: decimal('voter_turnout_percentage', { precision: 5, scale: 2 }),

    // Vote results
    votesForUnion: integer('votes_for_union').notNull().default(0),
    votesAgainstUnion: integer('votes_against_union').notNull().default(0),
    challengedBallots: integer('challenged_ballots').default(0),
    voidBallots: integer('void_ballots').default(0),

    // Vote outcome
    unionVotePercentage: decimal('union_vote_percentage', { precision: 5, scale: 2 }),
    result: varchar('result', { length: 50 }).notNull(),
    certificationIssued: boolean('certification_issued').default(false),
    certificationDate: date('certification_date'),

    // Vote breakdown
    voteBreakdownByDepartment: jsonb('vote_breakdown_by_department'),
    voteBreakdownByShift: jsonb('vote_breakdown_by_shift'),

    // Challenges and objections
    unionFiledObjections: boolean('union_filed_objections').default(false),
    employerFiledObjections: boolean('employer_filed_objections').default(false),
    objectionsSummary: text('objections_summary'),
    objectionsResolved: boolean('objections_resolved'),
    objectionsResolution: text('objections_resolution'),

    // Post-vote actions
    recountRequested: boolean('recount_requested').default(false),
    recountDate: date('recount_date'),
    recountResult: varchar('recount_result', { length: 50 }),

    // Certification details
    certificationNumber: varchar('certification_number', { length: 100 }),
    bargainingUnitCertified: text('bargaining_unit_certified'),
    unionRepresentativeName: varchar('union_representative_name', { length: 255 }),

    // Notes
    notes: text('notes'),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by').references(() => profiles.userId),
  },
  (table) => ({
    organizationIdx: index('idx_union_votes_organization').on(table.organizationId),
    campaignIdx: index('idx_union_votes_campaign').on(table.campaignId),
    filingIdx: index('idx_union_votes_filing').on(table.filingId),
    dateIdx: index('idx_union_votes_date').on(table.voteDate),
    resultIdx: index('idx_union_votes_result').on(table.result),
  })
);

// =====================================================================================
// TABLE: field_organizer_activities
// =====================================================================================
export const fieldOrganizerActivities = pgTable(
  'field_organizer_activities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').notNull().references(() => organizingCampaigns.id, { onDelete: 'cascade' }),
    organizerId: text('organizer_id').notNull().references(() => profiles.userId),
    contactId: uuid('contact_id').references(() => organizingContacts.id),

    // Activity details
    activityDate: date('activity_date').notNull().defaultNow(),
    activityType: varchar('activity_type', { length: 50 }).notNull(),
    activityDurationMinutes: integer('activity_duration_minutes'),

    // Location
    activityLocation: text('activity_location'),
    gpsLatitude: decimal('gps_latitude', { precision: 10, scale: 8 }),
    gpsLongitude: decimal('gps_longitude', { precision: 11, scale: 8 }),
    offlineModeUsed: boolean('offline_mode_used').default(false),

    // Activity outcomes
    contactMade: boolean('contact_made').notNull().default(false),
    commitmentLevelBefore: varchar('commitment_level_before', { length: 50 }),
    commitmentLevelAfter: varchar('commitment_level_after', { length: 50 }),
    cardSigned: boolean('card_signed').default(false),
    followUpNeeded: boolean('follow_up_needed').default(false),
    followUpDate: date('follow_up_date'),

    // Discussion topics
    issuesDiscussed: text('issues_discussed').array(),
    concernsRaised: text('concerns_raised').array(),
    questionsAsked: text('questions_asked').array(),
    materialsDistributed: text('materials_distributed').array(),

    // Activity assessment
    interactionQuality: varchar('interaction_quality', { length: 20 }),
    likelyToVoteYes: boolean('likely_to_vote_yes'),
    willingToHelpOrganize: boolean('willing_to_help_organize').default(false),
    potentialLeader: boolean('potential_leader').default(false),

    // Notes
    detailedNotes: text('detailed_notes'),
    organizerObservations: text('organizer_observations'),
    nextSteps: text('next_steps'),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    syncedAt: timestamp('synced_at', { withTimezone: true }),
    createdBy: text('created_by').references(() => profiles.userId),
  },
  (table) => ({
    organizationIdx: index('idx_field_activities_organization').on(table.organizationId),
    campaignIdx: index('idx_field_activities_campaign').on(table.campaignId),
    organizerIdx: index('idx_field_activities_organizer').on(table.organizerId),
    contactIdx: index('idx_field_activities_contact').on(table.contactId),
    dateIdx: index('idx_field_activities_date').on(table.activityDate),
    typeIdx: index('idx_field_activities_type').on(table.activityType),
  })
);

// =====================================================================================
// TABLE: employer_responses
// =====================================================================================
export const employerResponses = pgTable(
  'employer_responses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').notNull().references(() => organizingCampaigns.id, { onDelete: 'cascade' }),

    // Response details
    responseDate: date('response_date').notNull().defaultNow(),
    responseType: varchar('response_type', { length: 50 }).notNull(),

    // Response description
    responseSummary: text('response_summary').notNull(),
    responseSeverity: varchar('response_severity', { length: 20 }).default('moderate'),

    // Captive audience meetings
    meetingAttendanceMandatory: boolean('meeting_attendance_mandatory'),
    meetingLocation: text('meeting_location'),
    meetingDateTime: timestamp('meeting_date_time'),
    speakers: text('speakers').array(),
    talkingPoints: text('talking_points').array(),

    // Anti-union materials
    materialsDistributed: text('materials_distributed').array(),
    materialUrls: text('material_urls').array(),
    materialContentSummary: text('material_content_summary'),

    // External consultants
    antiUnionConsultantName: varchar('anti_union_consultant_name', { length: 255 }),
    consultantFirm: varchar('consultant_firm', { length: 255 }),
    consultantTactics: text('consultant_tactics').array(),

    // Disciplinary actions
    employeeDisciplined: boolean('employee_disciplined').default(false),
    employeeTerminated: boolean('employee_terminated').default(false),
    affectedContactId: uuid('affected_contact_id').references(() => organizingContacts.id),
    allegedReason: text('alleged_reason'),
    suspectedRetaliation: boolean('suspected_retaliation').default(false),

    // Surveillance and intimidation
    surveillanceReported: boolean('surveillance_reported').default(false),
    surveillanceDescription: text('surveillance_description'),
    intimidationTactics: text('intimidation_tactics').array(),

    // Legal implications
    potentialUlp: boolean('potential_ulp').default(false),
    ulpFiled: boolean('ulp_filed').default(false),
    ulpCaseNumber: varchar('ulp_case_number', { length: 100 }),
    nlrbClrbComplaintFiled: boolean('nlrb_clrb_complaint_filed').default(false),

    // Union response
    unionCounterStrategy: text('union_counter_strategy'),
    unionActionTaken: text('union_action_taken').array(),
    organizersAssignedResponse: uuid('organizers_assigned_response').array(),

    // Impact assessment
    impactOnCampaign: varchar('impact_on_campaign', { length: 20 }),
    contactsInfluenced: integer('contacts_influenced'),
    estimatedSupportLost: decimal('estimated_support_lost', { precision: 5, scale: 2 }),

    // Evidence and documentation
    evidenceDocuments: text('evidence_documents').array(),
    witnessStatements: text('witness_statements').array(),

    // Notes
    notes: text('notes'),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by').references(() => profiles.userId),
    updatedBy: text('updated_by').references(() => profiles.userId),
  },
  (table) => ({
    organizationIdx: index('idx_employer_responses_organization').on(table.organizationId),
    campaignIdx: index('idx_employer_responses_campaign').on(table.campaignId),
    dateIdx: index('idx_employer_responses_date').on(table.responseDate),
    typeIdx: index('idx_employer_responses_type').on(table.responseType),
    severityIdx: index('idx_employer_responses_severity').on(table.responseSeverity),
  })
);

// =====================================================================================
// TABLE: organizing_campaign_milestones
// =====================================================================================
export const organizingCampaignMilestones = pgTable(
  'organizing_campaign_milestones',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').notNull().references(() => organizingCampaigns.id, { onDelete: 'cascade' }),

    // Milestone details
    milestoneName: varchar('milestone_name', { length: 255 }).notNull(),
    milestoneType: varchar('milestone_type', { length: 50 }).notNull(),
    targetDate: date('target_date').notNull(),
    completed: boolean('completed').default(false),
    completedDate: date('completed_date'),

    // Progress tracking
    targetMetric: varchar('target_metric', { length: 50 }),
    targetValue: integer('target_value'),
    currentValue: integer('current_value'),
    progressPercentage: decimal('progress_percentage', { precision: 5, scale: 2 }),

    // Milestone status
    status: varchar('status', { length: 50 }).default('pending'),
    daysUntilDeadline: integer('days_until_deadline'),

    // Notifications
    reminderSent: boolean('reminder_sent').default(false),
    reminderDate: date('reminder_date'),

    // Notes
    notes: text('notes'),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: text('created_by').references(() => profiles.userId),
  },
  (table) => ({
    organizationIdx: index('idx_campaign_milestones_organization').on(table.organizationId),
    campaignIdx: index('idx_campaign_milestones_campaign').on(table.campaignId),
    targetDateIdx: index('idx_campaign_milestones_target_date').on(table.targetDate),
    statusIdx: index('idx_campaign_milestones_status').on(table.status),
  })
);

// =====================================================================================
// RELATIONS
// =====================================================================================

export const organizingCampaignsRelations = relations(organizingCampaigns, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [organizingCampaigns.organizationId],
    references: [organizations.id],
  }),
  leadOrganizer: one(profiles, {
    fields: [organizingCampaigns.leadOrganizerId],
    references: [profiles.userId],
  }),
  contacts: many(organizingContacts),
  cardSigningEvents: many(cardSigningEvents),
  filings: many(nlrbClrbFilings),
  votes: many(unionRepresentationVotes),
  activities: many(fieldOrganizerActivities),
  employerResponses: many(employerResponses),
  milestones: many(organizingCampaignMilestones),
}));

export const organizingContactsRelations = relations(organizingContacts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [organizingContacts.organizationId],
    references: [organizations.id],
  }),
  campaign: one(organizingCampaigns, {
    fields: [organizingContacts.campaignId],
    references: [organizingCampaigns.id],
  }),
  cardSigningEvents: many(cardSigningEvents),
  activities: many(fieldOrganizerActivities),
}));

export const cardSigningEventsRelations = relations(cardSigningEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [cardSigningEvents.organizationId],
    references: [organizations.id],
  }),
  campaign: one(organizingCampaigns, {
    fields: [cardSigningEvents.campaignId],
    references: [organizingCampaigns.id],
  }),
  contact: one(organizingContacts, {
    fields: [cardSigningEvents.contactId],
    references: [organizingContacts.id],
  }),
  witnessedByProfile: one(profiles, {
    fields: [cardSigningEvents.witnessedBy],
    references: [profiles.userId],
  }),
}));

export const nlrbClrbFilingsRelations = relations(nlrbClrbFilings, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [nlrbClrbFilings.organizationId],
    references: [organizations.id],
  }),
  campaign: one(organizingCampaigns, {
    fields: [nlrbClrbFilings.campaignId],
    references: [organizingCampaigns.id],
  }),
  votes: many(unionRepresentationVotes),
}));

export const unionRepresentationVotesRelations = relations(unionRepresentationVotes, ({ one }) => ({
  organization: one(organizations, {
    fields: [unionRepresentationVotes.organizationId],
    references: [organizations.id],
  }),
  campaign: one(organizingCampaigns, {
    fields: [unionRepresentationVotes.campaignId],
    references: [organizingCampaigns.id],
  }),
  filing: one(nlrbClrbFilings, {
    fields: [unionRepresentationVotes.filingId],
    references: [nlrbClrbFilings.id],
  }),
}));

export const fieldOrganizerActivitiesRelations = relations(fieldOrganizerActivities, ({ one }) => ({
  organization: one(organizations, {
    fields: [fieldOrganizerActivities.organizationId],
    references: [organizations.id],
  }),
  campaign: one(organizingCampaigns, {
    fields: [fieldOrganizerActivities.campaignId],
    references: [organizingCampaigns.id],
  }),
  organizer: one(profiles, {
    fields: [fieldOrganizerActivities.organizerId],
    references: [profiles.userId],
  }),
  contact: one(organizingContacts, {
    fields: [fieldOrganizerActivities.contactId],
    references: [organizingContacts.id],
  }),
}));

export const employerResponsesRelations = relations(employerResponses, ({ one }) => ({
  organization: one(organizations, {
    fields: [employerResponses.organizationId],
    references: [organizations.id],
  }),
  campaign: one(organizingCampaigns, {
    fields: [employerResponses.campaignId],
    references: [organizingCampaigns.id],
  }),
  affectedContact: one(organizingContacts, {
    fields: [employerResponses.affectedContactId],
    references: [organizingContacts.id],
  }),
}));

export const organizingCampaignMilestonesRelations = relations(organizingCampaignMilestones, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizingCampaignMilestones.organizationId],
    references: [organizations.id],
  }),
  campaign: one(organizingCampaigns, {
    fields: [organizingCampaignMilestones.campaignId],
    references: [organizingCampaigns.id],
  }),
}));

// =====================================================================================
// TYPE EXPORTS
// =====================================================================================

export type OrganizingCampaign = typeof organizingCampaigns.$inferSelect;
export type NewOrganizingCampaign = typeof organizingCampaigns.$inferInsert;

export type OrganizingContact = typeof organizingContacts.$inferSelect;
export type NewOrganizingContact = typeof organizingContacts.$inferInsert;

export type CardSigningEvent = typeof cardSigningEvents.$inferSelect;
export type NewCardSigningEvent = typeof cardSigningEvents.$inferInsert;

export type NlrbClrbFiling = typeof nlrbClrbFilings.$inferSelect;
export type NewNlrbClrbFiling = typeof nlrbClrbFilings.$inferInsert;

export type UnionRepresentationVote = typeof unionRepresentationVotes.$inferSelect;
export type NewUnionRepresentationVote = typeof unionRepresentationVotes.$inferInsert;

export type FieldOrganizerActivity = typeof fieldOrganizerActivities.$inferSelect;
export type NewFieldOrganizerActivity = typeof fieldOrganizerActivities.$inferInsert;

export type EmployerResponse = typeof employerResponses.$inferSelect;
export type NewEmployerResponse = typeof employerResponses.$inferInsert;

export type OrganizingCampaignMilestone = typeof organizingCampaignMilestones.$inferSelect;
export type NewOrganizingCampaignMilestone = typeof organizingCampaignMilestones.$inferInsert;

