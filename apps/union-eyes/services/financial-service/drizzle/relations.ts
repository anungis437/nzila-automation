import { relations } from "drizzle-orm/relations";
import { votingSessions, voterEligibility, votingOptions, votingNotifications, collectiveAgreements, cbaClauses, cbaVersionHistory, benefitComparisons, organizations, insightRecommendations, digitalSignatures, signatureWorkflows, wageProgressions, bargainingNotes, cbaFootnotes, arbitrationDecisions, cbaContacts, aiDocuments, aiChunks, aiQueries, aiFeedback, tenantsInTenantManagement, organizationMembers, claims, claimUpdates, usersInUserManagement, duesRules, memberDuesAssignments, employerRemittances, strikeFunds, fundEligibility, picketAttendance, stipendDisbursements, publicDonations, hardshipApplications, arrearsCases, clauseComparisonsHistory, sharedClauseLibrary, arbitrationPrecedents, precedentTags, precedentCitations, organizationRelationships, clauseLibraryTags, votes, comparativeAnalyses, perCapitaRemittances, transactionClcMappings, votingAuditors, votingSessionAuditors, blockchainAuditAnchors, voteMerkleTree, votingSessionKeys, messageThreads, messages, organizationHierarchyAudit, votingKeyAccessLog, messageReadReceipts, messageParticipants, jurisdictionRules, complianceValidations, messageNotifications, members, calendars, calendarEvents, eventAttendees, roomBookings, meetingRooms, calendarSharing, eventReminders, memberPoliticalParticipation, electedOfficials, politicalCampaigns, legislationTracking, politicalActivities, trainingCourses, courseSessions, courseRegistrations, pensionPlans, pensionHoursBanks, pensionContributions, pensionTrusteeBoards, pensionTrustees, analyticsMetrics, pensionTrusteeMeetings, pensionBenefitClaims, pensionActuarialValuations, hwBenefitPlans, hwBenefitEnrollments, hwBenefitClaims, trustComplianceReports, taxYearConfigurations, trendAnalyses, taxSlips, craXmlBatches, copeContributions, memberDemographics, payEquityComplaints, equitySnapshots, statcanSubmissions, organizingCampaigns, organizingContacts, organizingActivities, certificationApplications, organizingVolunteers, memberCertifications, trainingPrograms, duesTransactions, programEnrollments, kpiConfigurations } from "./schema";

export const voterEligibilityRelations = relations(voterEligibility, ({one}) => ({
	votingSession: one(votingSessions, {
		fields: [voterEligibility.sessionId],
		references: [votingSessions.id]
	}),
}));

export const votingSessionsRelations = relations(votingSessions, ({many}) => ({
	voterEligibilities: many(voterEligibility),
	votingOptions: many(votingOptions),
	votingNotifications: many(votingNotifications),
	votes: many(votes),
	votingSessionAuditors: many(votingSessionAuditors),
	blockchainAuditAnchors: many(blockchainAuditAnchors),
	voteMerkleTrees: many(voteMerkleTree),
	votingSessionKeys: many(votingSessionKeys),
}));

export const votingOptionsRelations = relations(votingOptions, ({one, many}) => ({
	votingSession: one(votingSessions, {
		fields: [votingOptions.sessionId],
		references: [votingSessions.id]
	}),
	votes: many(votes),
}));

export const votingNotificationsRelations = relations(votingNotifications, ({one}) => ({
	votingSession: one(votingSessions, {
		fields: [votingNotifications.sessionId],
		references: [votingSessions.id]
	}),
}));

export const cbaClausesRelations = relations(cbaClauses, ({one, many}) => ({
	collectiveAgreement: one(collectiveAgreements, {
		fields: [cbaClauses.cbaId],
		references: [collectiveAgreements.id]
	}),
	benefitComparisons: many(benefitComparisons),
	wageProgressions: many(wageProgressions),
	cbaFootnotes_sourceClauseId: many(cbaFootnotes, {
		relationName: "cbaFootnotes_sourceClauseId_cbaClauses_id"
	}),
	cbaFootnotes_targetClauseId: many(cbaFootnotes, {
		relationName: "cbaFootnotes_targetClauseId_cbaClauses_id"
	}),
}));

export const collectiveAgreementsRelations = relations(collectiveAgreements, ({many}) => ({
	cbaClauses: many(cbaClauses),
	cbaVersionHistories: many(cbaVersionHistory),
	benefitComparisons: many(benefitComparisons),
	wageProgressions: many(wageProgressions),
	bargainingNotes: many(bargainingNotes),
	cbaContacts: many(cbaContacts),
}));

export const cbaVersionHistoryRelations = relations(cbaVersionHistory, ({one}) => ({
	collectiveAgreement: one(collectiveAgreements, {
		fields: [cbaVersionHistory.cbaId],
		references: [collectiveAgreements.id]
	}),
}));

export const benefitComparisonsRelations = relations(benefitComparisons, ({one}) => ({
	collectiveAgreement: one(collectiveAgreements, {
		fields: [benefitComparisons.cbaId],
		references: [collectiveAgreements.id]
	}),
	cbaClause: one(cbaClauses, {
		fields: [benefitComparisons.clauseId],
		references: [cbaClauses.id]
	}),
}));

export const insightRecommendationsRelations = relations(insightRecommendations, ({one}) => ({
	organization: one(organizations, {
		fields: [insightRecommendations.organizationId],
		references: [organizations.id]
	}),
}));

