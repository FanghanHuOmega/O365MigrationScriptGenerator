<template>
	<main class="page">
		<section class="panel">
			<header class="panel-header">
				<h1>O365 Migration Script Generator</h1>
				<p>Create configuration profiles and maintain profile-specific migration scripts.</p>
			</header>

			<section class="profile-row">
				<div class="input-group profile-name-group">
					<label for="profileName">Profile Name</label>
					<input
						id="profileName"
						v-model="profileNameInput"
						type="text"
						placeholder="e.g. Finance-Migration"
					/>
				</div>

				<div class="input-group">
					<label for="profileSelect">Saved Profiles</label>
					<select id="profileSelect" v-model="selectedProfileName">
						<option value="">None</option>
						<option v-for="name in profileNames" :key="name" :value="name">{{ name }}</option>
					</select>
				</div>

				<div class="profile-actions">
					<button type="button" @click="saveCurrentProfile">Save Profile</button>
					<button type="button" @click="loadSelectedProfile" :disabled="!selectedProfileName">Load</button>
					<button type="button" class="ghost" @click="createNewDraft">New Draft</button>
					<button type="button" class="danger" @click="removeSelectedProfile" :disabled="!selectedProfileName">
						Delete
					</button>
				</div>
			</section>

			<nav class="tabs" aria-label="Main tabs">
				<button :class="tabClass('config')" type="button" @click="activeTab = 'config'">Config</button>
				<button :class="tabClass('script')" type="button" @click="activeTab = 'script'">Migration Script</button>
			</nav>

			<section v-if="activeTab === 'config'" class="tab-content">
				<div class="form-grid">
					<div class="input-group">
						<label for="sourceDb">SourceDB</label>
						<input id="sourceDb" v-model="config.SourceDB" type="text" />
					</div>

					<div class="input-group">
						<label for="targetDb">TargetDB</label>
						<input id="targetDb" v-model="config.TargetDB" type="text" />
					</div>

					<div class="input-group">
						<label for="workflowType">WorkflowType</label>
						<input id="workflowType" v-model="config.WorkflowType" type="text" />
					</div>

					<div class="input-group">
						<label for="processId">ProcessID</label>
						<input id="processId" v-model.number="config.ProcessID" type="number" />
					</div>
				</div>

				<div class="tab-actions">
					<button type="button" @click="generateFromConfig">Generate Script</button>
					<button type="button" class="ghost" @click="activeTab = 'script'">Open Script Tab</button>
				</div>
			</section>

			<section v-else class="tab-content script-tab-content">
				<MonacoEditor v-model="currentScript" language="sql" />
			</section>
		</section>
	</main>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import MonacoEditor from './components/MonacoEditor.vue'
import { generateMigrationScript, normalizeConfig } from './lib/scriptGenerator'
import { deleteProfile, getProfileNames, loadState, saveState, upsertProfile } from './lib/storage'

const state = ref(loadState())
const activeTab = ref('config')
const selectedProfileName = ref(state.value.activeProfileName || '')
const profileNameInput = ref(selectedProfileName.value)

const config = reactive({
	SourceDB: '',
	TargetDB: '',
	WorkflowType: '',
	ProcessID: 0
})

const currentScript = ref(generateMigrationScript(config))

const profileNames = computed(() => getProfileNames(state.value))

if (selectedProfileName.value && state.value.profiles[selectedProfileName.value]) {
	applyProfile(state.value.profiles[selectedProfileName.value])
}

function tabClass(tabName) {
	return {
		tab: true,
		active: activeTab.value === tabName
	}
}

function applyProfile(profile) {
	const profileConfig = normalizeConfig(profile.config)

	config.SourceDB = profileConfig.SourceDB
	config.TargetDB = profileConfig.TargetDB
	config.WorkflowType = profileConfig.WorkflowType
	config.ProcessID = profileConfig.ProcessID

	currentScript.value = profile.script || generateMigrationScript(profileConfig)
}

function generateFromConfig() {
	currentScript.value = generateMigrationScript(config)
}

function saveCurrentProfile() {
	const name = profileNameInput.value.trim()

	if (!name) {
		window.alert('Enter a custom profile name before saving.')
		return
	}

	const normalized = normalizeConfig(config)
	const script = currentScript.value || generateMigrationScript(normalized)

	state.value = upsertProfile(state.value, name, normalized, script)
	saveState(state.value)

	selectedProfileName.value = name
	profileNameInput.value = name
}

function loadSelectedProfile() {
	if (!selectedProfileName.value) {
		return
	}

	const profile = state.value.profiles[selectedProfileName.value]

	if (!profile) {
		window.alert('Selected profile could not be found in local storage.')
		return
	}

	profileNameInput.value = selectedProfileName.value
	applyProfile(profile)
}

function createNewDraft() {
	selectedProfileName.value = ''
	profileNameInput.value = ''

	config.SourceDB = ''
	config.TargetDB = ''
	config.WorkflowType = ''
	config.ProcessID = 0

	currentScript.value = generateMigrationScript(config)
}

function removeSelectedProfile() {
	if (!selectedProfileName.value) {
		return
	}

	const name = selectedProfileName.value

	state.value = deleteProfile(state.value, name)
	saveState(state.value)

	createNewDraft()
}
</script>
