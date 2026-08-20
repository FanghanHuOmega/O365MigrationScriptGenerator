<template>
	<div class="script-list" role="list" aria-label="Generated scripts">
		<div v-for="scriptName in scriptNames" :key="scriptName" class="script-list-row">
			<button type="button" class="btn script-list-item" @click="loadScript(scriptName)">
				{{ scriptName }}
			</button>
			<button type="button" class="script-list-delete" title="Delete script" @click="deleteScript(scriptName)">
				<i class="bi bi-trash3"></i>
			</button>
		</div>
		<span v-if="scriptNames.length === 0" class="script-list-empty">No scripts yet</span>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import profileManager, { type MigrationProfile } from '../lib/profileManager'

const props = defineProps<{
	profile: MigrationProfile
	loadScript: (scriptName: string) => void
	onScriptDeleted?: (scriptName: string) => void
	refreshTrigger?: number
}>()

const scriptNames = ref<string[]>([])

async function loadScripts() {
	const scripts = await profileManager.getProfileScripts(props.profile.name)
	scriptNames.value = scripts.map((script) => script.scriptName)
}

function loadScript(scriptName: string) {
	props.loadScript(scriptName)
}

async function deleteScript(scriptName: string) {
	if (!confirm(`Delete script "${scriptName}"? This action cannot be undone.`)) {
		return
	}

	await profileManager.deleteProfileScript(props.profile.name, scriptName)
	await loadScripts()
	props.onScriptDeleted?.(scriptName)
}

onMounted(loadScripts)
watch(() => props.profile.name, loadScripts);
watch(() => props.refreshTrigger, loadScripts);
</script>

<style scoped>
.script-list {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	background: #f8f9fa;
	height: 100%;
	border: 1px solid #dee2e6;
	overflow-y: auto;
}

.script-list-row {
	display: flex;
	align-items: center;
	gap: 0.25rem;
}

.script-list-row:hover {
	background: #e9ecef;
}

.script-list-item {
	flex: 1;
	text-align: left;
	border: none !important;
	outline: none !important;
}

.script-list-row:has(.script-list-item:active) {
	background: #c7cbce;
}

.script-list-delete {
	border: none;
	background: transparent;
	color: #dc3545;
	padding: 0.25rem 0.5rem;
}

.script-list-empty {
	color: #6c757d;
}
</style>