export const organizationsRelations = relations(organizations, ({one, many}) => ({
	insightRecommendations: many(insightRecommendations),
	digitalSignatures: many(digitalSignatures),
	signatureWorkflows: many(signatureWorkflows),
	strikeFunds: many(strikeFunds),
	clauseComparisonsHistories: many(clauseComparisonsHistory),
	organizationRelationships_childOrgId: many(organizationRelationships, {
		relationName: "organizationRelationships_childOrgId_organizations_id"
	}),
	organizationRelationships_parentOrgId: many(organizationRelationships, {
		relationName: "organizationRelationships_parentOrgId_organizations_id"
	}),
	claims: many(claims),
	organization: one(organizations, {
		fields: [organizations.parentId],
		references: [organizations.id],
		relationName: "organizations_parentId_organizations_id"
	}),
	organizations: many(organizations, {
		relationName: "organizations_parentId_organizations_id"
	}),
	comparativeAnalyses: many(comparativeAnalyses),
	perCapitaRemittances_fromOrganizationId: many(perCapitaRemittances, {
		relationName: "perCapitaRemittances_fromOrganizationId_organizations_id"
	}),
	perCapitaRemittances_toOrganizationId: many(perCapitaRemittances, {
		relationName: "perCapitaRemittances_toOrganizationId_organizations_id"
	}),
	transactionClcMappings: many(transactionClcMappings),
	organizationHierarchyAudits: many(organizationHierarchyAudit),
	members: many(members),
	memberPoliticalParticipations: many(memberPoliticalParticipation),
	electedOfficials: many(electedOfficials),
	legislationTrackings: many(legislationTracking),
	politicalActivities: many(politicalActivities),
	trainingCourses: many(trainingCourses),
	courseSessions: many(courseSessions),
	courseRegistrations: many(courseRegistrations),
	pensionPlans: many(pensionPlans),
	analyticsMetrics: many(analyticsMetrics),
	hwBenefitPlans: many(hwBenefitPlans),
	trustComplianceReports: many(trustComplianceReports),
	taxYearConfigurations: many(taxYearConfigurations),
	trendAnalyses: many(trendAnalyses),
	taxSlips: many(taxSlips),
	craXmlBatches: many(craXmlBatches),
	copeContributions: many(copeContributions),
	memberDemographics: many(memberDemographics),
	payEquityComplaints: many(payEquityComplaints),
	equitySnapshots: many(equitySnapshots),
	statcanSubmissions: many(statcanSubmissions),
	organizingCampaigns: many(organizingCampaigns),
	organizingContacts: many(organizingContacts),
	organizingActivities: many(organizingActivities),
	certificationApplications: many(certificationApplications),
	organizingVolunteers: many(organizingVolunteers),
	politicalCampaigns: many(politicalCampaigns),
	memberCertifications: many(memberCertifications),
	trainingPrograms: many(trainingPrograms),
	programEnrollments: many(programEnrollments),
	kpiConfigurations: many(kpiConfigurations),
}));

export const digitalSignaturesRelations = relations(digitalSignatures, ({one}) => ({
	organization: one(organizations, {
		fields: [digitalSignatures.organizationId],
		references: [organizations.id]
	}),
}));

export const signatureWorkflowsRelations = relations(signatureWorkflows, ({one}) => ({
	organization: one(organizations, {
		fields: [signatureWorkflows.organizationId],
		references: [organizations.id]
	}),
}));

export const wageProgressionsRelations = relations(wageProgressions, ({one}) => ({
	collectiveAgreement: one(collectiveAgreements, {
		fields: [wageProgressions.cbaId],
		references: [collectiveAgreements.id]
	}),
	cbaClause: one(cbaClauses, {
		fields: [wageProgressions.clauseId],
		references: [cbaClauses.id]
	}),
}));

export const bargainingNotesRelations = relations(bargainingNotes, ({one}) => ({
	collectiveAgreement: one(collectiveAgreements, {
		fields: [bargainingNotes.cbaId],
		references: [collectiveAgreements.id]
	}),
}));

export const cbaFootnotesRelations = relations(cbaFootnotes, ({one}) => ({
	cbaClause_sourceClauseId: one(cbaClauses, {
		fields: [cbaFootnotes.sourceClauseId],
		references: [cbaClauses.id],
		relationName: "cbaFootnotes_sourceClauseId_cbaClauses_id"
	}),
	cbaClause_targetClauseId: one(cbaClauses, {
		fields: [cbaFootnotes.targetClauseId],
		references: [cbaClauses.id],
		relationName: "cbaFootnotes_targetClauseId_cbaClauses_id"
	}),
	arbitrationDecision: one(arbitrationDecisions, {
		fields: [cbaFootnotes.targetDecisionId],
		references: [arbitrationDecisions.id]
	}),
}));

export const arbitrationDecisionsRelations = relations(arbitrationDecisions, ({many}) => ({
	cbaFootnotes: many(cbaFootnotes),
}));

export const cbaContactsRelations = relations(cbaContacts, ({one}) => ({
	collectiveAgreement: one(collectiveAgreements, {
		fields: [cbaContacts.cbaId],
		references: [collectiveAgreements.id]
	}),
}));

export const aiChunksRelations = relations(aiChunks, ({one}) => ({
	aiDocument: one(aiDocuments, {
		fields: [aiChunks.documentId],
		references: [aiDocuments.id]
	}),
}));

export const aiDocumentsRelations = relations(aiDocuments, ({many}) => ({
	aiChunks: many(aiChunks),
}));

export const aiFeedbackRelations = relations(aiFeedback, ({one}) => ({
	aiQuery: one(aiQueries, {
		fields: [aiFeedback.queryId],
		references: [aiQueries.id]
	}),
}));

export const aiQueriesRelations = relations(aiQueries, ({many}) => ({
	aiFeedbacks: many(aiFeedback),
}));

export const organizationMembersRelations = relations(organizationMembers, ({one}) => ({
	tenantsInTenantManagement: one(tenantsInTenantManagement, {
		fields: [organizationMembers.tenantId],
		references: [tenantsInTenantManagement.tenantId]
	}),
}));

