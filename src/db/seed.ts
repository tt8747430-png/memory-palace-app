import { getDb } from './client';
import { nodeTags, nodes, palaces, rooms, tags, users } from './schema';

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
const PALACE_ID = '00000000-0000-0000-0000-000000000002';
const ROOM_A_ID = '00000000-0000-0000-0000-000000000003';
const ROOM_B_ID = '00000000-0000-0000-0000-000000000004';
const NODE_1_ID = '00000000-0000-0000-0000-000000000005';
const NODE_2_ID = '00000000-0000-0000-0000-000000000006';
const NODE_3_ID = '00000000-0000-0000-0000-000000000007';
const TAG_ID = '00000000-0000-0000-0000-000000000008';

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed script must not run in production.');
  }

  const db = getDb();

  await db.insert(users).values({ id: DEV_USER_ID, displayName: 'Dev User' }).onConflictDoNothing();

  await db
    .insert(palaces)
    .values({
      id: PALACE_ID,
      userId: DEV_USER_ID,
      title: 'Ancient Rome',
      description: 'My first memory palace',
    })
    .onConflictDoNothing();

  await db
    .insert(rooms)
    .values([
      { id: ROOM_A_ID, palaceId: PALACE_ID, title: 'Forum', position: 0 },
      { id: ROOM_B_ID, palaceId: PALACE_ID, title: 'Colosseum', position: 1 },
    ])
    .onConflictDoNothing();

  await db
    .insert(nodes)
    .values([
      {
        id: NODE_1_ID,
        roomId: ROOM_A_ID,
        userId: DEV_USER_ID,
        title: 'SPQR',
        content: 'Senatus Populusque Romanus — the motto of the Roman Republic.',
        positionX: 100,
        positionY: 150,
      },
      {
        id: NODE_2_ID,
        roomId: ROOM_A_ID,
        userId: DEV_USER_ID,
        title: 'Julius Caesar',
        content: 'Veni, vidi, vici.',
        positionX: 300,
        positionY: 200,
      },
      {
        id: NODE_3_ID,
        roomId: ROOM_B_ID,
        userId: DEV_USER_ID,
        title: 'Gladiators',
        content: 'Professional fighters who entertained audiences in violent confrontations.',
        positionX: 150,
        positionY: 250,
        nodeType: 'text',
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(tags)
    .values({ id: TAG_ID, userId: DEV_USER_ID, name: 'history' })
    .onConflictDoNothing();

  await db
    .insert(nodeTags)
    .values([
      { nodeId: NODE_1_ID, tagId: TAG_ID },
      { nodeId: NODE_2_ID, tagId: TAG_ID },
    ])
    .onConflictDoNothing();

  console.log('✅ Seed complete — 1 user, 1 palace, 2 rooms, 3 nodes, 1 tag');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
