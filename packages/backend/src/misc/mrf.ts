// SPDX-License-Identifier: AGPL-3.0-only

/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { Injectable } from '@nestjs/common';
import { ApLoggerService } from '@/core/activitypub/ApLoggerService.js';
import { IActivity, IObject } from '@/core/activitypub/type.js';
import Logger from '@/logger.js';
import { MiRemoteUser } from '@/models/User.js';

export interface IncomingActivityInterceptor extends MRF {
	/**
	 * @param actor MiRemoteUser that has sent this activity
	 * @param activity Incoming Activity object. may be processed by other MRF policies
	 * @returns the activity object to be processed. or null if this activity should be rejected
	 */
	interceptIncomingActivity(actor: MiRemoteUser, activity: IObject): IObject|null;
}

export function canInterceptIncomingActivity(mrf: MRF): mrf is IncomingActivityInterceptor {
	return (mrf as IncomingActivityInterceptor).interceptIncomingActivity !== undefined;
}

export interface OutgoingActivityInterceptor extends MRF {
	/**
	 * @param activity Outgoing activity object. may be processed by other MRF policies
	 * @param inboxes `Map<string, boolean>` / key: to (inbox url), value: isSharedInbox (if there is a single inbox in the map, do NOT add any new entries, they may not be counted!)
	 * @returns the activity and the inboxes it should be sent to. or null if delivery should be cancelled.
	 */
	interceptOutgoingActivity(activity: IActivity, inboxes: Map<string, boolean>): { activity: IActivity, inboxes: Map<string, boolean> } | null;
}

export function canInterceptOutgoingActivity(mrf: MRF): mrf is OutgoingActivityInterceptor {
	return (mrf as OutgoingActivityInterceptor).interceptOutgoingActivity !== undefined;
}

export interface NoteInterceptor extends MRF {
	/**
	 * @param note Incoming Note object. may be processed by other MRF policies
	 * @param isUpdate true if this is an update to an existing note, false if this a brand new note
	 * @returns the note object to be processed. or null if this note should be dropped
	 */
	interceptIncomingNote(note: IObject, isUpdate: boolean): IObject|null;
}

export function canInterceptNote(mrf: MRF): mrf is NoteInterceptor {
	return (mrf as NoteInterceptor).interceptIncomingNote !== undefined;
}

export interface ActorInterceptor extends MRF {
	/**
	 * @param actor Incoming Actor object. may be processed by other MRF policies
	 * @param isUpdate true if this is an update to an existing note, false if this a brand new note
	 * @returns the actor object to be processed. or null if this actor should be dropped (dropping actors may cause issues!)
	 */
	interceptIncomingActor(actor: IObject, isUpdate: boolean): IObject|null;
}

export function canInterceptActor(mrf: MRF): mrf is ActorInterceptor {
	return (mrf as ActorInterceptor).interceptIncomingActor !== undefined;
}

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
}