export const tenantsInTenantManagementRelations = relations(tenantsInTenantManagement, ({many}) => ({
	organizationMembers: many(organizationMembers),
	memberDuesAssignments: many(memberDuesAssignments),
	employerRemittances: many(employerRemittances),
	duesRules: many(duesRules),
	strikeFunds: many(strikeFunds),
	fundEligibilities: many(fundEligibility),
	picketAttendances: many(picketAttendance),
	stipendDisbursements: many(stipendDisbursements),
	publicDonations: many(publicDonations),
	hardshipApplications: many(hardshipApplications),
	arrearsCases: many(arrearsCases),
	duesTransactions: many(duesTransactions),
}));

export const claimUpdatesRelations = relations(claimUpdates, ({one}) => ({
	claim: one(claims, {
		fields: [claimUpdates.claimId],
		references: [claims.claimId]
	}),
	usersInUserManagement: one(usersInUserManagement, {
		fields: [claimUpdates.createdBy],
		references: [usersInUserManagement.userId]
	}),
}));

export const claimsRelations = relations(claims, ({one, many}) => ({
	claimUpdates: many(claimUpdates),
	organization: one(organizations, {
		fields: [claims.organizationId],
		references: [organizations.id]
	}),
	usersInUserManagement_assignedTo: one(usersInUserManagement, {
		fields: [claims.assignedTo],
		references: [usersInUserManagement.userId],
		relationName: "claims_assignedTo_usersInUserManagement_userId"
	}),
	usersInUserManagement_memberId: one(usersInUserManagement, {
		fields: [claims.memberId],
		references: [usersInUserManagement.userId],
		relationName: "claims_memberId_usersInUserManagement_userId"
	}),
}));

export const usersInUserManagementRelations = relations(usersInUserManagement, ({many}) => ({
	claimUpdates: many(claimUpdates),
	claims_assignedTo: many(claims, {
		relationName: "claims_assignedTo_usersInUserManagement_userId"
	}),
	claims_memberId: many(claims, {
		relationName: "claims_memberId_usersInUserManagement_userId"
	}),
}));

export const memberDuesAssignmentsRelations = relations(memberDuesAssignments, ({one, many}) => ({
	duesRule: one(duesRules, {
		fields: [memberDuesAssignments.ruleId],
		references: [duesRules.id]
	}),
	tenantsInTenantManagement: one(tenantsInTenantManagement, {
		fields: [memberDuesAssignments.tenantId],
		references: [tenantsInTenantManagement.tenantId]
	}),
	duesTransactions: many(duesTransactions),
}));

export const duesRulesRelations = relations(duesRules, ({one, many}) => ({
	memberDuesAssignments: many(memberDuesAssignments),
	tenantsInTenantManagement: one(tenantsInTenantManagement, {
		fields: [duesRules.tenantId],
		references: [tenantsInTenantManagement.tenantId]
	}),
	duesTransactions: many(duesTransactions),
}));

export const employerRemittancesRelations = relations(employerRemittances, ({one}) => ({
	tenantsInTenantManagement: one(tenantsInTenantManagement, {
		fields: [employerRemittances.tenantId],
		references: [tenantsInTenantManagement.tenantId]
	}),
}));

export const strikeFundsRelations = relations(strikeFunds, ({one, many}) => ({
	organization: one(organizations, {
		fields: [strikeFunds.organizationId],
		references: [organizations.id]
	}),
	tenantsInTenantManagement: one(tenantsInTenantManagement, {
		fields: [strikeFunds.tenantId],
		references: [tenantsInTenantManagement.tenantId]
	}),
	fundEligibilities: many(fundEligibility),
	picketAttendances: many(picketAttendance),
	stipendDisbursements: many(stipendDisbursements),
	publicDonations: many(publicDonations),
	hardshipApplications: many(hardshipApplications),
}));

export const fundEligibilityRelations = relations(fundEligibility, ({one}) => ({
	strikeFund: one(strikeFunds, {
		fields: [fundEligibility.strikeFundId],
		references: [strikeFunds.id]
	}),
	tenantsInTenantManagement: one(tenantsInTenantManagement, {
		fields: [fundEligibility.tenantId],
		references: [tenantsInTenantManagement.tenantId]
	}),
}));

export const picketAttendanceRelations = relations(picketAttendance, ({one}) => ({
	strikeFund: one(strikeFunds, {
		fields: [picketAttendance.strikeFundId],
		references: [strikeFunds.id]
	}),
	tenantsInTenantManagement: one(tenantsInTenantManagement, {
		fields: [picketAttendance.tenantId],
		references: [tenantsInTenantManagement.tenantId]
	}),
}));

export const stipendDisbursementsRelations = relations(stipendDisbursements, ({one}) => ({
	strikeFund: one(strikeFunds, {
		fields: [stipendDisbursements.strikeFundId],
		references: [strikeFunds.id]
	}),
	tenantsInTenantManagement: one(tenantsInTenantManagement, {
		fields: [stipendDisbursements.tenantId],
		references: [tenantsInTenantManagement.tenantId]
	}),
}));

export const publicDonationsRelations = relations(publicDonations, ({one}) => ({
	strikeFund: one(strikeFunds, {
		fields: [publicDonations.strikeFundId],
		references: [strikeFunds.id]
	}),
	tenantsInTenantManagement: one(tenantsInTenantManagement, {
		fields: [publicDonations.tenantId],
		references: [tenantsInTenantManagement.tenantId]
	}),
}));

export const hardshipApplicationsRelations = relations(hardshipApplications, ({one}) => ({
	strikeFund: one(strikeFunds, {
		fields: [hardshipApplications.strikeFundId],
		references: [strikeFunds.id]
	}),
	tenantsInTenantManagement: one(tenantsInTenantManagement, {
		fields: [hardshipApplications.tenantId],
		references: [tenantsInTenantManagement.tenantId]
	}),
}));

