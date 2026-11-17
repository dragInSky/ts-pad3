import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomInt } from 'node:crypto';
import pg from 'pg';

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://dz8:dz8@localhost:5432/dz8' });
const url = process.env.API_URL || 'http://localhost:3000';
after(() => db.end());

test('Регистрация, подтверждение, профиль, пароли и сессии', async () => {
  const email = 'test-' + randomBytes(6).toString('hex') + '@example.test';
  const phone = '79' + randomInt(100000000, 999999999);
  const data = { name: 'Студент', email, phone, password: 'student123' };
  let cookie = '';
  let id = '';

  async function request(path: string, body?: object, method = body ? 'POST' : 'GET', session = cookie) {
    const response = await fetch(url + '/api/' + path, {
      method, headers: { 'Content-Type': 'application/json', Cookie: session },
      body: body ? JSON.stringify(body) : undefined
    });
    const replacement = response.headers.get('set-cookie');
    if (replacement) cookie = replacement.split(';')[0];
    return { status: response.status, body: await response.json(), headers: response.headers };
  }

  try {
    assert.equal((await request('me')).status, 401);
    assert.equal((await request('register', { ...data, email: 'wrong' })).status, 400);
    assert.equal((await request('register', { ...data, password: '123' })).status, 400);
    const registered = await request('register', data);
    assert.equal(registered.status, 201);
    id = registered.body.id;
    assert.equal(registered.body.emailVerified, false);
    assert.equal(registered.body.password, undefined);
    assert.equal(registered.body.password_hash, undefined);
    assert.match(registered.headers.get('set-cookie')!, /HttpOnly/);
    assert.match(registered.headers.get('set-cookie')!, /SameSite=Lax/);
    assert.equal((await request('register', { ...data, email: email.toUpperCase() })).status, 409);
    assert.equal((await request('profile', data, 'PATCH')).status, 403);
    assert.equal((await request('password', { current: data.password, password: 'newpass123' }, 'PATCH')).status, 403);
    assert.equal((await request('confirm', { channel: 'email', code: '000000' })).status, 400);
    assert.equal((await request('confirm', { channel: 'invalid', code: '123456' })).status, 400);
    assert.equal((await request('confirm', { channel: 'email', code: '123456' })).body.emailVerified, true);
    assert.equal((await request('me')).body.id, id);

    const changedEmail = 'new-' + email;
    const profile = await request('profile', { ...data, name: "Иван 'Тест'", email: changedEmail }, 'PATCH');
    assert.equal(profile.status, 200);
    assert.equal(profile.body.name, "Иван 'Тест'");
    assert.equal(profile.body.emailVerified, false);
    assert.equal((await request('confirm', { channel: 'phone', code: '123456' })).body.phoneVerified, true);

    const firstSession = cookie;
    assert.equal((await request('login', { login: changedEmail.toUpperCase(), password: data.password }, 'POST', '')).status, 200);
    const secondSession = cookie;
    assert.equal((await request('password', { current: 'wrong', password: 'newpass123' }, 'PATCH')).status, 400);
    assert.equal((await request('password', { current: data.password, password: 'newpass123' }, 'PATCH')).status, 200);
    assert.equal((await request('me', undefined, 'GET', firstSession)).status, 401);
    assert.equal((await request('me', undefined, 'GET', secondSession)).status, 401);
    assert.equal((await request('me')).status, 200);
    assert.equal((await request('login', { login: changedEmail, password: data.password })).status, 401);
    assert.equal((await request('login', { login: "' or 1=1 --", password: 'newpass123' })).status, 401);
    assert.equal((await request('login', { login: '+' + phone, password: 'newpass123' })).status, 200);

    const stored = await db.query('select password_hash from users where id = $1', [id]);
    assert.notEqual(stored.rows[0].password_hash, 'newpass123');
    assert.match(stored.rows[0].password_hash, /^[a-f0-9]{32}:[a-f0-9]{128}$/);
    await db.query("update sessions set expires_at = now() - interval '1 minute' where token = $1", [cookie.split('=')[1]]);
    assert.equal((await request('me')).status, 401);
    assert.equal((await request('login', { login: changedEmail, password: 'newpass123' })).status, 200);
    assert.equal((await request('logout', {})).status, 200);
    assert.equal((await request('me')).status, 401);
  } finally {
    if (id) await db.query('delete from users where id = $1', [id]);
  }
});
