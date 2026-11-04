-- Organisations in review now grant only set-up permissions (UAT ORG-003). Members of organisations
-- already in review hold access issued under the old rule: a new authorization version makes IAM
-- read their grants afresh, and the tokens they hold give way to new ones within their lifetime.
UPDATE "users" SET "authz_version" = "authz_version" + 1
WHERE "id" IN (
  SELECT "m"."user_id" FROM "memberships" "m"
  JOIN "organizations" "o" ON "o"."id" = "m"."org_id"
  WHERE "o"."status" = 'pending'
);
