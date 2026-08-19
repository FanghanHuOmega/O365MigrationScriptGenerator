import { MigrationProfile, WorkflowMigrationConfig, MigrationScript } from "../lib/profileManager";
import { ScriptGenerator } from "./index";

export const SCRIPT_NAME = "persons";

const generator: ScriptGenerator = {
    scriptName: SCRIPT_NAME,
    generate: (migrationProfile: MigrationProfile): MigrationScript => {
        const config = migrationProfile.config as WorkflowMigrationConfig;
        const { sourceDB, targetDB, baseTable, workflowType } = config;

        return {
            profileName: migrationProfile.name,
            scriptName: SCRIPT_NAME,
            script: `--sql 
                -- General Person Migration Script for ${migrationProfile.name}
                -- Generated on ${new Date().toISOString()}
                SELECT TOP 100 * FROM ${sourceDB}.dbo.${baseTable} AS BT
                WHERE BT.WorkflowType = '${workflowType}';
            `
        }
    }
}

export default generator;