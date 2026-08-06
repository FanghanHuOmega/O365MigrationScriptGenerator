<template>
	<div ref="editorEl" class="monaco-shell"></div>
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
	modelValue: {
		type: String,
		required: true
	},
	language: {
		type: String,
		default: 'sql'
	}
})

const emit = defineEmits(['update:modelValue'])

const editorEl = ref(null)
let editorInstance

onMounted(async () => {
	editorInstance = monaco.editor.create(editorEl.value, {
		value: props.modelValue,
		language: props.language,
		theme: 'vs',
		automaticLayout: true,
		minimap: {
			enabled: false
		},
		fontSize: 14,
		lineNumbersMinChars: 3,
		scrollBeyondLastLine: false
	})

	editorInstance.onDidChangeModelContent(() => {
		emit('update:modelValue', editorInstance.getValue())
	})
})

watch(
	() => props.modelValue,
	(nextValue) => {
		if (!editorInstance) {
			return
		}

		if (nextValue !== editorInstance.getValue()) {
			editorInstance.setValue(nextValue)
		}
	}
)

watch(
	() => props.language,
	(nextLanguage) => {
		if (!editorInstance) {
			return
		}

		monaco.editor.setModelLanguage(editorInstance.getModel(), nextLanguage)
	}
)

onBeforeUnmount(() => {
	if (editorInstance) {
		editorInstance.dispose()
	}
})
</script>

<style scoped>
.monaco-shell {
	width: 100%;
	height: 100%;
	min-height: 420px;
	border: 1px solid var(--border-color);
	border-radius: 12px;
	overflow: hidden;
}
</style>
