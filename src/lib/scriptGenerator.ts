export interface MigrationConfig {
  SourceDB: string
  TargetDB: string
  WorkflowType: string
  ProcessID: number
}

type ConfigInput = Partial<MigrationConfig> & {
  ProcessID?: number | string
}

function escapeSql(value: unknown) {
  return String(value ?? '').replace(/'/g, "''")
}

export function normalizeConfig(config: ConfigInput): MigrationConfig {
  const processId = Number.parseInt(String(config.ProcessID ?? 0), 10)

  return {
    SourceDB: String(config.SourceDB ?? ''),
    TargetDB: String(config.TargetDB ?? ''),
    WorkflowType: String(config.WorkflowType ?? ''),
    ProcessID: Number.isFinite(processId) ? processId : 0
  }
}

export function generateMigrationScript(configInput: ConfigInput) {
  const config = normalizeConfig(configInput)

  return `-- Omega 365 Migration Script
-- Generated: ${new Date().toISOString()}

DECLARE @SourceDB NVARCHAR(128) = N'${escapeSql(config.SourceDB)}';
DECLARE @TargetDB NVARCHAR(128) = N'${escapeSql(config.TargetDB)}';
DECLARE @WorkflowType NVARCHAR(100) = N'${escapeSql(config.WorkflowType)}';
DECLARE @ProcessID INT = ${config.ProcessID};

PRINT 'Starting migration script';
PRINT 'SourceDB: ' + @SourceDB;
PRINT 'TargetDB: ' + @TargetDB;
PRINT 'WorkflowType: ' + @WorkflowType;
PRINT 'ProcessID: ' + CAST(@ProcessID AS NVARCHAR(20));

-- TODO: Add migration operations below.
`
}