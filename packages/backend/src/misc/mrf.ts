// SPDX-License-Identifier: AGPL-3.0-only

import { IActivity, IObject } from '@/core/activitypub/type.js';
import Logger from '@/logger.js';
import { MiRemoteUser } from '@/models/User.js';

export class MRF {
	private config: object;

	constructor(
		public logger: Logger,
	) {}

	reconfigure(config: object) {
		this.config = config;
		this.logger.info('reconfigured', config);
	}

	incoming(actor: MiRemoteUser, activity: IObject): IObject|null {
		return activity;
	}

	/**
	 * @param inboxes `Map<string, boolean>` / key: to (inbox url), value: isSharedInbox (if there is a single inbox in the map, do NOT add any new entries, they may not be counted!)
	 */
	outgoing(activity: IActivity, inboxes: Map<string, boolean>): { activity: IActivity, inboxes: Map<string, boolean> } | null {
		return { activity, inboxes };
	}
}
