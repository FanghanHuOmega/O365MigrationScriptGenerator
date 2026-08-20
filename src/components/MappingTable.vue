<template>
	<section class="mb-4">
		<div class="d-flex align-items-center gap-2 mb-2">
			<h2 class="h5 mb-0">{{ title }}</h2>
			<button type="button" class="btn btn-sm btn-outline-primary" title="Add row" @click="$emit('add')">New Item <i class="bi bi-plus-lg"></i></button>
		</div>
		<table class="table table-sm table-bordered align-middle">
			<thead>
				<tr>
					<th v-for="column in columns" :key="column">{{ column }}</th>
					<th class="action-column" style="width: 2.5em;" ></th>
				</tr>
			</thead>
			<tbody>
				<tr class="row-container" v-for="(row, index) in rows" :key="index">
					<slot name="row" :row="row" :index="index"></slot>
					<td>
						<button type="button" class="btn btn-sm text-danger" title="Delete row" @click="$emit('remove', index)"><i class="bi bi-trash3"></i></button>
					</td>
				</tr>
			</tbody>
		</table>
	</section>
</template>

<script setup lang="ts" generic="T">
defineProps({
	title: { type: String, required: true },
	columns: { type: Array as () => string[], required: true },
	rows: { type: Array as () => T[], required: true }
})

defineEmits(['add', 'remove'])
</script>

<style scoped>
.action-column {
	width: 52px;
}

th {
	border-bottom: 2px solid #999c9e;
	padding: 0.5rem;
}

/**
 * hide input border
 */
:deep(.row-container td input) {
    border: none;
    outline: none;
}
:deep(.row-container td input:focus) {
    box-shadow: none;
}

</style>
