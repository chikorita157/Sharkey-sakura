/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import Logger from '@/logger.js';
import { MRF } from '@/misc/mrf.js';
import type { MiRemoteUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { ApLoggerService } from './ApLoggerService.js';
import { isDelete, type IObject, isUndo, isBlock, IActivity, type IActor } from './type.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const mrfPath = Path.resolve(_dirname, '../../mrf');

@Injectable()
export class MrfService implements OnModuleInit {
	private logger: Logger;
	private loadedMrfs: MRF[];

	constructor(
		@Inject(DI.config)
		private config: Config,

		apLoggerService: ApLoggerService,
	) {
		this.logger = apLoggerService.logger.createSubLogger('mrf');
		this.loadedMrfs = [];
	}

	async onModuleInit() {
		for (const [name, cfg] of Object.entries(this.config.mrf)) {
			this.logger.info(`loading MRF ${name}`);

			// this is the transpiled name and hence needs to be .js and not .ts
			const mrfModulePath = Path.resolve(mrfPath, `${name}.js`);
			const mrfClass = (await import(mrfModulePath)).default;
			const mrf: MRF = new mrfClass(this.logger.createSubLogger(name));

			mrf.reconfigure(cfg);
			this.loadedMrfs.push(mrf);
		}
	}

	@bindThis
	public interceptIncomingActivity(actor: MiRemoteUser, _activity: IObject): IObject|null {
		let activity = _activity;

		// this is trivial to bypass but any roadblock is worth something
		// akkoma by default does the same.
		if (isDelete(activity) || isUndo(activity) || isBlock(activity)) {
			return activity;
		}

		for (const mrf of this.loadedMrfs) {
			try {
				mrf.logger.debug('rewriting incoming activity', activity);
				const rewritten = mrf.interceptIncomingActivity(actor, activity);
				if (rewritten == null) {
					return null;
				}

				activity = rewritten;
			} catch (e) {
				mrf.logger.error('error rewriting incoming message, skipping!', e as Error);
			}
		}

		return activity;
	}

	@bindThis
	public interceptIncomingNote(_note: IObject, isUpdate: boolean): IObject|null {
		let note = _note;

		for (const mrf of this.loadedMrfs) {
			try {
				mrf.logger.debug('rewriting incoming note', note);
				const rewritten = mrf.interceptIncomingNote(note, isUpdate);
				if (rewritten == null) {
					return null;
				}

				note = rewritten;
			} catch (e) {
				mrf.logger.error('error rewriting incoming note, skipping!', e as Error);
			}
		}

		return note;
	}

	@bindThis
	public interceptIncomingActor(_actor: IObject, isUpdate: boolean): IObject|null {
		let actor = _actor;

		for (const mrf of this.loadedMrfs) {
			try {
				mrf.logger.debug('rewriting incoming person', actor);
				const rewritten = mrf.interceptIncomingActor(actor, isUpdate);
				if (rewritten == null) {
					return null;
				}

				actor = rewritten;
			} catch (e) {
				mrf.logger.error('error rewriting incoming actor, skipping!', e as Error);
			}
		}

		return actor;
	}

	@bindThis
	public interceptOutgoingActivity(_activity: IActivity|null, inboxes: Map<string, boolean>): { activity: IActivity, inboxes: Map<string, boolean> } | null {
		if (_activity == null) {
			return null;
		}

		let payload = { activity: _activity, inboxes };

		for (const mrf of this.loadedMrfs) {
			try {
				mrf.logger.debug('rewriting outgoing activity', payload);
				const rewritten = mrf.interceptOutgoingActivity(payload.activity, payload.inboxes);
				if (rewritten == null) {
					return null;
				}

				payload = rewritten;
			} catch (e) {
				mrf.logger.error('error rewriting incoming message, skipping!', e as Error);
			}
		}

		return payload;
	}

	@bindThis
	public interceptOutgoingActivitySingular(activity: IActivity|null, _inbox: string|null, _isSharedInbox: boolean): { activity: IActivity, inbox: string|null, isSharedInbox: boolean } | null {
		const mrfInboxMap = new Map();
		mrfInboxMap.set(_inbox, _isSharedInbox);

		const rewritten = this.interceptOutgoingActivity(activity, mrfInboxMap);

		if (rewritten == null) {
			return null;
		}

		if (rewritten.inboxes.size < 1) {
			return null;
		}

		const [inbox, isSharedInbox] = rewritten.inboxes.entries().next().value;

		return {
			activity: rewritten.activity,
			inbox,
			isSharedInbox,
		};
	}
}
