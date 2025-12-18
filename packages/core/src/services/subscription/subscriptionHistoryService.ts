import {BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';

import type {SubscriptionEventType, SubscriptionStatus} from '@lotto/database';
import {SubscriptionHistoryRepository, SubscriptionTierRepository} from '@lotto/database';
import type {LoggerService} from '../logger/loggerService';

export interface CreateHistoryEntryParams {
  subscriptionId: string;
  userId: string;
  oldTierId: string;
  newTierId: string;
  fromStatus: SubscriptionStatus;
  toStatus: SubscriptionStatus;
  eventType?: SubscriptionEventType;
  stripeEventId?: string;
  reason?: string;
}

@injectable({scope: BindingScope.TRANSIENT})
export class SubscriptionHistoryService {
  constructor(
    @repository(SubscriptionHistoryRepository)
    private subscriptionHistoryRepository: SubscriptionHistoryRepository,
    @repository(SubscriptionTierRepository)
    private subscriptionTierRepository: SubscriptionTierRepository,
    @inject('services.LoggerService')
    private logger: LoggerService,
  ) {}

  async createEntry(data: CreateHistoryEntryParams): Promise<void> {
    const [oldTier, newTier] = await Promise.all([
      this.subscriptionTierRepository.findById(data.oldTierId, {fields: {code: true, price: true}}),
      this.subscriptionTierRepository.findById(data.newTierId, {fields: {code: true, price: true}}),
    ]);

    const eventType =
      data.eventType ??
      this.determineEventType(oldTier.code, oldTier.price, newTier.code, newTier.price);

    await this.subscriptionHistoryRepository.create({
      subscriptionId: data.subscriptionId,
      userId: data.userId,
      eventType,
      fromTier: oldTier.code,
      toTier: newTier.code,
      fromStatus: data.fromStatus,
      toStatus: data.toStatus,
      stripeEventId: data.stripeEventId,
      reason: data.reason,
      createdAt: new Date(),
    });

    this.logEvent(eventType, data.userId, oldTier.code, newTier.code);
  }

  private determineEventType(
    oldCode: string,
    oldPrice: number,
    newCode: string,
    newPrice: number,
  ): SubscriptionEventType {
    if (oldCode === newCode) {
      return 'renewed';
    }
    return newPrice > oldPrice ? 'upgraded' : 'downgraded';
  }

  private logEvent(
    eventType: SubscriptionEventType,
    userId: string,
    fromTier: string,
    toTier: string,
  ): void {
    const eventEmoji: Record<SubscriptionEventType, string> = {
      created: '🆕',
      upgraded: '⬆️',
      downgraded: '⬇️',
      canceled: '❌',
      renewed: '🔄',
      trial_started: '🎁',
      trial_ended: '⏰',
      payment_failed: '⚠️',
      reactivated: '✅',
    };

    const emoji = eventEmoji[eventType] ?? '📝';
    this.logger.log(`${emoji} User ${userId} subscription ${eventType}: ${fromTier} → ${toTier}`);
  }
}
