import { MigrationProfile, WorkflowMigrationConfig, MigrationScript } from "../lib/profileManager";
import { ScriptGenerator } from "./index";

export const SCRIPT_NAME = "files.sql";

const generator: ScriptGenerator = {
    scriptName: SCRIPT_NAME,
    generate: (migrationProfile: MigrationProfile): MigrationScript => {
        const config = migrationProfile.config as WorkflowMigrationConfig;
        const { sourceDB, targetDB, baseTable, workflowType } = config;

        let script = 
`--sql
-- General Files Migration Script for ${migrationProfile.name}
-- Generated on ${new Date().toISOString()}
SELECT TOP 100 * FROM ${sourceDB}.dbo.${baseTable} AS BT
WHERE BT.WorkflowType = '${workflowType}';
`

        return {
            profileName: migrationProfile.name,
            scriptName: SCRIPT_NAME,
            script: script
        }
    }
}

export default generator;