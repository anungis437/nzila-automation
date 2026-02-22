/**
 * GraphQL Schema Definition
 * 
 * Provides GraphQL API alongside existing REST endpoints
 * Supports queries, mutations, and subscriptions
 */

import { createSchema } from 'graphql-yoga';

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    # Scalars
    scalar DateTime
    scalar JSON

    # Enums
    enum ClaimStatus {
      OPEN
      IN_PROGRESS
      RESOLVED
      CLOSED
    }

    enum ClaimPriority {
      LOW
      MEDIUM
      HIGH
      URGENT
    }

    enum MemberStatus {
      ACTIVE
      INACTIVE
      SUSPENDED
    }

    enum VoteStatus {
      DRAFT
      ACTIVE
      CLOSED
      CANCELLED
    }

    enum PensionPlanType {
      CPP
      QPP
      OTPP
    }

    enum PaymentFrequency {
      WEEKLY
      BIWEEKLY
      SEMIMONTHLY
      MONTHLY
    }

    enum RemittanceStatus {
      PENDING
      SUBMITTED
      CONFIRMED
      FAILED
    }

    enum InsuranceProvider {
      SUN_LIFE
      MANULIFE
      GREEN_SHIELD_CANADA
      CANADA_LIFE
      INDUSTRIAL_ALLIANCE
    }

    # Types
    type Claim {
      id: ID!
      title: String!
      description: String
      status: ClaimStatus!
      priority: ClaimPriority!
      claimantId: ID!
      claimant: Member
      assignedTo: ID
      assignee: User
      createdAt: DateTime!
      updatedAt: DateTime!
      resolvedAt: DateTime
    }

    type Member {
      id: ID!
      firstName: String!
      lastName: String!
      email: String!
      phone: String
      membershipNumber: String!
      status: MemberStatus!
      joinedAt: DateTime!
      claims: [Claim!]!
    }

    type User {
      id: ID!
      firstName: String!
      lastName: String!
      email: String!
      role: String!
      createdAt: DateTime!
    }

    type Vote {
      id: ID!
      title: String!
      description: String
      startDate: DateTime!
      endDate: DateTime!
      status: VoteStatus!
      eligibleVoters: Int!
      totalVotes: Int!
      options: [VoteOption!]!
    }

    type VoteOption {
      id: ID!
      label: String!
      voteCount: Int!
    }

    type Organization {
      id: ID!
      name: String!
      type: String!
      province: String!
      memberCount: Int!
      createdAt: DateTime!
    }

    # Pension Types
    type PensionContribution {
      employeeContribution: Float!
      employerContribution: Float!
      totalContribution: Float!
      pensionableEarnings: Float!
      grossEarnings: Float!
      basicExemption: Float!
      planType: PensionPlanType!
      contributionPeriod: String!
    }

    type ContributionRates {
      planType: PensionPlanType!
      year: Int!
      employeeRate: Float!
      employerRate: Float!
      maximumPensionableEarnings: Float!
      basicExemption: Float
      maximumContribution: Float!
    }

    type PensionRemittance {
      id: ID!
      planType: PensionPlanType!
      periodStart: DateTime!
      periodEnd: DateTime!
      totalEmployeeContributions: Float!
      totalEmployerContributions: Float!
      totalContributions: Float!
      employeeCount: Int!
      status: RemittanceStatus!
      confirmationNumber: String
      submittedAt: DateTime
      createdAt: DateTime!
    }

    type PensionProcessor {
      type: PensionPlanType!
      name: String!
      description: String!
      minAge: Int
      maxAge: Int
      supportsBuyBack: Boolean!
      supportsEarlyRetirement: Boolean!
      supportedProvinces: [String!]
    }

    # Insurance Types
    type InsuranceClaim {
      id: ID!
      claimNumber: String!
      provider: InsuranceProvider!
      memberName: String!
      claimDate: DateTime!
      claimType: String!
      claimAmount: Float!
      approvedAmount: Float
      paidAmount: Float
      status: String!
      providerName: String
      serviceDate: DateTime
    }

    type InsurancePolicy {
      id: ID!
      provider: InsuranceProvider!
      policyNumber: String!
      policyType: String!
      policyHolder: String!
      coverageAmount: Float!
      premium: Float!
      effectiveDate: DateTime!
      expiryDate: DateTime
      status: String!
    }

    type InsuranceConnection {
      provider: InsuranceProvider!
      connected: Boolean!
      lastSyncAt: DateTime
      claimsCount: Int!
      policiesCount: Int!
    }

    # Pagination
    type PageInfo {
      hasNextPage: Boolean!
      hasPreviousPage: Boolean!
      startCursor: String
      endCursor: String
    }

    type ClaimConnection {
      edges: [ClaimEdge!]!
      pageInfo: PageInfo!
      totalCount: Int!
    }

    type ClaimEdge {
      node: Claim!
      cursor: String!
    }

    type MemberConnection {
      edges: [MemberEdge!]!
      pageInfo: PageInfo!
      totalCount: Int!
    }

    type MemberEdge {
      node: Member!
      cursor: String!
    }

    # Inputs
    input CreateClaimInput {
      title: String!
      description: String!
      priority: ClaimPriority!
      claimantId: ID!
    }

    input UpdateClaimInput {
      title: String
      description: String
      status: ClaimStatus
      priority: ClaimPriority
      assignedTo: ID
    }

    input ClaimFilters {
      status: ClaimStatus
      priority: ClaimPriority
      claimantId: ID
      assignedTo: ID
    }

    input PaginationInput {
      first: Int
      after: String
      last: Int
      before: String
    }

    # Pension Inputs
    input CalculatePensionInput {
      planType: PensionPlanType!
      memberId: ID!
      grossEarnings: Float!
      paymentFrequency: PaymentFrequency!
      province: String!
      dateOfBirth: DateTime!
      yearToDateEarnings: Float
      yearToDateContributions: Float
    }

    input CreateRemittanceInput {
      planType: PensionPlanType!
      periodStart: DateTime!
      periodEnd: DateTime!
      contributions: [ID!]!
    }

    # Queries
    type Query {
      # Claims
      claim(id: ID!): Claim
      claims(
        filters: ClaimFilters
        pagination: PaginationInput
      ): ClaimConnection!

      # Members
      member(id: ID!): Member
      members(
        status: MemberStatus
        pagination: PaginationInput
      ): MemberConnection!

      # Voting
      vote(id: ID!): Vote
      votes(status: VoteStatus): [Vote!]!

      # Organization
      organization: Organization!

      # Pension
      pensionProcessors: [PensionProcessor!]!
      pensionProcessor(planType: PensionPlanType!): PensionProcessor
      contributionRates(planType: PensionPlanType!, year: Int!): ContributionRates
      remittance(id: ID!): PensionRemittance
      remittances(planType: PensionPlanType, status: RemittanceStatus): [PensionRemittance!]!

      # Insurance
      insuranceClaims(
        provider: InsuranceProvider
        status: String
        startDate: DateTime
        endDate: DateTime
        pagination: PaginationInput
      ): [InsuranceClaim!]!
      insurancePolicies(
        provider: InsuranceProvider
        status: String
      ): [InsurancePolicy!]!
      insuranceConnections: [InsuranceConnection!]!

      # System
      systemStatus: SystemStatus!
    }

    # Mutations
    type Mutation {
      # Claims
      createClaim(input: CreateClaimInput!): Claim!
      updateClaim(id: ID!, input: UpdateClaimInput!): Claim!
      deleteClaim(id: ID!): Boolean!

      # Members
      updateMemberStatus(id: ID!, status: MemberStatus!): Member!

      # Voting
      castVote(voteId: ID!, optionId: ID!): Boolean!

      # Pension
      calculatePensionContribution(input: CalculatePensionInput!): PensionContribution!
      createRemittance(input: CreateRemittanceInput!): PensionRemittance!
      submitRemittance(id: ID!): PensionRemittance!

      # Insurance
      syncInsuranceProvider(provider: InsuranceProvider!): InsuranceConnection!
    }

    # Subscriptions
    type Subscription {
      # Real-time claim updates
      claimCreated: Claim!
      claimUpdated(id: ID): Claim!

      # Real-time vote updates
      voteUpdated(id: ID!): Vote!
    }

    # System Status
    type SystemStatus {
      status: String!
      services: [ServiceHealth!]!
      uptime: Float!
      version: String!
      timestamp: DateTime!
    }

    type ServiceHealth {
      name: String!
      status: String!
      responseTime: Int
      message: String
      lastChecked: DateTime!
    }
  `,
});