export const arrearsCasesRelations = relations(arrearsCases, ({one}) => ({
	organization: one(organizations, {
		fields: [arrearsCases.organizationId],
		references: [organizations.id]
	}),
}));

export const clauseComparisonsHistoryRelations = relations(clauseComparisonsHistory, ({one}) => ({
	organization: one(organizations, {
		fields: [clauseComparisonsHistory.organizationId],
		references: [organizations.id]
	}),
}));

export const sharedClauseLibraryRelations = relations(sharedClauseLibrary, ({one, many}) => ({
	sharedClauseLibrary: one(sharedClauseLibrary, {
		fields: [sharedClauseLibrary.previousVersionId],
		references: [sharedClauseLibrary.id],
		relationName: "sharedClauseLibrary_previousVersionId_sharedClauseLibrary_id"
	}),
	sharedClauseLibraries: many(sharedClauseLibrary, {
		relationName: "sharedClauseLibrary_previousVersionId_sharedClauseLibrary_id"
	}),
	clauseLibraryTags: many(clauseLibraryTags),
}));

export const precedentTagsRelations = relations(precedentTags, ({one}) => ({
	arbitrationPrecedent: one(arbitrationPrecedents, {
		fields: [precedentTags.precedentId],
		references: [arbitrationPrecedents.id]
	}),
}));

export const arbitrationPrecedentsRelations = relations(arbitrationPrecedents, ({many}) => ({
	precedentTags: many(precedentTags),
	precedentCitations_citedByPrecedentId: many(precedentCitations, {
		relationName: "precedentCitations_citedByPrecedentId_arbitrationPrecedents_id"
	}),
	precedentCitations_precedentId: many(precedentCitations, {
		relationName: "precedentCitations_precedentId_arbitrationPrecedents_id"
	}),
}));

export const precedentCitationsRelations = relations(precedentCitations, ({one}) => ({
	arbitrationPrecedent_citedByPrecedentId: one(arbitrationPrecedents, {
		fields: [precedentCitations.citedByPrecedentId],
		references: [arbitrationPrecedents.id],
		relationName: "precedentCitations_citedByPrecedentId_arbitrationPrecedents_id"
	}),
	arbitrationPrecedent_precedentId: one(arbitrationPrecedents, {
		fields: [precedentCitations.precedentId],
		references: [arbitrationPrecedents.id],
		relationName: "precedentCitations_precedentId_arbitrationPrecedents_id"
	}),
}));

export const organizationRelationshipsRelations = relations(organizationRelationships, ({one}) => ({
	organization_childOrgId: one(organizations, {
		fields: [organizationRelationships.childOrgId],
		references: [organizations.id],
		relationName: "organizationRelationships_childOrgId_organizations_id"
	}),
	organization_parentOrgId: one(organizations, {
		fields: [organizationRelationships.parentOrgId],
		references: [organizations.id],
		relationName: "organizationRelationships_parentOrgId_organizations_id"
	}),
}));

export const clauseLibraryTagsRelations = relations(clauseLibraryTags, ({one}) => ({
	sharedClauseLibrary: one(sharedClauseLibrary, {
		fields: [clauseLibraryTags.clauseId],
		references: [sharedClauseLibrary.id]
	}),
}));

export const votesRelations = relations(votes, ({one, many}) => ({
	votingOption: one(votingOptions, {
		fields: [votes.optionId],
		references: [votingOptions.id]
	}),
	votingSession: one(votingSessions, {
		fields: [votes.sessionId],
		references: [votingSessions.id]
	}),
	voteMerkleTrees: many(voteMerkleTree),
}));

export const comparativeAnalysesRelations = relations(comparativeAnalyses, ({one}) => ({
	organization: one(organizations, {
		fields: [comparativeAnalyses.organizationId],
		references: [organizations.id]
	}),
}));

export const perCapitaRemittancesRelations = relations(perCapitaRemittances, ({one}) => ({
	organization_fromOrganizationId: one(organizations, {
		fields: [perCapitaRemittances.fromOrganizationId],
		references: [organizations.id],
		relationName: "perCapitaRemittances_fromOrganizationId_organizations_id"
	}),
	organization_toOrganizationId: one(organizations, {
		fields: [perCapitaRemittances.toOrganizationId],
		references: [organizations.id],
		relationName: "perCapitaRemittances_toOrganizationId_organizations_id"
	}),
}));

export const transactionClcMappingsRelations = relations(transactionClcMappings, ({one}) => ({
	organization: one(organizations, {
		fields: [transactionClcMappings.organizationId],
		references: [organizations.id]
	}),
}));

export const votingSessionAuditorsRelations = relations(votingSessionAuditors, ({one}) => ({
	votingAuditor: one(votingAuditors, {
		fields: [votingSessionAuditors.auditorId],
		references: [votingAuditors.id]
	}),
	votingSession: one(votingSessions, {
		fields: [votingSessionAuditors.votingSessionId],
		references: [votingSessions.id]
	}),
}));

export const votingAuditorsRelations = relations(votingAuditors, ({many}) => ({
	votingSessionAuditors: many(votingSessionAuditors),
}));

export const blockchainAuditAnchorsRelations = relations(blockchainAuditAnchors, ({one}) => ({
	votingSession: one(votingSessions, {
		fields: [blockchainAuditAnchors.votingSessionId],
		references: [votingSessions.id]
	}),
}));

