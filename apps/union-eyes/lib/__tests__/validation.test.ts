/**
 * Unit Tests — lib/validation.ts
 *
 * Tests Zod validation schemas, SQL injection prevention,
 * and error formatting for the Union-Eyes validation layer.
 */
import { describe, it, expect } from 'vitest';
import { commonSchemas, paramSchemas, bodySchemas, querySchemas } from '@/lib/validation';

// ---------------------------------------------------------------------------
// commonSchemas
// ---------------------------------------------------------------------------
describe('commonSchemas', () => {
  describe('uuid', () => {
    it('accepts valid UUIDs', () => {
      expect(() => commonSchemas.uuid.parse('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
    });

    it('rejects non-UUID strings', () => {
      expect(() => commonSchemas.uuid.parse('not-a-uuid')).toThrow();
    });

    it('rejects empty strings', () => {
      expect(() => commonSchemas.uuid.parse('')).toThrow();
    });
  });

  describe('email', () => {
    it('accepts valid emails', () => {
      expect(() => commonSchemas.email.parse('user@example.com')).not.toThrow();
    });

    it('rejects invalid emails', () => {
      expect(() => commonSchemas.email.parse('not-an-email')).toThrow();
    });
  });

  describe('pagination', () => {
    it('provides defaults when no input given', () => {
      const result = commonSchemas.pagination.parse({});
      expect(result).toEqual({ page: 1, limit: 20 });
    });

    it('coerces string numbers', () => {
      const result = commonSchemas.pagination.parse({ page: '2', limit: '50' });
      expect(result).toEqual({ page: 2, limit: 50 });
    });

    it('rejects page < 1', () => {
      expect(() => commonSchemas.pagination.parse({ page: 0 })).toThrow();
    });

    it('rejects limit > 100', () => {
      expect(() => commonSchemas.pagination.parse({ limit: 101 })).toThrow();
    });
  });

  describe('searchQuery', () => {
    it('accepts normal search text', () => {
      expect(commonSchemas.searchQuery.parse('union steward')).toBe('union steward');
    });

    it('rejects SQL injection patterns', () => {
      expect(() => commonSchemas.searchQuery.parse("'; DROP TABLE users;--")).toThrow();
    });

    it('rejects XSS patterns', () => {
      expect(() => commonSchemas.searchQuery.parse('<script>alert(1)</script>')).toThrow();
    });

    it('rejects strings > 200 chars', () => {
      expect(() => commonSchemas.searchQuery.parse('a'.repeat(201))).toThrow();
    });
  });
});

// ---------------------------------------------------------------------------
// bodySchemas
// ---------------------------------------------------------------------------
describe('bodySchemas', () => {
  describe('createClaim', () => {
    const validClaim = {
      claimType: 'grievance_discipline',
      incidentDate: '2026-01-15T10:00:00.000Z',
      location: 'Main Office',
      description: 'A detailed description of the incident that exceeds the minimum character requirement.',
      desiredOutcome: 'I would like the disciplinary action to be reversed and expunged from my record.',
      priority: 'high',
    };

    it('accepts a valid claim', () => {
      expect(() => bodySchemas.createClaim.parse(validClaim)).not.toThrow();
    });

    it('rejects claims with too-short description', () => {
      expect(() =>
        bodySchemas.createClaim.parse({ ...validClaim, description: 'short' }),
      ).toThrow();
    });

    it('rejects claims with invalid claimType', () => {
      expect(() =>
        bodySchemas.createClaim.parse({ ...validClaim, claimType: 'invalid_type' }),
      ).toThrow();
    });

    it('requires witnessDetails when witnessesPresent is true', () => {
      expect(() =>
        bodySchemas.createClaim.parse({ ...validClaim, witnessesPresent: true }),
      ).toThrow('Witness details required');
    });

    it('requires previousReportDetails when previouslyReported is true', () => {
      expect(() =>
        bodySchemas.createClaim.parse({ ...validClaim, previouslyReported: true }),
      ).toThrow('Previous report details required');
    });
  });

  describe('createOrganization', () => {
    const validOrg = {
      name: 'CAPE-ACEP',
      slug: 'cape-acep',
      type: 'union',
    };

    it('accepts a valid organization', () => {
      expect(() => bodySchemas.createOrganization.parse(validOrg)).not.toThrow();
    });

    it('rejects invalid slug characters', () => {
      expect(() =>
        bodySchemas.createOrganization.parse({ ...validOrg, slug: 'INVALID SLUG!' }),
      ).toThrow();
    });

    it('rejects invalid organization types', () => {
      expect(() =>
        bodySchemas.createOrganization.parse({ ...validOrg, type: 'corporation' }),
      ).toThrow();
    });

    it('validates jurisdiction enum', () => {
      expect(() =>
        bodySchemas.createOrganization.parse({ ...validOrg, jurisdiction: 'ON' }),
      ).not.toThrow();
      expect(() =>
        bodySchemas.createOrganization.parse({ ...validOrg, jurisdiction: 'XX' }),
      ).toThrow();
    });

    it('validates primaryColor hex format', () => {
      expect(() =>
        bodySchemas.createOrganization.parse({ ...validOrg, primaryColor: '#FF0000' }),
      ).not.toThrow();
      expect(() =>
        bodySchemas.createOrganization.parse({ ...validOrg, primaryColor: 'red' }),
      ).toThrow();
    });
  });

  describe('updateMemberRole', () => {
    it('accepts valid roles', () => {
      expect(() =>
        bodySchemas.updateMemberRole.parse({ role: 'steward' }),
      ).not.toThrow();
    });

    it('rejects invalid roles', () => {
      expect(() =>
        bodySchemas.updateMemberRole.parse({ role: 'superadmin' }),
      ).toThrow();
    });
  });

  describe('updateMemberProfile', () => {
    it('accepts partial updates', () => {
      expect(() =>
        bodySchemas.updateMemberProfile.parse({ name: 'Jane' }),
      ).not.toThrow();
    });

    it('rejects empty updates', () => {
      expect(() =>
        bodySchemas.updateMemberProfile.parse({}),
      ).toThrow('At least one field must be provided');
    });
  });
});

// ---------------------------------------------------------------------------
// querySchemas
// ---------------------------------------------------------------------------
describe('querySchemas', () => {
  describe('claimsQuery', () => {
    it('accepts valid claims query', () => {
      const result = querySchemas.claimsQuery.parse({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'pending',
        page: 1,
        limit: 10,
      });
      expect(result.organizationId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.status).toBe('pending');
    });

    it('rejects invalid status values', () => {
      expect(() =>
        querySchemas.claimsQuery.parse({
          organizationId: '550e8400-e29b-41d4-a716-446655440000',
          status: 'invalid_status',
        }),
      ).toThrow();
    });
  });

  describe('membersQuery', () => {
    it('accepts valid members query', () => {
      const result = querySchemas.membersQuery.parse({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'admin',
      });
      expect(result.role).toBe('admin');
    });
  });
});

// ---------------------------------------------------------------------------
// paramSchemas
// ---------------------------------------------------------------------------
describe('paramSchemas', () => {
  it('accepts valid vote session ID', () => {
    const result = paramSchemas.voteSessionId.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.id).toBeDefined();
  });

  it('rejects invalid UUID in params', () => {
    expect(() => paramSchemas.claimId.parse({ id: 'bad' })).toThrow();
  });
});
