import type { SubscriptionCadence } from "@prisma/client";
import { prisma } from "../../db.js";
import type { ForecastRepository } from "./ports.js";

export class PrismaForecastRepository implements ForecastRepository {
  async inputs(userId: string, currency: string, since: Date) {
    const [history, subscriptions] = await Promise.all([
      prisma.transaction.findMany({ where: { userId, currency, postedDate: { gte: since }, reviewStatus: "REVIEWED" }, select: { postedDate: true, amountMinor: true }, orderBy: { postedDate: "asc" } }),
      prisma.subscription.findMany({ where: { userId, currency, active: true }, select: { merchant: true, amountMinor: true, nextChargeDate: true, cadence: true }, orderBy: { nextChargeDate: "asc" } }),
    ]);
    return { history: history.map((item) => ({ date: item.postedDate, amountMinor: item.amountMinor })), subscriptions: subscriptions.map((item) => ({ ...item, cadence: item.cadence as SubscriptionCadence })) };
  }
}
