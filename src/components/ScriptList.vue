<template>
	<div class="script-list" role="list" aria-label="Generated scripts">
		<button
			v-for="script in scripts"
			:key="script.scriptName"
			type="button"
			class="script-list-item"
			@click="loadScript(script)"
		>
			{{ script.scriptName }}
		</button>
		<span v-if="scripts.length === 0" class="script-list-empty">No scripts yet</span>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import profileManager, { type MigrationProfile, type MigrationScript } from '../lib/profileManager'

const props = defineProps<{
	profile: MigrationProfile
	loadScript: (script: MigrationScript) => void
}>()

const scripts = ref<MigrationScript[]>([])

async function loadScripts() {
	scripts.value = await profileManager.getProfileScripts(props.profile.name);
}

function loadScript(script: MigrationScript) {
	props.loadScript(script)
}

onMounted(loadScripts)
watch(() => props.profile.name, loadScripts)
</script>

<style scoped>
.script-list {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.script-list-item {
	text-align: left;
}

.script-list-empty {
	color: #6c757d;
}
</style>