export const voteMerkleTreeRelations = relations(voteMerkleTree, ({one, many}) => ({
	voteMerkleTree_leftChildId: one(voteMerkleTree, {
		fields: [voteMerkleTree.leftChildId],
		references: [voteMerkleTree.id],
		relationName: "voteMerkleTree_leftChildId_voteMerkleTree_id"
	}),
	voteMerkleTrees_leftChildId: many(voteMerkleTree, {
		relationName: "voteMerkleTree_leftChildId_voteMerkleTree_id"
	}),
	voteMerkleTree_parentNodeId: one(voteMerkleTree, {
		fields: [voteMerkleTree.parentNodeId],
		references: [voteMerkleTree.id],
		relationName: "voteMerkleTree_parentNodeId_voteMerkleTree_id"
	}),
	voteMerkleTrees_parentNodeId: many(voteMerkleTree, {
		relationName: "voteMerkleTree_parentNodeId_voteMerkleTree_id"
	}),
	voteMerkleTree_rightChildId: one(voteMerkleTree, {
		fields: [voteMerkleTree.rightChildId],
		references: [voteMerkleTree.id],
		relationName: "voteMerkleTree_rightChildId_voteMerkleTree_id"
	}),
	voteMerkleTrees_rightChildId: many(voteMerkleTree, {
		relationName: "voteMerkleTree_rightChildId_voteMerkleTree_id"
	}),
	vote: one(votes, {
		fields: [voteMerkleTree.voteId],
		references: [votes.id]
	}),
	votingSession: one(votingSessions, {
		fields: [voteMerkleTree.votingSessionId],
		references: [votingSessions.id]
	}),
}));

export const votingSessionKeysRelations = relations(votingSessionKeys, ({one, many}) => ({
	votingSession: one(votingSessions, {
		fields: [votingSessionKeys.votingSessionId],
		references: [votingSessions.id]
	}),
	votingKeyAccessLogs: many(votingKeyAccessLog),
}));

export const messagesRelations = relations(messages, ({one, many}) => ({
	messageThread: one(messageThreads, {
		fields: [messages.threadId],
		references: [messageThreads.id]
	}),
	messageReadReceipts: many(messageReadReceipts),
	messageNotifications: many(messageNotifications),
}));

export const messageThreadsRelations = relations(messageThreads, ({many}) => ({
	messages: many(messages),
	messageParticipants: many(messageParticipants),
	messageNotifications: many(messageNotifications),
}));

export const organizationHierarchyAuditRelations = relations(organizationHierarchyAudit, ({one}) => ({
	organization: one(organizations, {
		fields: [organizationHierarchyAudit.organizationId],
		references: [organizations.id]
	}),
}));

export const votingKeyAccessLogRelations = relations(votingKeyAccessLog, ({one}) => ({
	votingSessionKey: one(votingSessionKeys, {
		fields: [votingKeyAccessLog.sessionKeyId],
		references: [votingSessionKeys.id]
	}),
}));

export const messageReadReceiptsRelations = relations(messageReadReceipts, ({one}) => ({
	message: one(messages, {
		fields: [messageReadReceipts.messageId],
		references: [messages.id]
	}),
}));

export const messageParticipantsRelations = relations(messageParticipants, ({one}) => ({
	messageThread: one(messageThreads, {
		fields: [messageParticipants.threadId],
		references: [messageThreads.id]
	}),
}));

export const complianceValidationsRelations = relations(complianceValidations, ({one}) => ({
	jurisdictionRule_ruleId: one(jurisdictionRules, {
		fields: [complianceValidations.ruleId],
		references: [jurisdictionRules.id],
		relationName: "complianceValidations_ruleId_jurisdictionRules_id"
	}),
	jurisdictionRule_ruleId: one(jurisdictionRules, {
		fields: [complianceValidations.ruleId],
		references: [jurisdictionRules.id],
		relationName: "complianceValidations_ruleId_jurisdictionRules_id"
	}),
}));

export const jurisdictionRulesRelations = relations(jurisdictionRules, ({many}) => ({
	complianceValidations_ruleId: many(complianceValidations, {
		relationName: "complianceValidations_ruleId_jurisdictionRules_id"
	}),
	complianceValidations_ruleId: many(complianceValidations, {
		relationName: "complianceValidations_ruleId_jurisdictionRules_id"
	}),
}));

export const messageNotificationsRelations = relations(messageNotifications, ({one}) => ({
	message: one(messages, {
		fields: [messageNotifications.messageId],
		references: [messages.id]
	}),
	messageThread: one(messageThreads, {
		fields: [messageNotifications.threadId],
		references: [messageThreads.id]
	}),
}));

export const membersRelations = relations(members, ({one, many}) => ({
	organization: one(organizations, {
		fields: [members.organizationId],
		references: [organizations.id]
	}),
	memberPoliticalParticipations: many(memberPoliticalParticipation),
	courseRegistrations: many(courseRegistrations),
	pensionHoursBanks: many(pensionHoursBanks),
	pensionBenefitClaims: many(pensionBenefitClaims),
	hwBenefitEnrollments: many(hwBenefitEnrollments),
	hwBenefitClaims: many(hwBenefitClaims),
	taxSlips: many(taxSlips),
	copeContributions: many(copeContributions),
	memberDemographics: many(memberDemographics),
	payEquityComplaints: many(payEquityComplaints),
	organizingContacts: many(organizingContacts),
	organizingVolunteers: many(organizingVolunteers),
	memberCertifications: many(memberCertifications),
	programEnrollments: many(programEnrollments),
}));

export const calendarEventsRelations = relations(calendarEvents, ({one, many}) => ({
	calendar: one(calendars, {
		fields: [calendarEvents.calendarId],
		references: [calendars.id]
	}),
	eventAttendees: many(eventAttendees),
	roomBookings: many(roomBookings),
	eventReminders: many(eventReminders),
}));

export const calendarsRelations = relations(calendars, ({many}) => ({
	calendarEvents: many(calendarEvents),
	calendarSharings: many(calendarSharing),
}));

export const eventAttendeesRelations = relations(eventAttendees, ({one}) => ({
	calendarEvent: one(calendarEvents, {
		fields: [eventAttendees.eventId],
		references: [calendarEvents.id]
	}),
}));

