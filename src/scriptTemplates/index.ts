import { MigrationProfile, MigrationScript } from "../lib/profileManager";
import profileManager from "../lib/profileManager";
import personsScriptGenerator from "./persons";

export interface ScriptGenerator {
    scriptName: string,
    generate: (migrationProfile: MigrationProfile) => MigrationScript
}

export const scriptGenerators: ScriptGenerator[] = [
    personsScriptGenerator
]

/**
 * Generate and save missing scripts for a given migration profile.
 * @param migrationProfile 
 */
export async function generateMissingScripts(migrationProfile: MigrationProfile): Promise<void> {
    for(const generator of scriptGenerators) {
        if(await profileManager.getProfileScript(migrationProfile.name, generator.scriptName) === undefined) {
            const script = generator.generate(migrationProfile);
            await profileManager.saveProfileScript(script);
        }
    }
}