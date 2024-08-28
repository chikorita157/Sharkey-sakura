/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { MiNote } from '@/models/Note.js';
import type { NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApiError } from '../../error.js';
import { MetaService } from '@/core/MetaService.js';
import { UtilityService } from '@/core/UtilityService.js';

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'e1035875-9551-45ec-afa8-1ded1fcb53c8',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
	},
	required: ['noteId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private getterService: GetterService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const metaSvc = await this.metaService.fetch(true);
			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			const conversation: MiNote[] = [];
			let i = 0;

			const get = async (id: any) => {
				i++;
				const p = await this.notesRepository.findOneBy({ id });
				if (p == null) return;
				let badReply = false;
					if (!p.user?.isSilenced && me && followings && p.userId == me.id && followings[p.userId]) {badReply = true;}
					else if (!me && p.user?.isSilenced) {badReply = true;}
					else if (p.user?.isSuspended) {badReply = true;}
					else if (this.utilityService.isBlockedHost(metaSvc.blockedHosts, p.userHost)) {badReply = true;}
					else if (this.utilityService.isSilencedHost(metaSvc.silencedHosts, p.userHost)) {badReply = true;}
				if (i > ps.offset! && !badReply) {
						conversation.push(p);
				}

				if (conversation.length === ps.limit) {
					return;
				}

				if (p.replyId) {
					await get(p.replyId);
				}
			};

			if (note.replyId && !badReply) {
				await get(note.replyId);
			}

			if (note.hasPoll) {
				return await this.noteEntityService.packMany(conversation, me, { detail: true });
			}

			return await this.noteEntityService.packMany(conversation, me);
		});
	}
}