export const roomBookingsRelations = relations(roomBookings, ({one}) => ({
	calendarEvent: one(calendarEvents, {
		fields: [roomBookings.eventId],
		references: [calendarEvents.id]
	}),
	meetingRoom: one(meetingRooms, {
		fields: [roomBookings.roomId],
		references: [meetingRooms.id]
	}),
}));

export const meetingRoomsRelations = relations(meetingRooms, ({many}) => ({
	roomBookings: many(roomBookings),
}));

export const calendarSharingRelations = relations(calendarSharing, ({one}) => ({
	calendar: one(calendars, {
		fields: [calendarSharing.calendarId],
		references: [calendars.id]
	}),
}));

export const eventRemindersRelations = relations(eventReminders, ({one}) => ({
	calendarEvent: one(calendarEvents, {
		fields: [eventReminders.eventId],
		references: [calendarEvents.id]
	}),
}));

export const memberPoliticalParticipationRelations = relations(memberPoliticalParticipation, ({one}) => ({
	member: one(members, {
		fields: [memberPoliticalParticipation.memberId],
		references: [members.id]
	}),
	organization: one(organizations, {
		fields: [memberPoliticalParticipation.organizationId],
		references: [organizations.id]
	}),
}));

export const electedOfficialsRelations = relations(electedOfficials, ({one, many}) => ({
	organization: one(organizations, {
		fields: [electedOfficials.organizationId],
		references: [organizations.id]
	}),
	legislationTrackings: many(legislationTracking),
	politicalActivities: many(politicalActivities),
}));

export const legislationTrackingRelations = relations(legislationTracking, ({one, many}) => ({
	politicalCampaign: one(politicalCampaigns, {
		fields: [legislationTracking.campaignId],
		references: [politicalCampaigns.id]
	}),
	organization: one(organizations, {
		fields: [legislationTracking.organizationId],
		references: [organizations.id]
	}),
	electedOfficial: one(electedOfficials, {
		fields: [legislationTracking.sponsorOfficialId],
		references: [electedOfficials.id]
	}),
	politicalActivities: many(politicalActivities),
}));

export const politicalCampaignsRelations = relations(politicalCampaigns, ({one, many}) => ({
	legislationTrackings: many(legislationTracking),
	politicalActivities: many(politicalActivities),
	organization: one(organizations, {
		fields: [politicalCampaigns.organizationId],
		references: [organizations.id]
	}),
}));

export const politicalActivitiesRelations = relations(politicalActivities, ({one}) => ({
	politicalCampaign: one(politicalCampaigns, {
		fields: [politicalActivities.campaignId],
		references: [politicalCampaigns.id]
	}),
	electedOfficial: one(electedOfficials, {
		fields: [politicalActivities.electedOfficialId],
		references: [electedOfficials.id]
	}),
	legislationTracking: one(legislationTracking, {
		fields: [politicalActivities.legislationId],
		references: [legislationTracking.id]
	}),
	organization: one(organizations, {
		fields: [politicalActivities.organizationId],
		references: [organizations.id]
	}),
}));

export const trainingCoursesRelations = relations(trainingCourses, ({one, many}) => ({
	organization: one(organizations, {
		fields: [trainingCourses.organizationId],
		references: [organizations.id]
	}),
	courseSessions: many(courseSessions),
	courseRegistrations: many(courseRegistrations),
	memberCertifications_courseId: many(memberCertifications, {
		relationName: "memberCertifications_courseId_trainingCourses_id"
	}),
	memberCertifications_renewalCourseId: many(memberCertifications, {
		relationName: "memberCertifications_renewalCourseId_trainingCourses_id"
	}),
}));

export const courseSessionsRelations = relations(courseSessions, ({one, many}) => ({
	trainingCourse: one(trainingCourses, {
		fields: [courseSessions.courseId],
		references: [trainingCourses.id]
	}),
	organization: one(organizations, {
		fields: [courseSessions.organizationId],
		references: [organizations.id]
	}),
	courseRegistrations: many(courseRegistrations),
	memberCertifications: many(memberCertifications),
}));

export const courseRegistrationsRelations = relations(courseRegistrations, ({one, many}) => ({
	trainingCourse: one(trainingCourses, {
		fields: [courseRegistrations.courseId],
		references: [trainingCourses.id]
	}),
	member: one(members, {
		fields: [courseRegistrations.memberId],
		references: [members.id]
	}),
	organization: one(organizations, {
		fields: [courseRegistrations.organizationId],
		references: [organizations.id]
	}),
	courseSession: one(courseSessions, {
		fields: [courseRegistrations.sessionId],
		references: [courseSessions.id]
	}),
	memberCertifications: many(memberCertifications),
}));

export const pensionPlansRelations = relations(pensionPlans, ({one, many}) => ({
	organization: one(organizations, {
		fields: [pensionPlans.organizationId],
		references: [organizations.id]
	}),
	pensionHoursBanks: many(pensionHoursBanks),
	pensionContributions: many(pensionContributions),
	pensionTrusteeBoards: many(pensionTrusteeBoards),
	pensionBenefitClaims: many(pensionBenefitClaims),
	pensionActuarialValuations: many(pensionActuarialValuations),
	trustComplianceReports: many(trustComplianceReports),
}));

export const pensionHoursBanksRelations = relations(pensionHoursBanks, ({one}) => ({
	member: one(members, {
		fields: [pensionHoursBanks.memberId],
		references: [members.id]
	}),
	pensionPlan: one(pensionPlans, {
		fields: [pensionHoursBanks.pensionPlanId],
		references: [pensionPlans.id]
	}),
}));

export const pensionContributionsRelations = relations(pensionContributions, ({one}) => ({
	pensionPlan: one(pensionPlans, {
		fields: [pensionContributions.pensionPlanId],
		references: [pensionPlans.id]
	}),
}));

