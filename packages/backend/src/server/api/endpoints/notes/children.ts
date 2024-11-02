/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { CacheService } from '@/core/CacheService.js';
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
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		showQuotes: { type: 'boolean', default: true },
	},
	required: ['noteId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private cacheService: CacheService,
		private metaService: MetaService,
		private utilityService: UtilityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const metasvc = await this.metaService.fetch(true);

			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
				.andWhere(new Brackets(qb => {
					qb
						.where('note.replyId = :noteId', { noteId: ps.noteId });
						if (ps.showQuotes) {
							qb.orWhere(new Brackets(qb => {
								qb
									.where('note.renoteId = :noteId', { noteId: ps.noteId })
									.andWhere(new Brackets(qb => {
										qb
											.where('note.text IS NOT NULL')
											.orWhere('note.fileIds != \'{}\'')
											.orWhere('note.hasPoll = TRUE');
									}));
							}));
						}
				}))
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');

			this.queryService.generateVisibilityQuery(query, me);
			if (me) {
				this.queryService.generateBlockedUserQuery(query, me);
				this.queryService.generateMutedUserQuery(query, me);
			}

			const [
				followings,
			] = me ? await Promise.all([
				this.cacheService.userFollowingsCache.fetch(me.id),
			]) : [undefined];


			const notes = await query.limit(ps.limit).getMany();

			notes = notes.filter(note => {
				if (note.user?.isSilenced && me && followings && note.userId !== me.id && !followings[note.userId]) return false;
				if (!me && note.user?.isSilenced) return false;
				if (note.user?.isSuspended) return false;
				if (this.utilityService.isBlockedHost(metasvc.blockedHosts, note.userHost)) return false;
				if (this.utilityService.isSilencedHost(metasvc.silencedHosts, note.userHost)) return false;
				return true;
			});

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
