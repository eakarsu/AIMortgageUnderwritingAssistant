BEGIN;
CREATE TABLE IF NOT EXISTS underwriting_cases (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, application_ref TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'intake',
 calculation_version TEXT NOT NULL, rule_version TEXT NOT NULL, effective_at TIMESTAMPTZ NOT NULL,
 source_as_of TIMESTAMPTZ NOT NULL, idempotency_key TEXT NOT NULL, created_by TEXT NOT NULL,
 period_lock TEXT, correction_reference TEXT, version INTEGER NOT NULL DEFAULT 1,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,application_ref), UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS underwriting_inputs (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, application_ref TEXT NOT NULL, input_type TEXT NOT NULL,
 source_system TEXT NOT NULL, source_record_ref TEXT NOT NULL, source_version TEXT NOT NULL, evidence_checksum TEXT NOT NULL,
 payload JSONB NOT NULL, reconciled BOOLEAN NOT NULL DEFAULT FALSE, correction_of BIGINT,
 captured_at TIMESTAMPTZ NOT NULL, UNIQUE(tenant_id,source_system,source_record_ref,source_version)
);
CREATE TABLE IF NOT EXISTS underwriting_calculations (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, application_ref TEXT NOT NULL, calculation_version TEXT NOT NULL,
 inputs_checksum TEXT NOT NULL, dti NUMERIC(10,6) NOT NULL, ltv NUMERIC(10,6) NOT NULL, result JSONB NOT NULL,
 rule_version TEXT NOT NULL, effective_at TIMESTAMPTZ NOT NULL, reversed_by BIGINT,
 UNIQUE(tenant_id,application_ref,calculation_version)
);
CREATE TABLE IF NOT EXISTS underwriting_evidence (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, application_ref TEXT NOT NULL, evidence_type TEXT NOT NULL,
 evidence_ref TEXT NOT NULL, evidence_version TEXT NOT NULL, checksum TEXT NOT NULL, immutable_payload JSONB NOT NULL,
 reviewer_explanation TEXT, retained_until TIMESTAMPTZ, UNIQUE(tenant_id,evidence_ref,evidence_version)
);
CREATE TABLE IF NOT EXISTS underwriting_decisions (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, application_ref TEXT NOT NULL, decision TEXT NOT NULL,
 explanation TEXT NOT NULL, evidence_refs JSONB NOT NULL, decided_by TEXT NOT NULL, override_role TEXT,
 approval_reference TEXT NOT NULL, effective_at TIMESTAMPTZ NOT NULL, reversed_by BIGINT
);
CREATE TABLE IF NOT EXISTS underwriting_sync_deliveries (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, application_ref TEXT NOT NULL, provider TEXT NOT NULL,
 idempotency_key TEXT NOT NULL, payload_checksum TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', receipt TEXT,
 attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at TIMESTAMPTZ, last_error TEXT,
 UNIQUE(tenant_id,provider,idempotency_key)
);
CREATE TABLE IF NOT EXISTS underwriting_workflow_audit (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, application_ref TEXT NOT NULL, from_status TEXT, to_status TEXT NOT NULL,
 actor_id TEXT NOT NULL, actor_role TEXT NOT NULL, reason TEXT NOT NULL, evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
 correlation_id TEXT NOT NULL, occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_underwriting_sync_retry ON underwriting_sync_deliveries(status,next_attempt_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_underwriting_audit_correlation ON underwriting_workflow_audit(tenant_id,application_ref,correlation_id);
COMMIT;
