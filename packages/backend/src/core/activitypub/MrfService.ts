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
import { isDelete, type IObject, isUndo, isBlock } from './type.js';

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
	public rewriteIncoming(actor: MiRemoteUser, _activity: IObject): IObject|null {
		let activity = _activity;

		// this is trivial to bypass but any roadblock is worth something
		// akkoma by default does the same.
		if (isDelete(activity) || isUndo(activity) || isBlock(activity)) {
			return activity;
		}

		for (const mrf of this.loadedMrfs) {
			try {
				mrf.logger.debug('rewriting incoming activity', activity);
				const rewritten = mrf.incoming(actor, activity);
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
}
