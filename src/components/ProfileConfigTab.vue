<template>
	<InputDialog ref="newProfileDialog" title="Create a new Profile" 
		:fields="[{ name: 'ProfileName', type: 'text', placeholder: 'e.g. MyProfile' }]" 
		:callback="createNewProfile" 
	/>
	<InputDialog ref="renameProfileDialog" title="Rename Profile" 
		:fields="[{ name: 'NewProfileName', type: 'text', placeholder: 'e.g. MyProfile' }]" 
		:callback="renameProfile" 
	/>
	<InputDialog ref="revisionDialog" title="Add applicable revision" 
		:fields="[{ name: 'Revision', type: 'number', placeholder: 'e.g. 1' }]" 
		:callback="addRevisionValue" 
	/>
	<InputDialog ref="stepMappingDialog" title="Add step mapping" 
		:fields="[
			{ name: 'r4Step', type: 'number', placeholder: 'e.g. 1' },
			{ name: 'o365Step', type: 'number', placeholder: 'e.g. 1' }
		]" 
		:callback="addStepMappingValue" 
	/>
	<InputDialog ref="roleMappingDialog" title="Add role mapping" 
		:fields="[
			{ name: 'r4RoleCode', type: 'text', placeholder: 'e.g. OWNER' },
			{ name: 'o365RoleID', type: 'number', placeholder: 'e.g. 1' }
		]" 
		:callback="addRoleMappingValue" 
	/>
	<InputDialog ref="signatureMappingDialog" title="Add signature mapping" 
		:fields="[
			{ name: 'r4Step', type: 'number', placeholder: 'e.g. 1' },
			{ name: 'o365Step', type: 'number', placeholder: 'e.g. 1' },
			{ name: 'r4RoleCode', type: 'text', placeholder: 'e.g. OWNER' },
			{ name: 'migrateAs', type: 'text', defaultValue: 'step responsible', placeholder: 'step responsible, verification, review, or comment' }
		]" 
		:callback="addSignatureMappingValue" 
	/>
	<InputDialog ref="metadataMappingDialog" title="Add metadata mapping" 
		:fields="[
			{ name: 'r4FieldName', type: 'text', placeholder: 'e.g. PersonID' },
			{ name: 'o365FieldName', type: 'text', placeholder: 'e.g. ExternalID' }
		]" 
		:callback="addMetadataMappingValue" 
	/>

	<form class="profile-config pt-3" @submit.prevent>
		<Transition>
			<div v-if="showSavedToast" class="profile-saved-toast text-success" role="status">
				<i class="bi bi-floppy-fill"></i> Changes saved
			</div>
		</Transition>
		<div class="d-flex flex-wrap align-items-end gap-3 border-bottom pb-3 mb-4">
			<div class="flex-grow-1" style="min-width: 220px;">
				<label for="profileSelect" class="form-label">Switch profile</label>
				<select id="profileSelect" v-model="selectedProfileName" class="form-select" @change="switchProfile">
					<option v-for="savedProfile in profileList" :key="savedProfile.name" :value="savedProfile.name">{{ savedProfile.name }}</option>
				</select>
			</div>
			<button type="button" class="btn btn-primary" @click="newProfileDialog?.modal.show">
				New Profile <i class="bi bi-plus-lg"></i>
			</button>
			<button type="button" class="btn btn-primary" @click="renameProfileDialog?.modal.show">
				Rename Profile <i class="bi bi-pencil-fill"></i>
			</button>
			<button type="button" class="btn btn-danger" @click="deleteProfile">
				Delete Profile <i class="bi bi-trash-fill"></i>
			</button>
			<button type="button" class="btn btn-primary" @click="generateScripts">Generate scripts</button>
		</div>

		<div class="row g-3">
			<div class="col-md-6"><label for="sourceDb" class="form-label">Source database</label><input id="sourceDb" v-model="config.sourceDB" class="form-control" type="text" @change="saveProfile" /></div>
			<div class="col-md-6"><label for="targetDb" class="form-label">Target database</label><input id="targetDb" v-model="config.targetDB" class="form-control" type="text" @change="saveProfile" /></div>
			<div class="col-md-6"><label for="workflowType" class="form-label">Workflow type</label><input id="workflowType" v-model="config.workflowType" class="form-control" type="text" @change="saveProfile" /></div>
			<div class="col-md-6"><label for="processId" class="form-label">Process ID</label><input id="processId" v-model.number="config.processID" class="form-control" type="number" @change="saveProfile" /></div>
			<div class="col-md-8"><label for="baseTable" class="form-label">Base table</label><input id="baseTable" v-model="config.baseTable" class="form-control" type="text" @change="saveProfile" /></div>
			<div class="col-md-4 d-flex align-items-end"><div class="form-check mb-2"><input id="syncExisting" v-model="config.syncExisting" class="form-check-input" type="checkbox" @change="saveProfile" /><label for="syncExisting" class="form-check-label">Sync existing records</label></div></div>
		</div>

		<div class="mt-4">
			<MappingTable title="Applicable revisions" :columns="['Revision']" :rows="config.applicableRevisions" @add="revisionDialog?.modal.show" @remove="removeRevision">
                <template #row="{ index }">
                    <td><input v-model.number="config.applicableRevisions[index]" class="form-control form-control-sm" type="number" /></td>
                </template>
            </MappingTable>
            <MappingTable title="Step mappings" :columns="['R4 step', 'O365 step']" :rows="config.stepsMapping" @add="stepMappingDialog?.modal.show" @remove="removeStepMapping">
                <template #row="{ row }">
                    <td><input v-model.number="row.r4Step" class="form-control form-control-sm" type="number" /></td>
                    <td><input v-model.number="row.o365Step" class="form-control form-control-sm" type="number" /></td>
                </template>
            </MappingTable>
            <MappingTable title="Role mappings" :columns="['R4 role code', 'O365 role ID']" :rows="config.rolesMapping" @add="roleMappingDialog?.modal.show" @remove="removeRoleMapping">
                <template #row="{ row }">
                    <td><input v-model="row.r4RoleCode" class="form-control form-control-sm" type="text" /></td>
                    <td><input v-model="row.o365RoleID" class="form-control form-control-sm" type="text" /></td>
                </template>
            </MappingTable>
            <MappingTable title="Signature mappings" :columns="['R4 step', 'O365 step', 'R4 role code', 'Migrate as']" :rows="config.signaturesMapping" @add="signatureMappingDialog?.modal.show" @remove="removeSignatureMapping">
                <template #row="{ row }">
                    <td><input v-model.number="row.r4Step" class="form-control form-control-sm" type="number" /></td>
                    <td><input v-model.number="row.o365Step" class="form-control form-control-sm" type="number" /></td>
                    <td><input v-model="row.r4RoleCode" class="form-control form-control-sm" type="text" /></td>
                    <td>
						<select v-model="row.migrateAs" class="form-select form-select-sm">
                            <option>step responsible</option>
                            <option>verification</option>
                            <option>review</option>
                            <option>comment</option>
                        </select>
					</td>
                </template>
            </MappingTable>
            <MappingTable title="Metadata mappings" :columns="['R4 field name', 'O365 field name']" :rows="config.metadataMapping" @add="metadataMappingDialog?.modal.show" @remove="removeMetadataMapping">
                <template #row="{ row }">
                    <td><input v-model="row.r4FieldName" class="form-control form-control-sm" type="text" /></td>
                    <td><input v-model="row.o365FieldName" class="form-control form-control-sm" type="text" /></td>
                </template>
            </MappingTable>
    
		</div>
	</form>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, toRaw, watch, type Ref } from 'vue'
