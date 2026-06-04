export interface CapturedItem {
  tempId: string;
  name: string;
  brand?: string;
  predictedOriginalPrice?: number;
  gcsUri: string;
  needsReview?: boolean;
  nameSource?: "ai" | "user";
}

let _eventId: string | null = null;
let _items: CapturedItem[] = [];

export const captureStore = {
  reset() {
    _eventId = null;
    _items = [];
  },
  setEventId(id: string) {
    _eventId = id;
  },
  getEventId() {
    return _eventId;
  },
  addItem(item: CapturedItem) {
    _items = [..._items, item];
  },
  getItems() {
    return [..._items];
  },
  removeItem(tempId: string) {
    _items = _items.filter((i) => i.tempId !== tempId);
  },
  updateItem(tempId: string, updates: Partial<CapturedItem>) {
    _items = _items.map((i) => (i.tempId === tempId ? { ...i, ...updates } : i));
  },
  count() {
    return _items.length;
  },
};
