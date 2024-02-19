// SPDX-License-Identifier: AGPL-3.0-only

/* eslint-disable import/no-default-export */

/**
 * Unwraps the activities arriving from FEP-1b12 compatible groups (e.g. Lemmy)
 */

import { Injectable } from '@nestjs/common';
import { IActivity, IObject, getApType, isAnnounce } from '@/core/activitypub/type.js';
import { IncomingActivityInterceptor, MRF } from '@/misc/mrf.js';
import { MiRemoteUser } from '@/models/User.js';

// https://join-lemmy.org/docs/contributors/05-federation.html#announce
export const validActivity = ['Create', 'Update', 'Like', 'Dislike', 'Remove', 'Delete', 'Undo'];

function isActivity(object: IObject): object is IActivity {
	return validActivity.includes(getApType(object));
}

@Injectable()
export default class Fep1b12AnnounceFix extends MRF implements IncomingActivityInterceptor {
	async interceptIncomingActivity(actor: MiRemoteUser, activity: IObject): Promise<IObject | null> {
		if (!isAnnounce(activity)) {
			return activity;
		}

		if (typeof activity.object !== 'string' && isActivity(activity.object)) {
			this.logger.info('unwrapping FEP-1b12 activity', { outer: activity.id, inner: activity.object.id });
			return activity.object;
		}

		return activity;
	}
}
