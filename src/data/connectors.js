// Connector catalogue. Every connector declares its OWN credential form.
// Field shape: { key, label, type: text|number|password|select|textarea|toggle|file,
//                required, secret, half, default, placeholder, options, showIf:{key,eq} }
// `secret` fields are never persisted by the UI. `advanced` fields sit under "Advanced Options".

const t = (key, label, o = {}) => ({ key, label, type: 'text', ...o })
const n = (key, label, o = {}) => ({ key, label, type: 'number', ...o })
const pw = (key, label, o = {}) => ({ key, label, type: 'password', secret: true, required: true, ...o })
const sel = (key, label, options, o = {}) => ({ key, label, type: 'select', options, ...o })
const area = (key, label, o = {}) => ({ key, label, type: 'textarea', secret: true, required: true, ...o })
const tog = (key, label, o = {}) => ({ key, label, type: 'toggle', ...o })
const file = (key, label, accept, o = {}) => ({ key, label, type: 'file', accept, ...o })
const when = (key, eq) => ({ key, eq })
const R = { required: true }
const H = { half: true }

const NET = [
  n('timeout', 'Connection timeout (seconds)', { default: 30, ...H }),
  n('poolSize', 'Max pool size', { default: 5, ...H }),
]

export const CATEGORIES = ['All Connectors', 'Databases', 'SaaS Applications', 'Files & Storage', 'APIs', 'Streaming']

