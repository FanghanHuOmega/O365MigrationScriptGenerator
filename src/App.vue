<template>
	<main class="container p-1">
		<div class="card" style="margin-top: 20px; padding: 20px; min-height: 200px;">
			<ul class="nav nav-tabs mb-1">
				<li class="nav-item">
					<a class="nav-link active" data-bs-target="#migration-profile" data-bs-toggle="tab" role="tab" href="#">Migration Profile</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" data-bs-target="#scripts" data-bs-toggle="tab" role="tab" href="#">Scripts</a>
				</li>
			</ul>
			<div class="tab-content">
				<div class="tab-pane fade show active" id="migration-profile" role="tabpanel">
					<ProfileConfigTab @profile-changed="currentProfile = $event" @scripts-generated="scriptsRefreshTrigger++" />
				</div>
				<div class="tab-pane fade" id="scripts" role="tabpanel">
					<ScriptsTab :profile="currentProfile" :refresh-trigger="scriptsRefreshTrigger" />
				</div>
			</div>
		</div>
	</main>
</template>

<script setup>
	import { ref } from 'vue'
	import ProfileConfigTab from './components/ProfileConfigTab.vue'
	import ScriptsTab from './components/ScriptsTab.vue'

	const currentProfile = ref(null)
	const scriptsRefreshTrigger = ref(0)
</script>

<style>
	body {
		/**
		 * white to light blue gradient with radial gradients for a soft, cloud-like effect
		 */
		background:
			radial-gradient(circle at 15% 20%, #ffffff 0%, #ffffff00 30%),
			radial-gradient(circle at 80% 5%, #b9d7e6 0%, #b9d7e600 35%),
			linear-gradient(135deg, #f2efe9, #d8e5ec);
		min-height: 100vh;
		margin: 0;
		padding: 0;
	}
</style>