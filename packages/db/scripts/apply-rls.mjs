import { config } from 'dotenv';
import postgres from 'postgres';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../../apps/web/.env.local'), override: false });

const url = process.env.DIRECT_DATABASE_URL;
if (!url) throw new Error('DIRECT_DATABASE_URL not set');

const sql = postgres(url, { ssl: 'require', max: 1 });

async function main() {
  console.log('Applying RLS policies and auth sync trigger...\n');

  await sql`
    CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
    RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public AS $$
    BEGIN
      INSERT INTO public.users (id, display_name, avatar_url)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END;
    $$
  `;

  await sql`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`;
  await sql`
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user()
  `;
  console.log('✅ auth.users → public.users sync trigger created');

  await sql`
    INSERT INTO public.users (id, display_name, avatar_url)
    SELECT
      id,
      COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
      raw_user_meta_data->>'avatar_url'
    FROM auth.users
    ON CONFLICT (id) DO NOTHING
  `;
  console.log('✅ Backfilled existing auth users');

  for (const table of [
    'users',
    'palaces',
    'rooms',
    'nodes',
    'edges',
    'tags',
    'node_tags',
    'practice_sessions',
    'node_review_state',
  ]) {
    await sql`ALTER TABLE ${sql(table)} ENABLE ROW LEVEL SECURITY`;
  }
  console.log('✅ RLS enabled on all tables');

  const drop = async (table, name) => sql`DROP POLICY IF EXISTS ${sql(name)} ON ${sql(table)}`;

  await drop('users', 'users_select_own');
  await drop('users', 'users_update_own');
  await sql`
    CREATE POLICY users_select_own ON users
      FOR SELECT USING (auth.uid() = id)
  `;
  await sql`
    CREATE POLICY users_update_own ON users
      FOR UPDATE USING (auth.uid() = id)
  `;
  console.log('✅ users policies');

  await drop('palaces', 'palaces_all_own');
  await sql`
    CREATE POLICY palaces_all_own ON palaces
      FOR ALL USING (auth.uid() = user_id)
  `;
  console.log('✅ palaces policies');

  await drop('rooms', 'rooms_all_own');
  await sql`
    CREATE POLICY rooms_all_own ON rooms
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM palaces p
          WHERE p.id = rooms.palace_id AND p.user_id = auth.uid()
        )
      )
  `;
  console.log('✅ rooms policies');

  await drop('nodes', 'nodes_all_own');
  await sql`
    CREATE POLICY nodes_all_own ON nodes
      FOR ALL USING (auth.uid() = user_id)
  `;
  console.log('✅ nodes policies');

  await drop('edges', 'edges_all_own');
  await sql`
    CREATE POLICY edges_all_own ON edges
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM nodes n
          WHERE n.id = edges.source_node_id AND n.user_id = auth.uid()
        )
      )
  `;
  console.log('✅ edges policies');

  await drop('tags', 'tags_all_own');
  await sql`
    CREATE POLICY tags_all_own ON tags
      FOR ALL USING (auth.uid() = user_id)
  `;
  console.log('✅ tags policies');

  await drop('node_tags', 'node_tags_all_own');
  await sql`
    CREATE POLICY node_tags_all_own ON node_tags
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM nodes n
          WHERE n.id = node_tags.node_id AND n.user_id = auth.uid()
        )
      )
  `;
  console.log('✅ node_tags policies');

  await drop('practice_sessions', 'practice_sessions_all_own');
  await sql`
    CREATE POLICY practice_sessions_all_own ON practice_sessions
      FOR ALL USING (auth.uid() = user_id)
  `;
  console.log('✅ practice_sessions policies');

  await drop('node_review_state', 'node_review_state_all_own');
  await sql`
    CREATE POLICY node_review_state_all_own ON node_review_state
      FOR ALL USING (auth.uid() = user_id)
  `;
  console.log('✅ node_review_state policies');

  console.log('\n✅ All RLS policies applied successfully.');
}

main()
  .catch((err) => {
    console.error('❌ RLS script failed:', err.message);
    process.exit(1);
  })
  .finally(() => sql.end());
