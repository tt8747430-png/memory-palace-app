/**
 * Seed script — Memory Palace App
 * Run: pnpm --filter @memory-palace/db seed
 *
 * Phase 1: placeholder only.
 * Phase 3 will populate palaces, rooms, and nodes with dev fixtures.
 */
async function seed() {
  console.log('🌱 Seed script: no data to seed in Phase 1.');
  console.log('   Phase 3 (Data Layer) will add palaces, rooms, and node fixtures.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
