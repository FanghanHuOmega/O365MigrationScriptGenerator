<template>
	<div class="monaco-container">
		<div class="monaco-tabs" role="tablist">
			<button
				v-for="tab in tabs"
				:key="tab.id"
				type="button"
				role="tab"
				class="monaco-tab"
				:class="{ active: tab.id === activeTabId }"
				:aria-selected="tab.id === activeTabId"
				@click="$emit('update:activeTabId', tab.id)"
				@mousedown.middle.prevent="$emit('close-tab', tab.id)"
			>
				<span class="monaco-tab-title">{{ tab.title }}</span>
				<i v-if="tab.dirty" class="bi bi-dot monaco-tab-dot"></i>
				<i class="bi bi-x-lg monaco-tab-close" @click.stop="$emit('close-tab', tab.id)"></i>
			</button>
			<span v-if="tabs.length === 0" class="monaco-tabs-empty">No script open</span>
		</div>
		<div ref="editorEl" class="monaco-shell"></div>
	</div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

globalThis.MonacoEnvironment = {
	getWorker() {
		return new editorWorker()
	}
}

const props = defineProps({
	tabs: {
		type: Array,
		default: () => []
	},
	activeTabId: {
		type: String,
		default: null
	}
})

const emit = defineEmits(['update:value', 'update:activeTabId', 'save', 'close-tab'])

const editorEl = ref(null)
let editorInstance
const models = new Map()

function disposeModel(id) {
	const model = models.get(id)
	if (model) {
		model.dispose()
		models.delete(id)
	}
}

function ensureModel(tab) {
	let model = models.get(tab.id)

	if (!model) {
		model = monaco.editor.createModel(tab.value, tab.language || 'sql')
		model.onDidChangeContent(() => {
			emit('update:value', tab.id, model.getValue())
		})
		models.set(tab.id, model)
	} else if (model.getValue() !== tab.value) {
		model.setValue(tab.value)
	}

	return model
}

function syncModels() {
	const openIds = new Set(props.tabs.map((tab) => tab.id))

	for (const id of models.keys()) {
		if (!openIds.has(id)) {
			disposeModel(id)
		}
	}

	for (const tab of props.tabs) {
		ensureModel(tab)
	}
}

function showActiveTab() {
	if (!editorInstance) {
		return
	}

	const model = props.activeTabId ? models.get(props.activeTabId) : null
	editorInstance.setModel(model ?? null)
}

onMounted(() => {
	editorInstance = monaco.editor.create(editorEl.value, {
		theme: 'vs',
		automaticLayout: true,
		minimap: {
			enabled: false
		},
		fontSize: 14,
		lineNumbersMinChars: 3,
		scrollBeyondLastLine: false
	})

	// only fires while this editor instance has focus
	editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
		if (props.activeTabId) {
			emit('save', props.activeTabId)
		}
	})

	syncModels()
	showActiveTab()
})

watch(() => props.tabs, syncModels, { deep: true })
watch(() => props.activeTabId, showActiveTab)

onBeforeUnmount(() => {
	editorInstance?.dispose()
	for (const id of Array.from(models.keys())) {
		disposeModel(id)
	}
})
</script>

<style scoped>
.monaco-container {
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 420px;
	border: 1px solid var(--border-color, #dee2e6);
	border-radius: 12px;
	overflow: hidden;
}

.monaco-tabs {
	display: flex;
	flex-wrap: wrap;
	gap: 2px;
	padding: 4px 4px 0;
	background: #f1f3f5;
	border-bottom: 1px solid var(--border-color, #dee2e6);
}

.monaco-tab {
	display: flex;
	align-items: center;
	gap: 2px;
	border: none;
	background: transparent;
	padding: 6px 8px 6px 12px;
	border-radius: 6px 6px 0 0;
	font-size: 0.85rem;
	cursor: pointer;
}

.monaco-tab-dot {
	font-size: 1.4rem;
	line-height: 0;
	color: #fd7e14;
}

.monaco-tab-close {
	border-radius: 4px;
	padding: 2px;
	font-size: 0.7rem;
}

.monaco-tab-close:hover {
	background: #dee2e6;
}

.monaco-tab.active {
	background: #fff;
	font-weight: 600;
}

.monaco-tabs-empty {
	padding: 6px 12px;
	color: #6c757d;
	font-size: 0.85rem;
}

.monaco-shell {
	flex: 1;
	min-height: 380px;
}
</style>
