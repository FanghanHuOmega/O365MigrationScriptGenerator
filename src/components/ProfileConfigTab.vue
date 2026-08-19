<template>
	<Transition>
		<div v-if="showSavedToast" class="profile-saved-toast alert alert-success shadow-sm" role="status">
			Profile saved
		</div>
	</Transition>

	<form class="profile-config pt-3" @submit.prevent>
		<div class="d-flex flex-wrap align-items-end gap-3 border-bottom pb-3 mb-4">
			<div class="flex-grow-1">
				<label for="profileName" class="form-label">Current profile</label>
				<input id="profileName" v-model="profile.name" class="form-control" type="text" @change="saveProfile" />
			</div>
			<div style="min-width: 220px;">
				<label for="profileSelect" class="form-label">Switch profile</label>
				<select id="profileSelect" v-model="selectedProfileName" class="form-select" @change="switchProfile">
					<option v-for="savedProfile in profiles" :key="savedProfile.name" :value="savedProfile.name">{{ savedProfile.name }}</option>
				</select>
			</div>
			<button type="button" class="btn btn-primary" @click="generateScripts">Generate scripts</button>
		</div>

		<div class="row g-3">
			<div class="col-md-6"><label for="sourceDb" class="form-label">Source database</label><input id="sourceDb" v-model="profile.config.sourceDB" class="form-control" type="text" /></div>
			<div class="col-md-6"><label for="targetDb" class="form-label">Target database</label><input id="targetDb" v-model="profile.config.targetDB" class="form-control" type="text" /></div>
			<div class="col-md-6"><label for="workflowType" class="form-label">Workflow type</label><input id="workflowType" v-model="profile.config.workflowType" class="form-control" type="text" /></div>
			<div class="col-md-6"><label for="processId" class="form-label">Process ID</label><input id="processId" v-model.number="profile.config.processID" class="form-control" type="number" /></div>
			<div class="col-md-8"><label for="baseTable" class="form-label">Base table</label><input id="baseTable" v-model="profile.config.baseTable" class="form-control" type="text" /></div>
			<div class="col-md-4 d-flex align-items-end"><div class="form-check mb-2"><input id="syncExisting" v-model="profile.config.syncExisting" class="form-check-input" type="checkbox" /><label for="syncExisting" class="form-check-label">Sync existing records</label></div></div>
		</div>

		<div class="mt-4">
			<MappingTable title="Applicable revisions" :columns="['Revision']" :rows="profile.config.applicableRevisions" @add="addRevision" @remove="removeRevision">
                <template #row="{ index }">
                    <td><input v-model.number="profile.config.applicableRevisions[index]" class="form-control form-control-sm" type="number" /></td>
                </template>
            </MappingTable>
            <MappingTable title="Step mappings" :columns="['R4 step', 'O365 step']" :rows="profile.config.stepsMapping" @add="addStepMapping" @remove="removeStepMapping">
                <template #row="{ row }">
                    <td><input v-model.number="row.r4Step" class="form-control form-control-sm" type="number" /></td>
                    <td><input v-model.number="row.o365Step" class="form-control form-control-sm" type="number" /></td>
                </template>
            </MappingTable>
            <MappingTable title="Role mappings" :columns="['R4 role code', 'O365 role ID']" :rows="profile.config.rolesMapping" @add="addRoleMapping" @remove="removeRoleMapping">
                <template #row="{ row }">
                    <td><input v-model="row.r4RoleCode" class="form-control form-control-sm" type="text" /></td>
                    <td><input v-model.number="row.o365RoleID" class="form-control form-control-sm" type="number" /></td>
                </template>
            </MappingTable>
            <MappingTable title="Signature mappings" :columns="['R4 step', 'O365 step', 'R4 role code', 'Migrate as']" :rows="profile.config.signaturesMapping" @add="addSignatureMapping" @remove="removeSignatureMapping">
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
            <MappingTable title="Metadata mappings" :columns="['R4 field name', 'O365 field name']" :rows="profile.config.metadataMapping" @add="addMetadataMapping" @remove="removeMetadataMapping">
                <template #row="{ row }">
                    <td><input v-model="row.r4FieldName" class="form-control form-control-sm" type="text" /></td>
                    <td><input v-model="row.o365FieldName" class="form-control form-control-sm" type="text" /></td>
                </template>
            </MappingTable>
    
		</div>
	</form>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, toRaw, watch, type Ref } from 'vue'
