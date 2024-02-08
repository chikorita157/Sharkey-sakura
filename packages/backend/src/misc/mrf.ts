// SPDX-License-Identifier: AGPL-3.0-only

import { IObject } from '@/core/activitypub/type.js';
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
}
