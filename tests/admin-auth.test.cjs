const { test } = require('node:test');
const assert = require('node:assert/strict');

test('admin authorization requires a verified user and active owner or operator membership', async () => {
  const { requireAdmin } = await import('../lib/server/admin-auth.mjs');
  const auth = user => ({ auth: { getUser: async () => ({ data: { user } }) } });
  const db = (membership, error = null) => ({ from(table) {
    assert.equal(table, 'admin_memberships');
    return { select() { return this; }, eq(key, value) { assert.equal(key, 'user_id'); assert.equal(value, 'verified-id'); return this; },
      maybeSingle: async () => ({ data: membership, error }) };
  } });
  await assert.rejects(() => requireAdmin(auth(null), { from: () => assert.fail() }), { status: 401 });
  for (const membership of [null, { role: 'analyst', active: true }, { role: 'operator', active: false }]) {
    await assert.rejects(() => requireAdmin(auth({ id: 'verified-id', user_metadata: { role: 'owner' } }), db(membership)), { status: 403 });
  }
  await assert.rejects(() => requireAdmin(auth({ id: 'verified-id' }), db(null, new Error('db'))), { status: 503 });
  assert.deepEqual(await requireAdmin(auth({ id: 'verified-id' }), db({ role: 'operator', active: true })), { userId: 'verified-id', role: 'operator' });
});