export const pensionTrusteeBoardsRelations = relations(pensionTrusteeBoards, ({one, many}) => ({
	pensionPlan: one(pensionPlans, {
		fields: [pensionTrusteeBoards.pensionPlanId],
		references: [pensionPlans.id]
	}),
	pensionTrustees: many(pensionTrustees),
	pensionTrusteeMeetings: many(pensionTrusteeMeetings),
}));

export const pensionTrusteesRelations = relations(pensionTrustees, ({one}) => ({
	pensionTrusteeBoard: one(pensionTrusteeBoards, {
		fields: [pensionTrustees.trusteeBoardId],
		references: [pensionTrusteeBoards.id]
	}),
}));

export const analyticsMetricsRelations = relations(analyticsMetrics, ({one}) => ({
	organization: one(organizations, {
		fields: [analyticsMetrics.organizationId],
		references: [organizations.id]
	}),
}));

export const pensionTrusteeMeetingsRelations = relations(pensionTrusteeMeetings, ({one}) => ({
	pensionTrusteeBoard: one(pensionTrusteeBoards, {
		fields: [pensionTrusteeMeetings.trusteeBoardId],
		references: [pensionTrusteeBoards.id]
	}),
}));

export const pensionBenefitClaimsRelations = relations(pensionBenefitClaims, ({one}) => ({
	member: one(members, {
		fields: [pensionBenefitClaims.memberId],
		references: [members.id]
	}),
	pensionPlan: one(pensionPlans, {
		fields: [pensionBenefitClaims.pensionPlanId],
		references: [pensionPlans.id]
	}),
}));

export const pensionActuarialValuationsRelations = relations(pensionActuarialValuations, ({one}) => ({
	pensionPlan: one(pensionPlans, {
		fields: [pensionActuarialValuations.pensionPlanId],
		references: [pensionPlans.id]
	}),
}));

export const hwBenefitPlansRelations = relations(hwBenefitPlans, ({one, many}) => ({
	organization: one(organizations, {
		fields: [hwBenefitPlans.organizationId],
		references: [organizations.id]
	}),
	hwBenefitEnrollments: many(hwBenefitEnrollments),
	hwBenefitClaims: many(hwBenefitClaims),
	trustComplianceReports: many(trustComplianceReports),
}));

export const hwBenefitEnrollmentsRelations = relations(hwBenefitEnrollments, ({one, many}) => ({
	hwBenefitPlan: one(hwBenefitPlans, {
		fields: [hwBenefitEnrollments.hwPlanId],
		references: [hwBenefitPlans.id]
	}),
	member: one(members, {
		fields: [hwBenefitEnrollments.memberId],
		references: [members.id]
	}),
	hwBenefitClaims: many(hwBenefitClaims),
}));

export const hwBenefitClaimsRelations = relations(hwBenefitClaims, ({one}) => ({
	hwBenefitEnrollment: one(hwBenefitEnrollments, {
		fields: [hwBenefitClaims.enrollmentId],
		references: [hwBenefitEnrollments.id]
	}),
	hwBenefitPlan: one(hwBenefitPlans, {
		fields: [hwBenefitClaims.hwPlanId],
		references: [hwBenefitPlans.id]
	}),
	member: one(members, {
		fields: [hwBenefitClaims.memberId],
		references: [members.id]
	}),
}));

export const trustComplianceReportsRelations = relations(trustComplianceReports, ({one}) => ({
	hwBenefitPlan: one(hwBenefitPlans, {
		fields: [trustComplianceReports.hwPlanId],
		references: [hwBenefitPlans.id]
	}),
	organization: one(organizations, {
		fields: [trustComplianceReports.organizationId],
		references: [organizations.id]
	}),
	pensionPlan: one(pensionPlans, {
		fields: [trustComplianceReports.pensionPlanId],
		references: [pensionPlans.id]
	}),
}));

export const taxYearConfigurationsRelations = relations(taxYearConfigurations, ({one, many}) => ({
	organization: one(organizations, {
		fields: [taxYearConfigurations.organizationId],
		references: [organizations.id]
	}),
	taxSlips: many(taxSlips),
	craXmlBatches: many(craXmlBatches),
}));

export const trendAnalysesRelations = relations(trendAnalyses, ({one}) => ({
	organization: one(organizations, {
		fields: [trendAnalyses.organizationId],
		references: [organizations.id]
	}),
}));

export const taxSlipsRelations = relations(taxSlips, ({one, many}) => ({
	member: one(members, {
		fields: [taxSlips.memberId],
		references: [members.id]
	}),
	organization: one(organizations, {
		fields: [taxSlips.organizationId],
		references: [organizations.id]
	}),
	taxSlip: one(taxSlips, {
		fields: [taxSlips.originalSlipId],
		references: [taxSlips.id],
		relationName: "taxSlips_originalSlipId_taxSlips_id"
	}),
	taxSlips: many(taxSlips, {
		relationName: "taxSlips_originalSlipId_taxSlips_id"
	}),
	taxYearConfiguration: one(taxYearConfigurations, {
		fields: [taxSlips.taxYearConfigId],
		references: [taxYearConfigurations.id]
	}),
	copeContributions: many(copeContributions),
}));

export const craXmlBatchesRelations = relations(craXmlBatches, ({one}) => ({
	organization: one(organizations, {
		fields: [craXmlBatches.organizationId],
		references: [organizations.id]
	}),
	taxYearConfiguration: one(taxYearConfigurations, {
		fields: [craXmlBatches.taxYearConfigId],
		references: [taxYearConfigurations.id]
	}),
}));

