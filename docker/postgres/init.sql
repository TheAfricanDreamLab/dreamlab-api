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

\connect postgres
CREATE ROLE catalog_owner LOGIN PASSWORD 'catalog_owner';
CREATE ROLE catalog_app LOGIN PASSWORD 'catalog_app';
CREATE ROLE catalog_system LOGIN PASSWORD 'catalog_system' BYPASSRLS;
CREATE DATABASE dreamlab_catalog OWNER catalog_owner;
REVOKE ALL ON DATABASE dreamlab_catalog FROM PUBLIC;
GRANT CONNECT ON DATABASE dreamlab_catalog TO catalog_app, catalog_system;

\connect dreamlab_catalog
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO catalog_owner;

\connect postgres
CREATE ROLE learning_owner LOGIN PASSWORD 'learning_owner';
CREATE ROLE learning_app LOGIN PASSWORD 'learning_app';
CREATE ROLE learning_system LOGIN PASSWORD 'learning_system' BYPASSRLS;
CREATE DATABASE dreamlab_learning OWNER learning_owner;
REVOKE ALL ON DATABASE dreamlab_learning FROM PUBLIC;
GRANT CONNECT ON DATABASE dreamlab_learning TO learning_app, learning_system;

\connect dreamlab_learning
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO learning_owner;

\connect postgres
CREATE ROLE notify_owner LOGIN PASSWORD 'notify_owner';
CREATE ROLE notify_app LOGIN PASSWORD 'notify_app';
CREATE ROLE notify_system LOGIN PASSWORD 'notify_system' BYPASSRLS;
CREATE DATABASE dreamlab_notify OWNER notify_owner;
REVOKE ALL ON DATABASE dreamlab_notify FROM PUBLIC;
GRANT CONNECT ON DATABASE dreamlab_notify TO notify_app, notify_system;

\connect dreamlab_notify
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO notify_owner;
