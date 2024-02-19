// SPDX-License-Identifier: AGPL-3.0-only

/* eslint-disable @typescript-eslint/no-unused-vars, import/no-default-export */

/**
 * Fixes link post federation and image/video attachments from Lemmy.
 */

import { Injectable } from '@nestjs/common';
import { IObject, IPost, isPost } from '@/core/activitypub/type.js';
import { MRF, NoteInterceptor } from '@/misc/mrf.js';

const VALID_REGEX = /(\/pictrs\/|\.(mp[34]|png|jpe?g|web[pm]|gif)$)/;

@Injectable()
export default class LemmyAttachmentFix extends MRF implements NoteInterceptor {
	async interceptIncomingNote(_note: IObject, isUpdate: boolean): Promise<IObject | null> {
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