export const copeContributionsRelations = relations(copeContributions, ({one}) => ({
	member: one(members, {
		fields: [copeContributions.memberId],
		references: [members.id]
	}),
	organization: one(organizations, {
		fields: [copeContributions.organizationId],
		references: [organizations.id]
	}),
	taxSlip: one(taxSlips, {
		fields: [copeContributions.taxSlipId],
		references: [taxSlips.id]
	}),
}));

export const memberDemographicsRelations = relations(memberDemographics, ({one}) => ({
	member: one(members, {
		fields: [memberDemographics.memberId],
		references: [members.id]
	}),
	organization: one(organizations, {
		fields: [memberDemographics.organizationId],
		references: [organizations.id]
	}),
}));

export const payEquityComplaintsRelations = relations(payEquityComplaints, ({one}) => ({
	member: one(members, {
		fields: [payEquityComplaints.complainantMemberId],
		references: [members.id]
	}),
	organization: one(organizations, {
		fields: [payEquityComplaints.organizationId],
		references: [organizations.id]
	}),
}));

export const equitySnapshotsRelations = relations(equitySnapshots, ({one}) => ({
	organization: one(organizations, {
		fields: [equitySnapshots.organizationId],
		references: [organizations.id]
	}),
}));

export const statcanSubmissionsRelations = relations(statcanSubmissions, ({one}) => ({
	organization: one(organizations, {
		fields: [statcanSubmissions.organizationId],
		references: [organizations.id]
	}),
}));

export const organizingCampaignsRelations = relations(organizingCampaigns, ({one, many}) => ({
	organization: one(organizations, {
		fields: [organizingCampaigns.organizationId],
		references: [organizations.id]
	}),
	organizingContacts: many(organizingContacts),
	organizingActivities: many(organizingActivities),
	certificationApplications: many(certificationApplications),
}));

export const organizingContactsRelations = relations(organizingContacts, ({one}) => ({
	organizingCampaign: one(organizingCampaigns, {
		fields: [organizingContacts.campaignId],
		references: [organizingCampaigns.id]
	}),
	member: one(members, {
		fields: [organizingContacts.memberId],
		references: [members.id]
	}),
	organization: one(organizations, {
		fields: [organizingContacts.organizationId],
		references: [organizations.id]
	}),
}));

export const organizingActivitiesRelations = relations(organizingActivities, ({one}) => ({
	organizingCampaign: one(organizingCampaigns, {
		fields: [organizingActivities.campaignId],
		references: [organizingCampaigns.id]
	}),
	organization: one(organizations, {
		fields: [organizingActivities.organizationId],
		references: [organizations.id]
	}),
}));

export const certificationApplicationsRelations = relations(certificationApplications, ({one}) => ({
	organizingCampaign: one(organizingCampaigns, {
		fields: [certificationApplications.campaignId],
		references: [organizingCampaigns.id]
	}),
	organization: one(organizations, {
		fields: [certificationApplications.organizationId],
		references: [organizations.id]
	}),
}));

export const organizingVolunteersRelations = relations(organizingVolunteers, ({one}) => ({
	member: one(members, {
		fields: [organizingVolunteers.memberId],
		references: [members.id]
	}),
	organization: one(organizations, {
		fields: [organizingVolunteers.organizationId],
		references: [organizations.id]
	}),
}));

export const memberCertificationsRelations = relations(memberCertifications, ({one, many}) => ({
	trainingCourse_courseId: one(trainingCourses, {
		fields: [memberCertifications.courseId],
		references: [trainingCourses.id],
		relationName: "memberCertifications_courseId_trainingCourses_id"
	}),
	member: one(members, {
		fields: [memberCertifications.memberId],
		references: [members.id]
	}),
	organization: one(organizations, {
		fields: [memberCertifications.organizationId],
		references: [organizations.id]
	}),
	courseRegistration: one(courseRegistrations, {
		fields: [memberCertifications.registrationId],
		references: [courseRegistrations.id]
	}),
	trainingCourse_renewalCourseId: one(trainingCourses, {
		fields: [memberCertifications.renewalCourseId],
		references: [trainingCourses.id],
		relationName: "memberCertifications_renewalCourseId_trainingCourses_id"
	}),
	courseSession: one(courseSessions, {
		fields: [memberCertifications.sessionId],
		references: [courseSessions.id]
	}),
	programEnrollments: many(programEnrollments),
}));

export const trainingProgramsRelations = relations(trainingPrograms, ({one, many}) => ({
	organization: one(organizations, {
		fields: [trainingPrograms.organizationId],
		references: [organizations.id]
	}),
	programEnrollments: many(programEnrollments),
}));

export const duesTransactionsRelations = relations(duesTransactions, ({one}) => ({
	memberDuesAssignment: one(memberDuesAssignments, {
		fields: [duesTransactions.assignmentId],
		references: [memberDuesAssignments.id]
	}),
	duesRule: one(duesRules, {
		fields: [duesTransactions.ruleId],
		references: [duesRules.id]
	}),
	tenantsInTenantManagement: one(tenantsInTenantManagement, {
		fields: [duesTransactions.tenantId],
		references: [tenantsInTenantManagement.tenantId]
	}),
}));

export const programEnrollmentsRelations = relations(programEnrollments, ({one}) => ({
	memberCertification: one(memberCertifications, {
		fields: [programEnrollments.certificationId],
		references: [memberCertifications.id]
	}),
	member: one(members, {
		fields: [programEnrollments.memberId],
		references: [members.id]
	}),
	organization: one(organizations, {
		fields: [programEnrollments.organizationId],
		references: [organizations.id]
	}),
	trainingProgram: one(trainingPrograms, {
		fields: [programEnrollments.programId],
		references: [trainingPrograms.id]
	}),
}));

export const kpiConfigurationsRelations = relations(kpiConfigurations, ({one}) => ({
	organization: one(organizations, {
		fields: [kpiConfigurations.organizationId],
		references: [organizations.id]
	}),
}));