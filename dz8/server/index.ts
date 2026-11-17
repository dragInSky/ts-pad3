import express from 'express';
import type { Request, Response, ErrorRequestHandler } from 'express';
import pg from 'pg';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://dz8:dz8@localhost:5432/dz8' });
const app = express();
const CODE = '123456';

type Account = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  email_verified: boolean;
  phone_verified: boolean;
  version: number;
};

class HttpError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const digits = (value: string) => value.replace(/\D/g, '');
const token = (req: Request) => req.headers.cookie?.split(';').map(item => item.trim())
  .find(item => item.startsWith('dz8_session='))?.split('=')[1] || '';

function publicUser(user: Account) {
  return { id: user.id, name: user.name, email: user.email, phone: '+' + user.phone,
    emailVerified: user.email_verified, phoneVerified: user.phone_verified };
}

function profile(data: Record<string, unknown>) {
  const name = text(data.name);
  const email = text(data.email).toLowerCase();
  const phone = digits(text(data.phone));
  if (!name || name.length > 100) throw new HttpError('Введите имя до 100 символов');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError('Некорректная почта');
  if (phone.length < 10 || phone.length > 15) throw new HttpError('В телефоне должно быть от 10 до 15 цифр');
  return { name, email, phone };
}

function passwordHash(password: unknown) {
  if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
    throw new HttpError('Пароль должен быть от 6 до 128 символов');
  }
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(password, salt, 64).toString('hex');
}

function matches(password: unknown, hash: string) {
  if (typeof password !== 'string' || password.length > 128) return false;
  const [salt, expected] = hash.split(':');
  return timingSafeEqual(Buffer.from(expected, 'hex'), scryptSync(password, salt, 64));
}

async function startSession(req: Request, res: Response, user: Account) {
  const value = randomBytes(32).toString('hex');
  await db.query('delete from sessions where token = $1 or expires_at < now()', [token(req)]);
  const result = await db.query(`
    insert into sessions (token, user_id, version)
    select $1, id, version from users where id = $2 and version = $3
  `, [value, user.id, user.version]);
  if (!result.rowCount) throw new HttpError('Войдите снова', 401);
  res.cookie('dz8_session', value, { httpOnly: true, sameSite: 'lax', maxAge: 604800000 });
  res.json(publicUser(user));
}

app.use(express.json({ limit: '16kb' }));

app.post('/api/register', async (req, res) => {
  const { name, email, phone } = profile(req.body || {});
  const hash = passwordHash(req.body.password);
  const { rows } = await db.query<Account>(`
    insert into users (name, email, phone, password_hash)
    values ($1, $2, $3, $4) returning *
  `, [name, email, phone, hash]);
  res.status(201);
  await startSession(req, res, rows[0]);
});

app.post('/api/login', async (req, res) => {
  const login = text(req.body?.login).toLowerCase();
  const { rows } = await db.query<Account>('select * from users where email = $1 or phone = $2', [login, digits(login)]);
  if (!rows[0] || !matches(req.body?.password, rows[0].password_hash)) throw new HttpError('Неверный логин или пароль', 401);
  await startSession(req, res, rows[0]);
});

app.post('/api/logout', async (req, res) => {
  await db.query('delete from sessions where token = $1', [token(req)]);
  res.clearCookie('dz8_session');
  res.json(null);
});

app.use('/api', async (req, res, next) => {
  const { rows } = await db.query<Account>(`
    select u.* from users u join sessions s on s.user_id = u.id
    where s.token = $1 and s.expires_at > now() and s.version = u.version
  `, [token(req)]);
  if (!rows[0]) throw new HttpError('Требуется вход', 401);
  res.locals.user = rows[0];
  next();
});

app.get('/api/me', (_req, res) => res.json(publicUser(res.locals.user)));

app.post('/api/confirm', async (req, res) => {
  if (req.body?.code !== CODE) throw new HttpError('Неверный код');
  if (req.body.channel !== 'email' && req.body.channel !== 'phone') throw new HttpError('Выберите почту или телефон');
  const column = req.body.channel === 'email' ? 'email_verified' : 'phone_verified';
  const { rows } = await db.query<Account>(`update users set ${column} = true where id = $1 returning *`, [res.locals.user.id]);
  res.json(publicUser(rows[0]));
});

app.use('/api', (_req, res, next) => {
  const user: Account = res.locals.user;
  if (!user.email_verified && !user.phone_verified) throw new HttpError('Подтвердите почту или телефон', 403);
  next();
});

app.patch('/api/profile', async (req, res) => {
  const { name, email, phone } = profile(req.body || {});
  const { rows } = await db.query<Account>(`
    update users set name = $1, email_verified = email_verified and email = $2,
    phone_verified = phone_verified and phone = $3, email = $2, phone = $3
    where id = $4 returning *
  `, [name, email, phone, res.locals.user.id]);
  res.json(publicUser(rows[0]));
});

app.patch('/api/password', async (req, res) => {
  const user: Account = res.locals.user;
  if (!matches(req.body?.current, user.password_hash)) throw new HttpError('Текущий пароль неверный');
  const hash = passwordHash(req.body.password);
  const { rows } = await db.query<Account>(`
    update users set password_hash = $1, version = version + 1
    where id = $2 and password_hash = $3 returning *
  `, [hash, user.id, user.password_hash]);
  if (!rows[0]) throw new HttpError('Пароль уже изменён, войдите снова', 409);
  await startSession(req, res, rows[0]);
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Маршрут не найден' }));
app.use(express.static('dist'));

const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
  const status = error instanceof HttpError ? error.status : error.code === '23505' ? 409 :
    error.status === 400 || error.status === 413 ? error.status : 500;
  const message = error instanceof HttpError ? error.message : status === 409 ? 'Эта почта или телефон уже используются' :
    status === 500 ? 'Ошибка сервера' : 'Некорректный запрос';
  if (status === 500) console.error(error);
  res.status(status).json({ error: message });
};
app.use(handleError);

await db.query('select 1');
app.listen(Number(process.env.PORT || 3000), () => console.log('http://localhost:3000'));
