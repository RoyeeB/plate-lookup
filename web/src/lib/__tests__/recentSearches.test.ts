/**
 * Protects the recent-searches history: the 10-entry cap, de-duplication
 * (a repeat search moves to the front rather than appearing twice), details
 * surviving a detail-less re-search, the v1 (bare string[]) -> v2 migration,
 * and graceful degradation when localStorage throws (Safari private mode).
 *
 * No jsdom: `window.localStorage` is stubbed with a tiny in-memory fake.
 */
import { beforeEach, describe, expect, it } from 'vitest';

interface FakeLocalStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function createFakeStorage(): FakeLocalStorage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

function createThrowingStorage(): FakeLocalStorage {
  return {
    getItem: () => {
      throw new Error('SecurityError: storage disabled');
    },
    setItem: () => {
      throw new Error('SecurityError: storage disabled');
    },
    removeItem: () => {
      throw new Error('SecurityError: storage disabled');
    },
  };
}

function installStorage(storage: FakeLocalStorage): void {
  (globalThis as unknown as { window: { localStorage: FakeLocalStorage } }).window = {
    localStorage: storage,
  };
}

const LEGACY_KEY = 'plate-lookup:recent-searches:v1';
const STORAGE_KEY = 'plate-lookup:recent-searches:v2';

describe('recentSearches', () => {
  let storage: FakeLocalStorage;

  beforeEach(() => {
    storage = createFakeStorage();
    installStorage(storage);
  });

  it('round-trips a plate through addRecentSearch / getRecentSearches', async () => {
    const { addRecentSearch, getRecentSearches } = await import('@/lib/recentSearches');
    addRecentSearch('12-345-67');
    const entries = getRecentSearches();
    expect(entries).toHaveLength(1);
    expect(entries[0].plate).toBe('1234567');
  });

  it('caps the list at 10 entries, dropping the oldest', async () => {
    const { addRecentSearch, getRecentSearches } = await import('@/lib/recentSearches');
    for (let i = 0; i < 11; i += 1) {
      addRecentSearch(String(1000000 + i));
    }
    const entries = getRecentSearches();
    expect(entries).toHaveLength(10);
    // The first-added plate (1000000) was pushed out; the most recent is at the front.
    expect(entries.map((e) => e.plate)).not.toContain('1000000');
    expect(entries[0].plate).toBe('1000010');
  });

  it('moves a repeated search to the front instead of duplicating it', async () => {
    const { addRecentSearch, getRecentSearches } = await import('@/lib/recentSearches');
    addRecentSearch('1111111');
    addRecentSearch('2222222');
    addRecentSearch('3333333');
    addRecentSearch('1111111');

    const plates = getRecentSearches().map((e) => e.plate);
    expect(plates).toEqual(['1111111', '3333333', '2222222']);
  });

  it('preserves previously-known details when re-adding a plate without details', async () => {
    const { addRecentSearch, getRecentSearches } = await import('@/lib/recentSearches');
    addRecentSearch('1234567', { make: 'טויוטה', model: 'קורולה', year: '2019' });
    addRecentSearch('1234567');

    const entry = getRecentSearches()[0];
    expect(entry.make).toBe('טויוטה');
    expect(entry.model).toBe('קורולה');
    expect(entry.year).toBe('2019');
  });

  it('migrates a v1 bare string[] into v2 entries and stops reading v1', async () => {
    storage.setItem(LEGACY_KEY, JSON.stringify(['1234567', '7654321']));
    const { getRecentSearches } = await import('@/lib/recentSearches');

    const entries = getRecentSearches();
    expect(entries.map((e) => e.plate)).toEqual(['1234567', '7654321']);
    expect(entries.every((e) => e.at === 0)).toBe(true);

    // Migration persisted to v2 and cleaned up the legacy key.
    expect(storage.getItem(LEGACY_KEY)).toBeNull();
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('degrades to empty (never throws) when localStorage itself throws', async () => {
    installStorage(createThrowingStorage());
    const { addRecentSearch, getRecentSearches } = await import('@/lib/recentSearches');

    expect(getRecentSearches()).toEqual([]);
    expect(() => addRecentSearch('1234567')).not.toThrow();
  });
});

describe('describeRecentSearch', () => {
  it('joins make, model and year with a middle dot', async () => {
    const { describeRecentSearch } = await import('@/lib/recentSearches');
    expect(
      describeRecentSearch({ plate: '1234567', make: 'טויוטה', model: 'קורולה', year: '2019', at: 0 })
    ).toBe('טויוטה קורולה · 2019');
  });

  it('falls back to just the year when there is no make/model', async () => {
    const { describeRecentSearch } = await import('@/lib/recentSearches');
    expect(describeRecentSearch({ plate: '1234567', year: '2019', at: 0 })).toBe('2019');
  });

  it('falls back to just the name when there is no year', async () => {
    const { describeRecentSearch } = await import('@/lib/recentSearches');
    expect(describeRecentSearch({ plate: '1234567', make: 'טויוטה', at: 0 })).toBe('טויוטה');
  });

  it('returns null when there is nothing to describe', async () => {
    const { describeRecentSearch } = await import('@/lib/recentSearches');
    expect(describeRecentSearch({ plate: '1234567', at: 0 })).toBeNull();
  });
});

describe('describeRecentSearch — brand display', () => {
  it('cleans a raw registry name saved by an older version', async () => {
    const { describeRecentSearch } = await import('@/lib/recentSearches');
    expect(
      describeRecentSearch({ plate: '1234567', make: 'יונדאי טורקיה', model: 'I10', year: '2016', at: 0 })
    ).toBe('יונדאי I10 · 2016');
  });
});
