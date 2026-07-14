"use client";

import { create } from "zustand";

export type ReviewItem = { id: string; accountName: string; postedDate: string; description: string; amountMinor: string; currency: string; category: { id: string; name: string } | null; categorySource: string; categoryConfidence: number | null; reviewStatus: string; version: number; possibleDuplicateCount: number };

type ReviewState = { selectedId: string | null; select: (id: string) => void; items: ReviewItem[]; setItems: (items: ReviewItem[]) => void };
export const useReviewStore = create<ReviewState>((set) => ({ selectedId: null, items: [], select: (selectedId) => set({ selectedId }), setItems: (items) => set({ items, selectedId: items[0]?.id ?? null }) }));
