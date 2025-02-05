<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<div class="bcekxzvu _margin _panel">
		<div class="target">
			<MkA v-user-preview="report.targetUserId" class="info" :to="`/admin/user/${report.targetUserId}`" :behavior="'window'">
				<MkAvatar class="avatar" :user="report.targetUser" indicator/>
				<div class="names">
					<MkUserName class="name" :user="report.targetUser"/>
					<MkAcct class="acct" :user="report.targetUser" style="display: block;"/>
				</div>
			</MkA>
			<div class="keyvalCtn">
				<MkKeyValue>
					<template #key>{{ i18n.ts.registeredDate }}</template>
					<template #value>{{ dateString(report.targetUser.createdAt) }} (<MkTime :time="report.targetUser.createdAt"/>)</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.reporter }}</template>
					<template #value><MkA :to="`/admin/user/${report.reporter.id}`" class="_link" :behavior="'window'">@{{ report.reporter.username }}</MkA></template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.createdAt }}</template>
					<template #value><MkTime :time="report.createdAt" mode="absolute"/> (<MkTime :time="report.createdAt" mode="relative"/>)</template>
				</MkKeyValue>
			</div>
			<hr>
		</div>
		<div class="detail">
			<div>
				<Mfm :text="report.comment" :isBlock="true" :linkNavigationBehavior="'window'"/>
			</div>
			<hr/>
			<div v-if="report.assignee" class="assignee">
				{{ i18n.ts.moderator }}:
				<MkA :to="`/admin/user/${report.assignee.id}`" class="_link" :behavior="'window'">@{{ report.assignee.username }}</MkA>
			</div>
			<div class="action">
				<MkSwitch v-model="forward" c:disabled="report.targetUser.host == null || report.resolved">
					{{ i18n.ts.forwardReport }}
					<template #caption>{{ i18n.ts.forwardReportIsAnonymous }}</template>
				</MkSwitch>
				<MkButton v-if="!report.resolved" primary @click="resolve">{{ i18n.ts.abuseMarkAsResolved }}</MkButton>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { dateString } from '@/filters/date.js';

const props = defineProps<{
	report: any;
}>();

const emit = defineEmits<{
	(ev: 'resolved', reportId: string): void;
}>();

const forward = ref(props.report.forwarded);

function resolve() {
	os.apiWithDialog('admin/resolve-abuse-user-report', {
		forward: forward.value,
		reportId: props.report.id,
	}).then(() => {
		emit('resolved', props.report.id);
	});
}
</script>

<style lang="scss" scoped>
.bcekxzvu {
	display: flex;
	flex-direction: column;
	transition: .1s;

	> .target {
		box-sizing: border-box;
		text-align: left;
		padding: 24px 24px 0px 24px;

		> .info {
			display: flex;
			box-sizing: border-box;
			align-items: center;
			padding: 14px;
			border-radius: var(--radius-sm);
			--c: rgb(255 196 0 / 15%);
			background-image: linear-gradient(45deg, var(--c) 16.67%, transparent 16.67%, transparent 50%, var(--c) 50%, var(--c) 66.67%, transparent 66.67%, transparent 100%);
			background-size: 16px 16px;

			> .avatar {
				width: 42px;
				height: 42px;
			}

			> .names {
				margin-left: 0.3em;
				padding: 0 8px;
				flex: 1;

				white-space: pre;
				overflow: hidden;

				> .name {
					font-weight: bold;
				}
			}
		}

		> .keyvalCtn {
			display: inline-flex;
			gap: 15px;
			margin-top: 15px;
		}
	}

	> .detail {
		display: flex;
		flex-direction: column;
		padding: 0px 24px 24px 24px;

		.assignee {
			margin-bottom: 15px;
		}

		.action {
			display: flex;
			flex-direction: column;
			gap: 15px;
		}
	}
}
</style>
