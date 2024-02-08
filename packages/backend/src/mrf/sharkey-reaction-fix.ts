// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Removes the emoji from incoming reactions if it's the default heart from Sharkey.
 */

import { IObject, ILike, getApType } from '@/core/activitypub/type.js';
import { MRF } from '@/misc/mrf.js';
import { MiRemoteUser } from '@/models/User.js';

function isLike(object: IObject): object is ILike {
	return getApType(object) === 'Like';
}

// eslint-disable-next-line import/no-default-export
export default class extends MRF {
	incoming(actor: MiRemoteUser, activity: IObject): IObject | null {
		if (!isLike(activity)) {
			return activity;
		}

		if (activity._misskey_reaction === '❤') {
			activity._misskey_reaction = undefined;
			activity.content = undefined;
		}

		return activity;
	}
}
