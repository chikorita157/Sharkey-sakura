// SPDX-License-Identifier: AGPL-3.0-only

import { Injectable } from '@nestjs/common';
import { ApLoggerService } from '@/core/activitypub/ApLoggerService.js';
import { IActivity, IObject } from '@/core/activitypub/type.js';
import Logger from '@/logger.js';
import { MiRemoteUser } from '@/models/User.js';

@Injectable()
export class MRF {
	private config: object;
	logger: Logger;

	constructor(
		apLoggerService: ApLoggerService,
	) {
		this.logger = apLoggerService.logger.createSubLogger('mrf').createSubLogger(this.constructor.name);
	}

	reconfigure(config: object) {
		this.config = config;
		this.logger.info('reconfigured', config);
	}

	/**
	 * @param actor MiRemoteUser that has sent this activity
	 * @param activity Incoming Activity object. may be processed by other MRF policies
	 * @returns the activity object to be processed. or null if this activity should be rejected
	 */
	interceptIncomingActivity(actor: MiRemoteUser, activity: IObject): IObject|null {
		return activity;
	}

	/**
	 * @param note Incoming Note object. may be processed by other MRF policies
	 * @param isUpdate true if this is an update to an existing note, false if this a brand new note
	 * @returns the note object to be processed. or null if this note should be dropped
	 */
	interceptIncomingNote(note: IObject, isUpdate: boolean): IObject|null {
		return note;
	}

	/**
	 * @param actor Incoming Actor object. may be processed by other MRF policies
	 * @param isUpdate true if this is an update to an existing note, false if this a brand new note
	 * @returns the actor object to be processed. or null if this actor should be dropped (dropping actors may cause issues!)
	 */
	interceptIncomingActor(actor: IObject, isUpdate: boolean): IObject|null {
		return actor;
	}

	/**
	 * @param activity Outgoing activity object. may be processed by other MRF policies
	 * @param inboxes `Map<string, boolean>` / key: to (inbox url), value: isSharedInbox (if there is a single inbox in the map, do NOT add any new entries, they may not be counted!)
	 * @returns the activity and the inboxes it should be sent to. or null if delivery should be cancelled.
	 */
	interceptOutgoingActivity(activity: IActivity, inboxes: Map<string, boolean>): { activity: IActivity, inboxes: Map<string, boolean> } | null {
		return { activity, inboxes };
	}
}
