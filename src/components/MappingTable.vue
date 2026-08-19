<template>
	<section class="mb-4">
		<div class="d-flex align-items-center gap-2 mb-2">
			<h2 class="h5 mb-0">{{ title }}</h2>
			<button type="button" class="btn btn-sm btn-outline-primary" title="Add row" @click="$emit('add')">+</button>
		</div>
		<table class="table table-sm table-bordered align-middle">
			<thead>
				<tr>
					<th v-for="column in columns" :key="column">{{ column }}</th>
					<th class="action-column"></th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(row, index) in rows" :key="index">
					<slot name="row" :row="row" :index="index"></slot>
					<td>
						<button type="button" class="btn btn-sm btn-outline-danger" title="Delete row" @click="$emit('remove', index)">🗑</button>
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
</style>
