-- One database per service, each with three roles:
--   <svc>_owner   owns the schema and runs migrations
--   <svc>_app     the service's normal connection; row-level security applies
--   <svc>_system  BYPASSRLS, for deliberate cross-tenant work (auth flows, outbox relay)
-- Development passwords only. Production credentials come from the secrets manifest (dreamlab-infra).

CREATE ROLE iam_owner LOGIN PASSWORD 'iam_owner';
CREATE ROLE iam_app LOGIN PASSWORD 'iam_app';
CREATE ROLE iam_system LOGIN PASSWORD 'iam_system' BYPASSRLS;
CREATE DATABASE dreamlab_iam OWNER iam_owner;
REVOKE ALL ON DATABASE dreamlab_iam FROM PUBLIC;
GRANT CONNECT ON DATABASE dreamlab_iam TO iam_app, iam_system;

\connect dreamlab_iam
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO iam_owner;