import InputDialog from './InputDialog.vue'
import MappingTable from './MappingTable.vue'
import profileManager, { WorkflowMigrationConfig, type MigrationProfile } from '../lib/profileManager'
import { generateMissingScripts } from '../scriptTemplates'

const DEFAULT_PROFILE_NAME = 'New Profile'

function createDefaultConfig() {
	return { 
		sourceDB: '', 
		targetDB: '', 
		syncExisting: false, 
		workflowType: '', 
		processID: 0, 
		baseTable: '', 
		applicableRevisions: [], 
		stepsMapping: [], 
		rolesMapping: [], 
		signaturesMapping: [], 
		metadataMapping: [] 
	}
}

const profileList: Ref<MigrationProfile[]> = ref([])
const selectedProfileName = ref('')
const config: Ref<WorkflowMigrationConfig> = ref(createDefaultConfig());
const profile = computed(() => ({ name: selectedProfileName.value, config: toRaw(config.value) }));
const showSavedToast = ref(false)

type DialogRef = { modal: { show: () => void } }
const renameProfileDialog = ref<DialogRef | null>(null)
const newProfileDialog = ref<DialogRef | null>(null)
const revisionDialog = ref<DialogRef | null>(null)
const stepMappingDialog = ref<DialogRef | null>(null)
const roleMappingDialog = ref<DialogRef | null>(null)
const signatureMappingDialog = ref<DialogRef | null>(null)
const metadataMappingDialog = ref<DialogRef | null>(null)

let cancelPreviousSave: (() => void) | null = null;

onMounted(async () => {
	profileList.value = await profileManager.getProfiles();
	loadFirstProfileOrCreateDefault();
})

async function loadFirstProfileOrCreateDefault() {
	if (profileList.value.length > 0) {
		selectedProfileName.value = profileList.value[0].name
		await switchProfile()
	} else {
		selectedProfileName.value = DEFAULT_PROFILE_NAME
		await profileManager.saveProfile({ name: DEFAULT_PROFILE_NAME, config: createDefaultConfig() })
		profileList.value = await profileManager.getProfiles();
	}
}

