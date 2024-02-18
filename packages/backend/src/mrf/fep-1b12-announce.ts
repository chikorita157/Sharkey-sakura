// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Unwraps the activities arriving from FEP-1b12 compatible groups (e.g. Lemmy)
 */

import { IActivity, IObject, getApType, isAnnounce } from '@/core/activitypub/type.js';
import { MRF } from '@/misc/mrf.js';
import { MiRemoteUser } from '@/models/User.js';

// https://join-lemmy.org/docs/contributors/05-federation.html#announce
export const validActivity = ['Create', 'Update', 'Like', 'Dislike', 'Remove', 'Delete', 'Undo'];

function isActivity(object: IObject): object is IActivity {
	return validActivity.includes(getApType(object));
}

// eslint-disable-next-line import/no-default-export
export default class extends MRF {
	interceptIncomingActivity(actor: MiRemoteUser, activity: IObject): IObject | null {
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
