<template>
	<div class="scripts-tab">
		<div class="scripts-tab-sidebar">
			<ScriptList
				v-if="profile"
				:profile="profile"
				:load-script="openScriptTab"
				:on-script-deleted="closeTabSilently"
				:refresh-trigger="refreshTrigger"
			/>
			<p v-else class="text-muted">No profile loaded.</p>
		</div>
		<div class="scripts-tab-editor">
			<MonacoEditor
				:tabs="tabs"
				:active-tab-id="activeTabId"
				@update:value="handleValueChange"
				@update:activeTabId="activeTabId = $event"
				@save="saveTab"
				@close-tab="closeTab"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import MonacoEditor from './MonacoEditor.vue'
import ScriptList from './ScriptList.vue'
import profileManager, { type MigrationProfile } from '../lib/profileManager'

const props = defineProps<{
	profile: MigrationProfile | null
	refreshTrigger?: number
}>()

interface ScriptTab {
	id: string
	title: string
	value: string
	savedValue: string
	dirty: boolean
	language: string
}

const tabs = reactive<ScriptTab[]>([])
const activeTabId = ref<string | undefined>(undefined)

async function openScriptTab(scriptName: string) {
	const existingTab = tabs.find((tab) => tab.id === scriptName)

	if (existingTab) {
		activeTabId.value = existingTab.id
		return
	}

	if (!props.profile) {
		return
	}

	const script = await profileManager.getProfileScript(props.profile.name, scriptName)
	if (!script) {
		return
	}

	tabs.push({
		id: script.scriptName,
		title: script.scriptName,
		value: script.script,
		savedValue: script.script,
		dirty: false,
		language: 'sql'
	})
	activeTabId.value = script.scriptName
}

function handleValueChange(id: string, value: string) {
	const tab = tabs.find((tab) => tab.id === id)
	if (tab) {
		tab.value = value
		tab.dirty = value !== tab.savedValue
	}
}

async function saveTab(id: string) {
	const tab = tabs.find((tab) => tab.id === id)
	if (!tab || !props.profile) {
		return
	}

	await profileManager.saveProfileScript({
		profileName: props.profile.name,
		scriptName: tab.id,
		script: tab.value
	})

	tab.savedValue = tab.value
	tab.dirty = false
}

function closeTab(id: string) {
	const index = tabs.findIndex((tab) => tab.id === id)
	if (index === -1) {
		return
	}

	const tab = tabs[index]
	if (tab.dirty && !confirm(`Discard unsaved changes to "${tab.title}"?`)) {
		return
	}

	tabs.splice(index, 1)
	if (activeTabId.value === id) {
		activeTabId.value = tabs[index]?.id ?? tabs[tabs.length - 1]?.id
	}
}

function closeTabSilently(id: string) {
	const index = tabs.findIndex((tab) => tab.id === id)
	if (index === -1) {
		return
	}

	tabs.splice(index, 1)
	if (activeTabId.value === id) {
		activeTabId.value = tabs[index]?.id ?? tabs[tabs.length - 1]?.id
	}
}
</script>

<style scoped>
.scripts-tab {
	display: flex;
	gap: 1rem;
	min-height: 480px;
}

.scripts-tab-sidebar {
	width: 220px;
	flex-shrink: 0;
}

.scripts-tab-editor {
	flex: 1;
	min-width: 0;
}
</style>
