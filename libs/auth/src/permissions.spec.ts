import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '@dreamlab/contracts';
import { AuthzChecker } from './authz';
import { REQUIRED_PERMISSION } from './decorators';
import { PermissionsGuard } from './guards';
import { hasOrgPermission, Principal } from './principal';

const ORG = '0192f000-0000-7000-8000-000000000001';
const OTHER_ORG = '0192f000-0000-7000-8000-000000000002';

const principal = (roles: string[], overrides: Partial<Principal> = {}): Principal => ({
  userId: '0192f000-0000-7000-8000-0000000000aa',
  sessionId: '0192f000-0000-7000-8000-0000000000bb',
  orgId: ORG,
  membershipId: '0192f000-0000-7000-8000-0000000000cc',
  roles,
  platformAdmin: false,
  authzVersion: 1,
  tokenId: 'jti',
  expiresAt: 0,
  ...overrides,
});

/**
 * Plan v1.1 §14 RBAC matrix, at organisation level. Faculty = instructor.
 * ✓ = holds the permission org-wide; anything narrower is checked by IAM at a scope.
 */
const MATRIX: Array<[string, Permission, boolean]> = [
  // admin
  ['org_admin', 'org.members.read', true],
  ['org_admin', 'org.members.invite', true],
  ['org_admin', 'org.roles.assign', true],
  ['org_admin', 'org.settings.update', true],
  ['org_admin', 'org.reports.read', true],
  ['org_admin', 'platform.orgs.create', false],
  // faculty
  ['instructor', 'submission.grade', true],
  ['instructor', 'course_run.teach', true],
  ['instructor', 'org.members.invite', false],
  ['instructor', 'org.settings.update', false],
  // mentor
  ['mentor', 'mentorship.conduct', true],
  ['mentor', 'submission.grade', false],
  // student, applicant, alumni: read-only membership
  ['student', 'org.read', true],
  ['student', 'org.members.read', false],
  ['student', 'submission.grade', false],
  ['applicant', 'org.read', true],
  ['applicant', 'org.members.read', false],
  ['alumni', 'org.read', true],
  ['alumni', 'org.reports.read', false],
  // enterprise roles
  ['learner', 'org.read', true],
  ['learner', 'learning.assign', false],
  ['analyst', 'org.reports.read', true],
  ['analyst', 'org.members.invite', false],
  ['sponsor_viewer', 'org.reports.read', true],
  ['sponsor_viewer', 'org.members.read', false],
];

describe('RBAC matrix (Plan §14)', () => {
  it.each(MATRIX)('%s → %s = %s', (role, permission, expected) => {
    expect(hasOrgPermission(principal([role]), permission)).toBe(expected);
  });

  it('platform admins hold every permission', () => {
    expect(hasOrgPermission(principal([], { platformAdmin: true }), 'platform.orgs.create')).toBe(true);
  });

  it('nobody holds org permissions in the personal context', () => {
    expect(hasOrgPermission(principal(['org_admin'], { orgId: null }), 'org.read')).toBe(false);
  });

  it('roles combine', () => {
    const p = principal(['student', 'mentor']);
    expect(hasOrgPermission(p, 'mentorship.conduct')).toBe(true);
    expect(hasOrgPermission(p, 'org.members.read')).toBe(false);
  });
});

describe('PermissionsGuard', () => {
  const contextFor = (p: Principal | undefined, params: Record<string, string> = {}) =>
    ({
      getType: () => 'http',
      getHandler: () => null,
      getClass: () => null,
      switchToHttp: () => ({ getRequest: () => ({ principal: p, params, headers: {} }) }),
    }) as unknown as ExecutionContext;

  const guardWith = (requirement: object, checker?: AuthzChecker) => {
    const reflector = { getAllAndOverride: (key: string) => (key === REQUIRED_PERMISSION ? requirement : undefined) } as unknown as Reflector;
    return new PermissionsGuard(reflector, checker);
  };

  it('allows an org-wide permission in the matching org', async () => {
    await expect(guardWith({ permission: 'org.members.read' }).canActivate(contextFor(principal(['org_admin']), { orgId: ORG }))).resolves.toBe(true);
  });

  it('refuses a token for a different org with org_context_mismatch', async () => {
    await expect(
      guardWith({ permission: 'org.members.read' }).canActivate(contextFor(principal(['org_admin']), { orgId: OTHER_ORG })),
    ).rejects.toMatchObject({ code: 'org_context_mismatch' });
  });

  it('refuses without the permission', async () => {
    await expect(guardWith({ permission: 'org.members.read' }).canActivate(contextFor(principal(['student']), { orgId: ORG }))).rejects.toMatchObject({
      code: 'permission_denied',
    });
  });

  it('asks the checker for scoped permissions and fails closed when it says no', async () => {
    const checker = { check: jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false) };
    const guard = guardWith({ permission: 'submission.grade', scope: { type: 'course_run', param: 'runId' } }, checker);
    const ctx = contextFor(principal(['learner']), { orgId: ORG, runId: '0192f000-0000-7000-8000-0000000000dd' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    await expect(guard.canActivate(ctx)).rejects.toMatchObject({ code: 'permission_denied' });
    expect(checker.check).toHaveBeenCalledWith(
      expect.objectContaining({ permission: 'submission.grade', scopeType: 'course_run', scopeId: '0192f000-0000-7000-8000-0000000000dd' }),
    );
  });

  it('requires authentication', async () => {
    await expect(guardWith({ permission: 'org.read' }).canActivate(contextFor(undefined))).rejects.toMatchObject({ code: 'token_missing' });
  });

  it('lets platform admins into any org', async () => {
    await expect(
      guardWith({ permission: 'org.members.remove' }).canActivate(contextFor(principal([], { platformAdmin: true, orgId: null }), { orgId: OTHER_ORG })),
    ).resolves.toBe(true);
  });
});
