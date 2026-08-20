<template>
    <div v-if="isVisible" class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" @keydown.esc="modal.hide">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ title }}</h5>
                    <button type="button" class="btn-close" aria-label="Close" @click="modal.hide"></button>
                </div>
                <form @submit.prevent="submit">
                    <div class="modal-body">
                        <div v-for="field in fields" :key="field.name" class="mb-3">
                            <label :for="field.name" class="form-label">{{ field.name }}</label>
                            <input
                                :id="field.name"
                                v-model="inputValues[field.name]"
                                class="form-control"
                                :type="field.type"
                                :placeholder="field.placeholder"
                            />
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="modal.hide">Cancel</button>
                        <button type="submit" class="btn btn-primary">OK</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div v-if="isVisible" class="modal-backdrop fade show"></div>
</template>

<script setup lang="ts">
    /**
     * This component takes a title, an array of input fields in the form of { name:string, type:string, defaultValue?:any, placeholder?:string } and a callback function as props,,
     * then render a bootstrap modal dialog with the title and input fields, and return the values of the input fields via the callback function when the user clicks the "OK" button.
     * 
     * it exposes a the bootstrap modal object via the expose function, so that the parent component can control the modal dialog (show/hide) via the modal object.
     */

import { reactive, ref } from 'vue'

interface InputField {
    name: string
    type: string
    defaultValue?: unknown
    placeholder?: string
}

const { title, fields, callback } = defineProps<{
    title: string,
    fields: InputField[],
    callback: (values: any) => void
}>()

const isVisible = ref(false)
const inputValues = reactive<{ [key: string]: any }>({})

function resetInputValues() {
    for (const field of fields) {
        inputValues[field.name] = field.defaultValue ?? ''
    }
}

const modal = {
    show() {
        resetInputValues()
        isVisible.value = true
    },
    hide() {
        isVisible.value = false
    }
}

function submit() {
    callback({ ...inputValues })
    modal.hide()
}

defineExpose({ modal })
</script>