export const CONNECTORS = [
  {
    id: 'postgres', name: 'PostgreSQL', sub: 'Relational database', category: 'Databases', color: '#336791', glyph: 'Pg',
    auth: 'Username & password',
    fields: [
      t('host', 'Host', { ...R, ...H, placeholder: 'db.company.com' }),
      n('port', 'Port', { ...R, ...H, default: 5432 }),
      t('database', 'Database', { ...R, ...H, placeholder: 'sales_db' }),
      t('schema', 'Schema', { ...H, default: 'public' }),
      t('username', 'Username', { ...R, ...H }),
      pw('password', 'Password', { ...H }),
    ],
    advanced: [sel('sslmode', 'SSL mode', ['disable', 'require', 'verify-full'], { default: 'require' }), ...NET],
    testInfo: 'PostgreSQL 16.2 · 38 tables found',
  },
  {
    id: 'mysql', name: 'MySQL', sub: 'Relational database', category: 'Databases', color: '#00758f', glyph: 'My',
    auth: 'Username & password',
    fields: [
      t('host', 'Host', { ...R, ...H, placeholder: 'mysql.company.com' }),
      n('port', 'Port', { ...R, ...H, default: 3306 }),
      t('database', 'Database', { ...R }),
      t('username', 'Username', { ...R, ...H }),
      pw('password', 'Password', { ...H }),
    ],
    advanced: [tog('ssl', 'Use SSL/TLS', { default: true }), t('charset', 'Charset', { default: 'utf8mb4', ...H }), n('timeout', 'Timeout (seconds)', { default: 30, ...H })],
    testInfo: 'MySQL 8.0.36 · 22 tables found',
  },
  {
    id: 'mssql', name: 'Microsoft SQL Server', sub: 'Relational database', category: 'Databases', color: '#cc2927', glyph: 'Ms',
    auth: 'SQL login or Azure AD',
    fields: [
      t('host', 'Server', { ...R, ...H, placeholder: 'sql01.company.com' }),
      n('port', 'Port', { ...R, ...H, default: 1433 }),
      t('database', 'Database', { ...R, ...H }),
      t('schema', 'Schema', { ...H, default: 'dbo' }),
      sel('authMethod', 'Authentication', ['SQL Server login', 'Windows (NTLM)', 'Azure AD service principal']),
      t('username', 'Username', { ...R, ...H, showIf: when('authMethod', ['SQL Server login', 'Windows (NTLM)']) }),
      pw('password', 'Password', { ...H, showIf: when('authMethod', ['SQL Server login', 'Windows (NTLM)']) }),
      t('domain', 'Windows domain', { ...R, showIf: when('authMethod', 'Windows (NTLM)'), placeholder: 'CORP' }),
      t('tenantId', 'Tenant ID', { ...R, showIf: when('authMethod', 'Azure AD service principal'), placeholder: '00000000-0000-0000-0000-000000000000' }),
      t('clientId', 'Client ID', { ...R, ...H, showIf: when('authMethod', 'Azure AD service principal') }),
      pw('clientSecret', 'Client secret', { ...H, showIf: when('authMethod', 'Azure AD service principal') }),
    ],
    advanced: [tog('trustCert', 'Trust server certificate', { default: false }), ...NET],
    testInfo: 'SQL Server 2022 · 41 tables found',
  },
  {
    id: 'oracle', name: 'Oracle', sub: 'Relational database', category: 'Databases', color: '#e0291d', glyph: 'Or',
    auth: 'Username & password',
    fields: [
      t('host', 'Host', { ...R, ...H, placeholder: 'oracle.company.com' }),
      n('port', 'Port', { ...R, ...H, default: 1521 }),
      sel('connectBy', 'Connect using', ['Service name', 'SID']),
      t('serviceName', 'Service name / SID', { ...R, placeholder: 'ORCLPDB1' }),
      t('username', 'Username', { ...R, ...H }),
      pw('password', 'Password', { ...H }),
    ],
    advanced: [...NET],
    testInfo: 'Oracle 19c · 56 tables found',
  },
  {
    id: 'snowflake', name: 'Snowflake', sub: 'Data warehouse', category: 'Databases', color: '#1f9fd0', glyph: 'Sn',
    auth: 'Password, key pair or OAuth',
    fields: [
      t('account', 'Account identifier', { ...R, placeholder: 'xy12345.ap-south-1' }),
      t('warehouse', 'Warehouse', { ...R, ...H, placeholder: 'COMPUTE_WH' }),
      t('role', 'Role', { ...H, placeholder: 'ANALYST' }),
      t('database', 'Database', { ...R, ...H }),
      t('schema', 'Schema', { ...H, default: 'PUBLIC' }),
      sel('authMethod', 'Authentication', ['Username & password', 'Key pair', 'OAuth token']),
      t('username', 'Username', { ...R, ...H, showIf: when('authMethod', ['Username & password', 'Key pair']) }),
      pw('password', 'Password', { ...H, showIf: when('authMethod', 'Username & password') }),
      area('privateKey', 'Private key (PEM)', { showIf: when('authMethod', 'Key pair'), placeholder: '-----BEGIN PRIVATE KEY-----' }),
      pw('passphrase', 'Key passphrase', { required: false, showIf: when('authMethod', 'Key pair') }),
      pw('oauthToken', 'OAuth access token', { showIf: when('authMethod', 'OAuth token') }),
    ],
    advanced: [n('timeout', 'Query timeout (seconds)', { default: 60 })],
    testInfo: 'Snowflake 8.31 · warehouse resumed',
  },
  {
    id: 'redshift', name: 'Amazon Redshift', sub: 'Data warehouse', category: 'Databases', color: '#8c4fff', glyph: 'Rs',
    auth: 'Database user or IAM role',
    fields: [
      t('host', 'Cluster endpoint', { ...R, placeholder: 'cluster.abc123.ap-south-1.redshift.amazonaws.com' }),
      n('port', 'Port', { ...R, ...H, default: 5439 }),
      t('database', 'Database', { ...R, ...H }),
      t('schema', 'Schema', { ...H, default: 'public' }),
      sel('authMethod', 'Authentication', ['Database user', 'IAM role']),
      t('username', 'Username', { ...R, ...H, showIf: when('authMethod', 'Database user') }),
      pw('password', 'Password', { ...H, showIf: when('authMethod', 'Database user') }),
      t('iamRoleArn', 'IAM role ARN', { ...R, showIf: when('authMethod', 'IAM role'), placeholder: 'arn:aws:iam::123456789012:role/qmind-redshift' }),
      t('region', 'AWS region', { ...R, ...H, default: 'ap-south-1', showIf: when('authMethod', 'IAM role') }),
    ],
    advanced: [...NET],
    testInfo: 'Redshift 1.0 · 4 nodes online',
  },
  {
    id: 'bigquery', name: 'BigQuery', sub: 'Data warehouse', category: 'Databases', color: '#4285f4', glyph: 'Bq',
    auth: 'Service account JSON key',
    fields: [
      t('projectId', 'Project ID', { ...R, ...H, placeholder: 'my-gcp-project' }),
      t('dataset', 'Dataset', { ...R, ...H }),
      sel('location', 'Location', ['US', 'EU', 'asia-south1', 'asia-southeast1'], { }),
      area('serviceAccountJson', 'Service account key (JSON)', { placeholder: '{ "type": "service_account", ... }' }),
    ],
    advanced: [n('maxBytes', 'Max bytes billed (GB)', { default: 100 })],
    testInfo: 'BigQuery API reachable · 12 datasets visible',
  },
  {
    id: 'databricks', name: 'Databricks', sub: 'Data lakehouse', category: 'Databases', color: '#e8452c', glyph: 'Db',
    auth: 'Personal access token or OAuth M2M',
    fields: [
      t('workspaceUrl', 'Workspace URL', { ...R, placeholder: 'https://adb-1234567890.12.azuredatabricks.net' }),
      t('httpPath', 'SQL warehouse HTTP path', { ...R, placeholder: '/sql/1.0/warehouses/abc123' }),
      t('catalog', 'Catalog', { ...H, default: 'main' }),
      t('schema', 'Schema', { ...H, default: 'default' }),
      sel('authMethod', 'Authentication', ['Personal access token', 'OAuth M2M']),
      pw('token', 'Access token', { showIf: when('authMethod', 'Personal access token'), placeholder: 'dapi••••••••' }),
      t('clientId', 'Client ID', { ...R, ...H, showIf: when('authMethod', 'OAuth M2M') }),
      pw('clientSecret', 'Client secret', { ...H, showIf: when('authMethod', 'OAuth M2M') }),
    ],
    advanced: [n('timeout', 'Query timeout (seconds)', { default: 120 })],
    testInfo: 'SQL warehouse running · Unity Catalog enabled',
  },
  {
    id: 'mongodb', name: 'MongoDB', sub: 'NoSQL database', category: 'Databases', color: '#13aa52', glyph: 'Mg',
    auth: 'Connection string or credentials',
    fields: [
      sel('connMode', 'Connect with', ['Connection string (SRV)', 'Host & credentials']),
      pw('uri', 'Connection string', { showIf: when('connMode', 'Connection string (SRV)'), placeholder: 'mongodb+srv://user:pass@cluster.mongodb.net' }),
      t('host', 'Host', { ...R, ...H, showIf: when('connMode', 'Host & credentials'), placeholder: 'mongo.company.com' }),
      n('port', 'Port', { ...R, ...H, default: 27017, showIf: when('connMode', 'Host & credentials') }),
      t('username', 'Username', { ...R, ...H, showIf: when('connMode', 'Host & credentials') }),
      pw('password', 'Password', { ...H, showIf: when('connMode', 'Host & credentials') }),
      t('authSource', 'Auth source', { ...H, default: 'admin', showIf: when('connMode', 'Host & credentials') }),
      t('database', 'Database', { ...R, ...H }),
    ],
    advanced: [tog('tls', 'Use TLS', { default: true }), t('replicaSet', 'Replica set', { ...H })],
    testInfo: 'MongoDB 7.0 · 14 collections found',
  },
  {
    id: 'elasticsearch', name: 'Elasticsearch', sub: 'Search and analytics', category: 'Databases', color: '#0ba5c8', glyph: 'Es',
    auth: 'API key or basic auth',
    fields: [
      t('nodeUrl', 'Node URL', { ...R, placeholder: 'https://es.company.com:9200' }),
      sel('authMethod', 'Authentication', ['API key', 'Username & password', 'None']),
      pw('apiKey', 'API key', { showIf: when('authMethod', 'API key') }),
      t('username', 'Username', { ...R, ...H, showIf: when('authMethod', 'Username & password') }),
      pw('password', 'Password', { ...H, showIf: when('authMethod', 'Username & password') }),
      t('indexPattern', 'Index pattern', { ...R, default: 'logs-*' }),
    ],
    advanced: [tog('verifyCerts', 'Verify TLS certificates', { default: true })],
    testInfo: 'Cluster green · 9 indices matched',
  },

  {
    id: 'salesforce', name: 'Salesforce', sub: 'CRM', category: 'SaaS Applications', color: '#00a1e0', glyph: 'SF',
    auth: 'OAuth 2.0 / security token',
    fields: [
      sel('environment', 'Environment', ['Production', 'Sandbox'], { half: true }),
      t('instanceUrl', 'Instance URL', { ...R, ...H, placeholder: 'https://acme.my.salesforce.com' }),
      sel('authFlow', 'Authentication', ['OAuth 2.0 (client credentials)', 'Username + password + security token']),
      t('clientId', 'Consumer key', { ...R, ...H }),
      pw('clientSecret', 'Consumer secret', { ...H }),
      t('username', 'Username', { ...R, ...H, showIf: when('authFlow', 'Username + password + security token') }),
      pw('password', 'Password', { ...H, showIf: when('authFlow', 'Username + password + security token') }),
      pw('securityToken', 'Security token', { showIf: when('authFlow', 'Username + password + security token') }),
    ],
    advanced: [t('apiVersion', 'API version', { default: 'v60.0', ...H }), tog('bulkApi', 'Use Bulk API 2.0', { default: true })],
    testInfo: 'Org authorised · 214 objects visible',
  },
  {
    id: 'sap', name: 'SAP', sub: 'ERP', category: 'SaaS Applications', color: '#0f8fd8', glyph: 'SAP',
    auth: 'Application server login or OData',
    fields: [
      sel('connType', 'Connect via', ['Application server', 'OData service']),
      t('host', 'Application server host', { ...R, ...H, showIf: when('connType', 'Application server'), placeholder: 'sap-app01.company.com' }),
      t('systemNumber', 'System number', { ...R, ...H, default: '00', showIf: when('connType', 'Application server') }),
      t('client', 'Client', { ...R, ...H, default: '100', showIf: when('connType', 'Application server') }),
      t('language', 'Language', { ...H, default: 'EN', showIf: when('connType', 'Application server') }),
      t('serviceUrl', 'OData service URL', { ...R, showIf: when('connType', 'OData service'), placeholder: 'https://sap.company.com/sap/opu/odata/sap/API_SALES_ORDER_SRV' }),
      t('username', 'Username', { ...R, ...H }),
      pw('password', 'Password', { ...H }),
    ],
    advanced: [tog('useSnc', 'Use SNC encryption', { default: false })],
    testInfo: 'SAP S/4HANA 2023 · RFC ping OK',
  },
  {
    id: 'dynamics', name: 'Microsoft Dynamics 365', sub: 'ERP/CRM', category: 'SaaS Applications', color: '#2b579a', glyph: 'D3',
    auth: 'Azure AD app registration',
    fields: [
      t('environmentUrl', 'Environment URL', { ...R, placeholder: 'https://org.crm.dynamics.com' }),
      t('tenantId', 'Tenant ID', { ...R, placeholder: '00000000-0000-0000-0000-000000000000' }),
      t('clientId', 'Application (client) ID', { ...R, ...H }),
      pw('clientSecret', 'Client secret', { ...H }),
    ],
    advanced: [t('apiVersion', 'Web API version', { default: 'v9.2' })],
    testInfo: 'Dataverse reachable · 87 tables visible',
  },
  {
    id: 'servicenow', name: 'ServiceNow', sub: 'IT service management', category: 'SaaS Applications', color: '#3fae2a', glyph: 'Now',
    auth: 'Basic auth or OAuth 2.0',
    fields: [
      t('instanceUrl', 'Instance URL', { ...R, placeholder: 'https://company.service-now.com' }),
      sel('authMethod', 'Authentication', ['Basic auth', 'OAuth 2.0']),
      t('username', 'Username', { ...R, ...H }),
      pw('password', 'Password', { ...H }),
      t('clientId', 'OAuth client ID', { ...R, ...H, showIf: when('authMethod', 'OAuth 2.0') }),
      pw('clientSecret', 'OAuth client secret', { ...H, showIf: when('authMethod', 'OAuth 2.0') }),
    ],
    advanced: [t('tables', 'Tables to sync', { default: 'incident, change_request, problem' })],
    testInfo: 'Instance reachable · Table API enabled',
  },
  {
    id: 'ga', name: 'Google Analytics', sub: 'Web analytics', category: 'SaaS Applications', color: '#f29900', glyph: 'GA',
    auth: 'Service account JSON key',
    fields: [
      t('propertyId', 'GA4 property ID', { ...R, ...H, placeholder: '412887120' }),
      t('startDate', 'Start date', { ...H, default: '2024-01-01' }),
      area('serviceAccountJson', 'Service account key (JSON)', { placeholder: '{ "type": "service_account", ... }' }),
    ],
    advanced: [t('dimensions', 'Default dimensions', { default: 'date, country, sessionSource' })],
    testInfo: 'GA4 Data API reachable · property verified',
  },

  {
    id: 'excel', name: 'Excel / CSV', sub: 'Files and spreadsheets', category: 'Files & Storage', color: '#1d7a4a', glyph: 'Xl',
    auth: 'File upload',
    fields: [
      file('file', 'Upload file', '.xlsx,.xls,.csv,.tsv', { ...R }),
      t('sheetName', 'Sheet name', { ...H, placeholder: 'Sheet1 (Excel only)' }),
      sel('delimiter', 'Delimiter', [',', ';', 'Tab', '|'], { half: true }),
      tog('hasHeader', 'First row contains column names', { default: true }),
    ],
    advanced: [sel('encoding', 'Encoding', ['UTF-8', 'UTF-16', 'ISO-8859-1'])],
    testInfo: 'File parsed · header row detected',
  },
  {
    id: 'parquet', name: 'Parquet', sub: 'Data files', category: 'Files & Storage', color: '#3b8fd9', glyph: 'Pq',
    auth: 'File upload or object-store path',
    fields: [
      sel('source', 'Read from', ['Upload file', 'Amazon S3 path', 'Azure path', 'HTTPS URL']),
      file('file', 'Parquet file', '.parquet', { ...R, showIf: when('source', 'Upload file') }),
      t('path', 'Path / URL', { ...R, showIf: when('source', ['Amazon S3 path', 'Azure path', 'HTTPS URL']), placeholder: 's3://bucket/folder/*.parquet' }),
      t('accessKeyId', 'Access key ID', { ...R, ...H, showIf: when('source', 'Amazon S3 path') }),
      pw('secretAccessKey', 'Secret access key', { ...H, showIf: when('source', 'Amazon S3 path') }),
      pw('sasToken', 'SAS token', { showIf: when('source', 'Azure path') }),
    ],
    advanced: [tog('mergeSchemas', 'Merge schemas across files', { default: false })],
    testInfo: 'Schema read · 3 row groups',
  },
  {
    id: 's3', name: 'Amazon S3', sub: 'Object storage', category: 'Files & Storage', color: '#d9452f', glyph: 'S3',
    auth: 'Access keys or IAM role',
    fields: [
      sel('authMethod', 'Authentication', ['Access key', 'IAM role ARN']),
      t('accessKeyId', 'Access key ID', { ...R, ...H, showIf: when('authMethod', 'Access key'), placeholder: 'AKIA••••••••••••' }),
      pw('secretAccessKey', 'Secret access key', { ...H, showIf: when('authMethod', 'Access key') }),
      t('roleArn', 'Role ARN', { ...R, showIf: when('authMethod', 'IAM role ARN'), placeholder: 'arn:aws:iam::123456789012:role/qmind-s3' }),
      t('region', 'Region', { ...R, ...H, default: 'ap-south-1' }),
      t('bucket', 'Bucket', { ...R, ...H }),
      t('prefix', 'Folder prefix', { ...H, placeholder: 'exports/2026/' }),
      sel('fileFormat', 'File format', ['CSV', 'JSON', 'Parquet'], { half: true }),
    ],
    advanced: [t('endpoint', 'Custom endpoint (S3-compatible)', { placeholder: 'https://minio.company.com' })],
    testInfo: 'Bucket reachable · list permission OK',
  },
  {
    id: 'azureblob', name: 'Azure Blob Storage', sub: 'Object storage', category: 'Files & Storage', color: '#0a7cd6', glyph: 'Az',
    auth: 'Account key, SAS, connection string or service principal',
    fields: [
      t('accountName', 'Storage account', { ...R, ...H }),
      t('container', 'Container', { ...R, ...H }),
      sel('authMethod', 'Authentication', ['Account key', 'SAS token', 'Connection string', 'Service principal']),
      pw('accountKey', 'Account key', { showIf: when('authMethod', 'Account key') }),
      pw('sasToken', 'SAS token', { showIf: when('authMethod', 'SAS token'), placeholder: '?sv=2024-…' }),
      pw('connectionString', 'Connection string', { showIf: when('authMethod', 'Connection string') }),
      t('tenantId', 'Tenant ID', { ...R, showIf: when('authMethod', 'Service principal') }),
      t('clientId', 'Client ID', { ...R, ...H, showIf: when('authMethod', 'Service principal') }),
      pw('clientSecret', 'Client secret', { ...H, showIf: when('authMethod', 'Service principal') }),
      t('prefix', 'Folder prefix', { placeholder: 'landing/' }),
    ],
    advanced: [],
    testInfo: 'Container reachable · 128 blobs listed',
  },

  {
    id: 'rest', name: 'REST API', sub: 'Custom APIs', category: 'APIs', color: '#7c4dff', glyph: 'API',
    auth: 'None, API key, Bearer, Basic or OAuth 2.0',
    fields: [
      t('baseUrl', 'Base URL', { ...R, placeholder: 'https://api.company.com/v1' }),
      sel('authType', 'Authentication', ['None', 'API key', 'Bearer token', 'Basic auth', 'OAuth 2.0 client credentials']),
      t('apiKeyName', 'Key name', { ...R, ...H, default: 'X-API-Key', showIf: when('authType', 'API key') }),
      sel('apiKeyIn', 'Send key in', ['Header', 'Query string'], { half: true, showIf: when('authType', 'API key') }),
      pw('apiKey', 'API key', { showIf: when('authType', 'API key') }),
      pw('bearerToken', 'Bearer token', { showIf: when('authType', 'Bearer token') }),
      t('username', 'Username', { ...R, ...H, showIf: when('authType', 'Basic auth') }),
      pw('password', 'Password', { ...H, showIf: when('authType', 'Basic auth') }),
      t('tokenUrl', 'Token URL', { ...R, showIf: when('authType', 'OAuth 2.0 client credentials'), placeholder: 'https://auth.company.com/oauth/token' }),
      t('clientId', 'Client ID', { ...R, ...H, showIf: when('authType', 'OAuth 2.0 client credentials') }),
      pw('clientSecret', 'Client secret', { ...H, showIf: when('authType', 'OAuth 2.0 client credentials') }),
      t('scope', 'Scope', { showIf: when('authType', 'OAuth 2.0 client credentials'), placeholder: 'read:data' }),
    ],
    advanced: [
      t('healthPath', 'Health check path', { default: '/health', ...H }),
      sel('pagination', 'Pagination', ['None', 'Page number', 'Cursor', 'Link header'], { half: true }),
      { key: 'headers', label: 'Extra headers (one per line)', type: 'textarea', placeholder: 'Accept: application/json' },
    ],
    testInfo: 'GET /health returned 200 OK',
  },

  {
    id: 'kafka', name: 'Apache Kafka', sub: 'Event streaming', category: 'Streaming', color: '#566178', glyph: 'Kf',
    auth: 'SASL, TLS or none',
    fields: [
      t('bootstrap', 'Bootstrap servers', { ...R, placeholder: 'broker1:9092,broker2:9092' }),
      sel('protocol', 'Security protocol', ['PLAINTEXT', 'SSL', 'SASL_SSL']),
      sel('mechanism', 'SASL mechanism', ['PLAIN', 'SCRAM-SHA-256', 'SCRAM-SHA-512'], { showIf: when('protocol', 'SASL_SSL') }),
      t('username', 'Username / API key', { ...R, ...H, showIf: when('protocol', 'SASL_SSL') }),
      pw('password', 'Password / API secret', { ...H, showIf: when('protocol', 'SASL_SSL') }),
      t('topic', 'Topic', { ...R, ...H, placeholder: 'orders.events' }),
      t('groupId', 'Consumer group', { ...H, default: 'qmind-ingest' }),
    ],
    advanced: [t('registryUrl', 'Schema registry URL', { placeholder: 'https://registry.company.com' })],
    testInfo: 'Broker metadata fetched · 3 partitions',
  },
  {
    id: 'kinesis', name: 'Amazon Kinesis', sub: 'Real-time streams', category: 'Streaming', color: '#c9791a', glyph: 'Ki',
    auth: 'Access keys',
    fields: [
      t('accessKeyId', 'Access key ID', { ...R, ...H, placeholder: 'AKIA••••••••••••' }),
      pw('secretAccessKey', 'Secret access key', { ...H }),
      t('region', 'Region', { ...R, ...H, default: 'ap-south-1' }),
      t('streamName', 'Stream name', { ...R, ...H }),
      sel('startPosition', 'Start position', ['LATEST', 'TRIM_HORIZON']),
    ],
    advanced: [],
    testInfo: 'Stream ACTIVE · 2 shards',
  },
]

export const getConnector = (id) => CONNECTORS.find((c) => c.id === id)

export const GROUP_OF = {
  Databases: 'Databases',
  'SaaS Applications': 'SaaS',
  'Files & Storage': 'Files',
  APIs: 'Other',
  Streaming: 'Other',
}

// Sample metadata shown in the Schema tab of a saved connection.
export const SAMPLE_TABLES = {
  Databases: [['customers', 18], ['orders', 24], ['order_items', 12], ['products', 16], ['payments', 14], ['regions', 6]],
  'SaaS Applications': [['Account', 62], ['Opportunity', 48], ['Lead', 40], ['Contact', 35], ['Campaign', 22]],
  'Files & Storage': [['sheet_1', 14], ['sheet_2', 9], ['lookup', 4]],
  APIs: [['resources', 11], ['events', 9]],
  Streaming: [['events', 12], ['dead_letter', 5]],
}
