// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Fixes link post federation and image/video attachments from Lemmy.
 */

import { IObject, IPost, isPost } from '@/core/activitypub/type.js';
import { MRF } from '@/misc/mrf.js';

const VALID_REGEX = /(\/pictrs\/|\.(mp[34]|png|jpe?g|web[pm]|gif)$)/;

// eslint-disable-next-line import/no-default-export
export default class extends MRF {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interceptIncomingNote(_note: IObject, isUpdate: boolean): IObject | null {
		if (!isPost(_note)) { return _note; }
		const note = _note as IPost;

		if (Array.isArray(note.attachment)) {
			note.attachment = note.attachment.map(attachment => {
				if (typeof attachment.href !== 'string') { return attachment; }

				if (VALID_REGEX.test(attachment.href)) {
					attachment.url = attachment.href; // misskey does not care about the type of an attachment, only it's url.
					return attachment;
				}

				return null;
			}).filter(a => a != null);
		}

		return note;
	}
}