async function switchProfile() {
	config.value = (await profileManager.getProfile(selectedProfileName.value))?.config ?? createDefaultConfig();
}

/**
 * save profile to IndexedDB, with a debounce of 500ms to avoid saving too frequently
 */
function saveProfile(): Promise<void> {
	if(cancelPreviousSave) {
		cancelPreviousSave();
		cancelPreviousSave = null;
	}

	return new Promise<void>((resolve, reject) => {
		const saveTimeout = setTimeout(async () => {
			await profileManager.saveProfile(profile.value);
			showSavedToast.value = true;
			setTimeout(() => showSavedToast.value = false, 2000);
			resolve();
		}, 500);

		cancelPreviousSave = () => {
			clearTimeout(saveTimeout);
			reject();
		};
	});
}

async function createNewProfile(values: any) {
	if (values.ProfileName) {
		selectedProfileName.value = String(values.ProfileName);
		config.value = createDefaultConfig();
		await saveProfile();
		profileList.value = await profileManager.getProfiles();
	}
}

async function renameProfile(values: any) {
	const newName = String(values.NewProfileName);
	if (newName && newName !== selectedProfileName.value) {
		// delete the old profile
		await profileManager.deleteProfile(selectedProfileName.value);

		//find all scripts associated with the old profile and rename them to the new profile name
		const scripts = await profileManager.getProfileScripts(selectedProfileName.value);
		for(const script of scripts) {
			await profileManager.saveProfileScript({ ...script, profileName: newName });
			await profileManager.deleteProfileScript(selectedProfileName.value, script.scriptName);
		}
		
		//save profile with the new name
		selectedProfileName.value = newName;
		await saveProfile();
		profileList.value = await profileManager.getProfiles();
	}
}

async function deleteProfile() {
	const result = confirm(`Are you sure you want to delete the profile "${selectedProfileName.value}"? This action cannot be undone.`)
	if (result) {
		await profileManager.deleteProfile(selectedProfileName.value);
		profileList.value = await profileManager.getProfiles();
		await loadFirstProfileOrCreateDefault();
	}
}

async function generateScripts() {
	await generateMissingScripts(profile.value);
	await saveProfile();
}

function addRevisionValue(values: any) {
	const revision = Number(values.Revision)
	if (Number.isInteger(revision)) {
		config.value.applicableRevisions.push(revision);
		saveProfile();
	}
}

function addStepMappingValue(values: any) {
	const r4Step = Number(values.r4Step)
	const o365Step = Number(values.o365Step)
	if (Number.isInteger(r4Step) && Number.isInteger(o365Step)) {
		config.value.stepsMapping.push({ r4Step, o365Step });
		saveProfile();
	}
}

function addRoleMappingValue(values: any) {
	const r4RoleCode = String(values.r4RoleCode ?? '')
	const o365RoleID = String(values.o365RoleID ?? '')
	if (r4RoleCode && o365RoleID) {
		config.value.rolesMapping.push({ r4RoleCode, o365RoleID });
		saveProfile();
	}
}

function addSignatureMappingValue(values: any) {
	const r4Step = Number(values.r4Step)
	const o365Step = Number(values.o365Step)
	const r4RoleCode = String(values.r4RoleCode ?? '')
	const migrateAs = String(values.migrateAs ?? '') as 'step responsible' | 'verification' | 'review' | 'comment'
	const validMigrateAs = ['step responsible', 'verification', 'review', 'comment'].includes(migrateAs)
	if (Number.isInteger(r4Step) && Number.isInteger(o365Step) && r4RoleCode && validMigrateAs) {
		config.value.signaturesMapping.push({ r4Step, o365Step, r4RoleCode, migrateAs });
		saveProfile();
	}
}

function addMetadataMappingValue(values: any) {
	const r4FieldName = String(values.r4FieldName ?? '').trim()
	const o365FieldName = String(values.o365FieldName ?? '').trim()
	if (r4FieldName && o365FieldName) {
		config.value.metadataMapping.push({ r4FieldName, o365FieldName });
		saveProfile();
	}
}
function removeRevision(index:number) { config.value.applicableRevisions.splice(index, 1); saveProfile(); }
function removeStepMapping(index:number) { config.value.stepsMapping.splice(index, 1); saveProfile(); }
function removeRoleMapping(index:number) { config.value.rolesMapping.splice(index, 1); saveProfile(); }
function removeSignatureMapping(index:number) { config.value.signaturesMapping.splice(index, 1); saveProfile(); }
function removeMetadataMapping(index:number) { config.value.metadataMapping.splice(index, 1); saveProfile(); }

</script>

<style scoped>
.profile-saved-toast {
	position: absolute;
	top: 1.5rem;
	right: 1.5rem;
	z-index: 1055;
	margin: 0;
}

.v-enter-active, .v-leave-active {
	transition: opacity 0.2s;
}
.v-enter-from, .v-leave-to {
	opacity: 0;
}

</style>
