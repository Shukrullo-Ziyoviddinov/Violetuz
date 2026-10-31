'use strict';

const assert = require('node:assert/strict');
const collections = require('../config/collections');
const { profileHeatIndexSpecs, profileHeatUserIndexSpecs } = require('../repositories/indexes');
const { createProfileHeatRepo } = require('../repositories/profileHeat.repo');

const clone = (value) => {
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map(clone);
  if (value && typeof value === 'object') {
    const copy = {};
    Object.keys(value).forEach((key) => {
      copy[key] = clone(value[key]);
    });
    return copy;
  }
  return value;
};

const sameFilter = (row, filter) =>
  Object.keys(filter).every((key) => row[key] === filter[key]);

const createMemory = () => {
  const tables = new Map();
  const rowsOf = (name) => {
    if (!tables.has(name)) tables.set(name, []);
    return tables.get(name);
  };
  return {
    rowsOf,
    collection(name) {
      if (name === collections.reco.userProfiles) {
        throw new Error('user profile store was opened');
      }
      const rows = rowsOf(name);
      return {
        async findOne(filter) {
          const found = rows.find((row) => sameFilter(row, filter));
          return found ? clone(found) : null;
        },
        async replaceOne(filter, doc, options) {
          const index = rows.findIndex((row) => sameFilter(row, filter));
          if (index >= 0) rows[index] = clone(doc);
          else if (options && options.upsert) rows.push(clone(doc));
        },
        find(filter) {
          const list = rows.filter((row) => sameFilter(row, filter || {}));
          return {
            async toArray() {
              return list.map(clone);
            },
          };
        },
      };
    },
  };
};

const at = new Date('2026-10-31T12:00:00.000Z');

const run = async () => {
  assert.equal(collections.reco.profileHeat, 'reco_profile_heat');
  assert.equal(collections.reco.profileHeatUsers, 'reco_profile_heat_users');
  assert.ok(profileHeatIndexSpecs.some((spec) => spec.options.unique && spec.key.key === 1));
  assert.ok(
    profileHeatUserIndexSpecs.some(
      (spec) => spec.options.unique && spec.key.userId === 1 && spec.key.key === 1
    )
  );

  const db = createMemory();
  const repo = createProfileHeatRepo(db);

  const artist = await repo.saveHeat({
    key: 'artist:s:jah-khalib',
    kind: 'artist',
    id: 'jah-khalib',
    days: [
      { day: '2026-10-31', likes: 2, comments: 1, rewatches: 0 },
      { day: '2026-10-30', likes: 1, comments: 0, rewatches: 4 },
    ],
    updatedAt: at,
  });
  assert.equal(artist.id, 'jah-khalib');
  assert.equal(typeof artist.id, 'string');
  assert.deepEqual(artist.days.map((row) => row.day), ['2026-10-30', '2026-10-31']);

  const actor = await repo.saveHeat({
    key: 'actor:n:1',
    kind: 'actor',
    id: 1,
    days: [],
    updatedAt: at,
  });
  assert.equal(actor.id, 1);
  assert.equal(typeof actor.id, 'number');

  await repo.saveHeat({
    key: 'actor:s:1',
    kind: 'actor',
    id: '1',
    days: [],
    updatedAt: at,
  });

  const heatRows = db.rowsOf(collections.reco.profileHeat);
  assert.equal(heatRows.length, 3);
  assert.equal((await repo.listHeat()).length, 3);
  assert.equal(typeof heatRows.find((row) => row.key === 'actor:n:1').id, 'number');
  assert.equal(typeof heatRows.find((row) => row.key === 'actor:s:1').id, 'string');

  const found = await repo.findHeat('artist:s:jah-khalib');
  assert.equal(found.days[1].likes, 2);
  assert.equal(await repo.findHeat('artist:s:missing'), null);
  assert.equal(await repo.findHeat('not-a-key'), null);

  await assert.rejects(
    () => repo.saveHeat({
      key: 'artist:s:jah-khalib',
      kind: 'artist',
      id: 'other',
      days: [],
      updatedAt: at,
    }),
    /invalid profile heat/
  );
  assert.equal(heatRows.length, 3);

  const first = await repo.saveUserSlowdown({
    userId: 'user-1',
    key: 'artist:s:jah-khalib',
    kind: 'artist',
    id: 'jah-khalib',
    days: [{ day: '2026-10-31', passes: 2 }],
    updatedAt: at,
  });
  const second = await repo.saveUserSlowdown({
    userId: 'user-2',
    key: 'artist:s:jah-khalib',
    kind: 'artist',
    id: 'jah-khalib',
    days: [{ day: '2026-10-31', passes: 0 }],
    updatedAt: at,
  });
  assert.equal(first.userId, 'user-1');
  assert.equal(second.userId, 'user-2');
  assert.equal((await repo.findUserSlowdown('user-1', 'artist:s:jah-khalib')).days[0].passes, 2);
  assert.equal((await repo.findUserSlowdown('user-2', 'artist:s:jah-khalib')).days[0].passes, 0);
  assert.equal(await repo.findUserSlowdown('user-1', 'actor:n:1'), null);
  assert.equal(db.rowsOf(collections.reco.profileHeatUsers).length, 2);
  assert.equal(heatRows.length, 3);
  assert.equal(db.rowsOf(collections.reco.userProfiles).length, 0);

  await repo.saveUserSlowdown({
    userId: ' user-1 ',
    key: 'artist:s:jah-khalib',
    kind: 'artist',
    id: 'jah-khalib',
    days: [{ day: '2026-10-31', passes: 3 }],
    updatedAt: at,
  });
  assert.equal(db.rowsOf(collections.reco.profileHeatUsers).length, 2);
  assert.equal((await repo.findUserSlowdown('user-1', 'artist:s:jah-khalib')).days[0].passes, 3);

  await assert.rejects(
    () => repo.saveUserSlowdown({
      userId: 'user-1',
      key: 'artist:s:jah-khalib',
      kind: 'artist',
      id: 'jah-khalib',
      days: [{ day: '2026-10-31', passes: 1 }, { day: '2026-10-31', passes: 1 }],
      updatedAt: at,
    }),
    /invalid profile slowdown/
  );

  console.log('ok profileHeat repo');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
