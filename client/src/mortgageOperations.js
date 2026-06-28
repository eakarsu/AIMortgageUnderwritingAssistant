export const mortgageOperationModules = [
  {
    key: 'disclosure-packages',
    path: '/operations/disclosure-packages',
    label: 'Disclosure Packages',
    icon: '📦',
    description: 'Loan estimate, closing disclosure, e-consent, redisclosure, and evidence package workflow.',
  },
  {
    key: 'los-integrations',
    path: '/operations/los-integrations',
    label: 'LOS Integrations',
    icon: '🔌',
    description: 'Loan origination system syncs, import/export runs, mapping checks, and webhook status.',
  },
  {
    key: 'credit-bureau-pulls',
    path: '/operations/credit-bureau-pulls',
    label: 'Credit Bureau Pulls',
    icon: '🏦',
    description: 'Tri-merge pulls, supplements, consent status, disputes, and bureau refresh tracking.',
  },
  {
    key: 'aus-findings',
    path: '/operations/aus-findings',
    label: 'AUS Findings',
    icon: '🧾',
    description: 'DU/LP findings import, review, conditions, overlays, and decision evidence.',
  },
  {
    key: 'title-vendor-integrations',
    path: '/operations/title-vendor-integrations',
    label: 'Title Vendors',
    icon: '🏛️',
    description: 'Title search, settlement agent, lien clearance, endorsement, and vendor status.',
  },
  {
    key: 'task-work-queue',
    path: '/operations/task-work-queue',
    label: 'Task Work Queue',
    icon: '🗂️',
    description: 'SLA ownership, escalations, processor queues, borrower follow-ups, and team workload.',
  },
  {
    key: 'closing-funding',
    path: '/operations/closing-funding',
    label: 'Closing Funding',
    icon: '💸',
    description: 'Closing packages, wire authorization, funding checks, suspense, and close status.',
  },
  {
    key: 'post-close-qc',
    path: '/operations/post-close-qc',
    label: 'Post-Close QC',
    icon: '🔎',
    description: 'Prefund QC, post-close audit, defect remediation, investor suspense, and cures.',
  },
  {
    key: 'hmda-lar-export',
    path: '/operations/hmda-lar-export',
    label: 'HMDA/LAR Export',
    icon: '📤',
    description: 'HMDA data checks, LAR export readiness, demographic validation, and quarterly filings.',
  },
  {
    key: 'role-permissions',
    path: '/operations/role-permissions',
    label: 'Role Permissions',
    icon: '🔐',
    description: 'Role matrix, access reviews, privilege exceptions, approvals, and separation of duties.',
  },
  {
    key: 'document-storage-viewer',
    path: '/operations/document-storage-viewer',
    label: 'Doc Storage Viewer',
    icon: '🗄️',
    description: 'Document index, viewer status, retention holds, redaction checks, and storage links.',
  },
  {
    key: 'error-monitoring',
    path: '/operations/error-monitoring',
    label: 'Error Monitoring',
    icon: '🚨',
    description: 'Runtime errors, API failures, AI provider fallbacks, alerts, and operational remediation.',
  },
];

export function getMortgageOperationModule(key) {
  return mortgageOperationModules.find((module) => module.key === key);
}