import MappingTable from './MappingTable.vue'
import profileManager, { type MigrationProfile } from '../lib/profileManager'
import { generateMissingScripts } from '../scriptTemplates'

const DEFAULT_PROFILE_NAME = 'New Profile'
const emit = defineEmits(['profile-changed'])

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

const profiles: Ref<MigrationProfile[]> = ref([])
const selectedProfileName = ref('')
const profile = reactive<MigrationProfile>({ name: DEFAULT_PROFILE_NAME, config: createDefaultConfig() })
const showSavedToast = ref(false)
let persistedProfileName = ''
let saveInProgress = false
let saveDebounceTimer:number|undefined;
let toastTimer:number|undefined

async function saveProfile() {
	const profileName = profile.name || DEFAULT_PROFILE_NAME
	profile.name = profileName
	if (saveInProgress) return

	saveInProgress = true
	try {
		if (persistedProfileName && persistedProfileName !== profileName) await profileManager.deleteProfile(persistedProfileName)
		const profileToSave = structuredClone(toRaw(profile))
		profileToSave.name = profileName
		await profileManager.saveProfile(profileToSave)
		persistedProfileName = profileName
		selectedProfileName.value = profileName
		profiles.value = await profileManager.getProfiles()
		emit('profile-changed', profile)
	} finally {
		saveInProgress = false
	}
}

async function switchProfile() {
	const selectedProfile = profiles.value.find(({ name }) => name === selectedProfileName.value)
	if (!selectedProfile) return
	profile.name = selectedProfile.name
	Object.assign(profile.config, createDefaultConfig(), selectedProfile.config)
	persistedProfileName = selectedProfile.name
	emit('profile-changed', profile)
}

async function generateScripts() {
	await saveProfile()
	await generateMissingScripts(profile)
}

function addRevision() { /* TODO: Open the add-revision dialog component here. */ }
function addStepMapping() { /* TODO: Open the add-step-mapping dialog component here. */ }
function addRoleMapping() { /* TODO: Open the add-role-mapping dialog component here. */ }
function addSignatureMapping() { /* TODO: Open the add-signature-mapping dialog component here. */ }
function addMetadataMapping() { /* TODO: Open the add-metadata-mapping dialog component here. */ }
function removeRevision(index:number) { profile.config.applicableRevisions.splice(index, 1) }
function removeStepMapping(index:number) { profile.config.stepsMapping.splice(index, 1) }
function removeRoleMapping(index:number) { profile.config.rolesMapping.splice(index, 1) }
function removeSignatureMapping(index:number) { profile.config.signaturesMapping.splice(index, 1) }
function removeMetadataMapping(index:number) { profile.config.metadataMapping.splice(index, 1) }

onMounted(async () => {
	profiles.value = await profileManager.getProfiles();
	if (profiles.value.length > 0) {
		selectedProfileName.value = profiles.value[0].name
		await switchProfile()
	} else {
		await saveProfile()
	}

	watch(profile, () => {
		clearTimeout(saveDebounceTimer)
		saveDebounceTimer = setTimeout(() => {
			saveProfile()
			showSavedToast.value = true
			clearTimeout(toastTimer)
			toastTimer = window.setTimeout(() => {
				showSavedToast.value = false
			}, 800)
		}, 1000)
	}, { deep: true })
})

onUnmounted(() => {
	clearTimeout(saveDebounceTimer)
	clearTimeout(toastTimer)
})

</script>

<style scoped>
.profile-saved-toast {
	position: fixed;
	top: 1rem;
	left: 50%;
	transform: translateX(-50%);
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
