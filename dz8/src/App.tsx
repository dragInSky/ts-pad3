import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

type Channel = 'email' | 'phone';

function readForm(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  return Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState(false);
  const [tab, setTab] = useState('general');
  const [channel, setChannel] = useState<Channel | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const verified = user && (user.emailVerified || user.phoneVerified);
  const method = channel || 'email';

  useEffect(() => {
    request('me').finally(() => setLoading(false));
  }, []);

  function clearMessages() {
    setError('');
    setNotice('');
  }

  function resetView() {
    setChannel(null);
    setTab('general');
    setRegistration(false);
    clearMessages();
  }

  async function request(path: string, data?: Record<string, string>, method = data ? 'POST' : 'GET') {
    clearMessages();
    try {
      const response = await fetch('/api/' + path, {
        method, headers: data ? { 'Content-Type': 'application/json' } : undefined,
        body: data ? JSON.stringify(data) : undefined
      });
      const result = await response.json();
      if (response.status === 401) {
        setUser(null);
        if (path === 'me') return false;
      }
      if (!response.ok) throw new Error(result.error);
      setUser(result);
      return true;
    } catch (error) {
      setError(error instanceof TypeError ? 'Сервер недоступен' : (error as Error).message);
      return false;
    }
  }

  async function signUp(event: FormEvent<HTMLFormElement>) {
    const data = readForm(event);
    clearMessages();
    if (data.password !== data.repeat) return setError('Пароли не совпадают');
    if (await request('register', data)) resetView();
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    const data = readForm(event);
    if (await request('login', data)) resetView();
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    const data = readForm(event);
    if (await request('confirm', { ...data, channel: method })) {
      setChannel(null);
      setNotice('Контакт подтверждён');
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    const data = readForm(event);
    if (await request('profile', data, 'PATCH')) setNotice('Данные сохранены');
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const data = readForm(event);
    clearMessages();
    if (data.password !== data.repeat) return setError('Пароли не совпадают');
    if (await request('password', data, 'PATCH')) {
      form.reset();
      setNotice('Пароль изменён');
    }
  }

  if (loading) return <main>Загрузка...</main>;

  return (
    <main className={verified && !channel ? 'dashboard' : ''}>
      <header>
        <h1>Личный кабинет</h1>
        {user && <button className="link" onClick={async () => { if (await request('logout', {})) resetView(); }}>Выйти</button>}
      </header>
      {error && <p className="error" role="alert">{error}</p>}
      {notice && <p className="success" role="status">{notice}</p>}

      {!user && <>
        <h2>{registration ? 'Регистрация' : 'Вход'}</h2>
        <form key={String(registration)} onSubmit={registration ? signUp : signIn}>
          {registration ? <>
            <label>Имя<input name="name" autoComplete="name" required /></label>
            <label>Почта<input name="email" type="email" autoComplete="email" required /></label>
            <label>Телефон<input name="phone" type="tel" autoComplete="tel" required /></label>
          </> : <label>Почта или телефон<input name="login" autoComplete="username" required /></label>}
          <label>Пароль<input name="password" type="password" minLength={6} autoComplete={registration ? 'new-password' : 'current-password'} required /></label>
          {registration && <label>Повторите пароль<input name="repeat" type="password" minLength={6} autoComplete="new-password" required /></label>}
          <button>{registration ? 'Зарегистрироваться' : 'Войти'}</button>
        </form>
        <p className="hint">{registration ? 'Есть аккаунт?' : 'Нет аккаунта?'}{' '}
          <button className="link" onClick={() => { setRegistration(!registration); clearMessages(); }}>
            {registration ? 'Войти' : 'Регистрация'}
          </button>
        </p>
      </>}

      {user && (!verified || channel) && <>
        <h2>Подтверждение контакта</h2>
        <form onSubmit={confirm}>
          <label>Способ подтверждения
            <select value={method} onChange={event => { setChannel(event.target.value as Channel); clearMessages(); }}>
              <option value="email">Почта</option>
              <option value="phone">Телефон</option>
            </select>
          </label>
          <p className="hint">Контакт: {method === 'email' ? user.email : user.phone}</p>
          <label>Код<input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required /></label>
          <button>Подтвердить</button>
          {verified && <button type="button" className="link" onClick={() => { setChannel(null); clearMessages(); }}>Назад</button>}
        </form>
      </>}

      {user && verified && !channel && <>
        <p className="hint">{user.name}</p>
        <nav aria-label="Разделы профиля">
          <button className={tab === 'general' ? 'active' : ''} aria-pressed={tab === 'general'} onClick={() => { setTab('general'); clearMessages(); }}>Общие данные</button>
          <button className={tab === 'security' ? 'active' : ''} aria-pressed={tab === 'security'} onClick={() => { setTab('security'); clearMessages(); }}>Безопасность</button>
        </nav>
        {tab === 'general' ? <>
          <h2>Общие данные</h2>
          <form onSubmit={saveProfile}>
            <label>Имя<input name="name" defaultValue={user.name} autoComplete="name" required /></label>
            <label>Почта<input name="email" type="email" defaultValue={user.email} autoComplete="email" required /></label>
            <label>Телефон<input name="phone" type="tel" defaultValue={user.phone} autoComplete="tel" required /></label>
            <button>Сохранить</button>
          </form>
        </> : <>
          <h2>Безопасность</h2>
          <div className="contacts">
            <p>Почта: {user.email}<br />{user.emailVerified ? <span className="verified">Подтверждена</span> : <button className="link" onClick={() => { setChannel('email'); clearMessages(); }}>Подтвердить почту</button>}</p>
            <p>Телефон: {user.phone}<br />{user.phoneVerified ? <span className="verified">Подтверждён</span> : <button className="link" onClick={() => { setChannel('phone'); clearMessages(); }}>Подтвердить телефон</button>}</p>
          </div>
          <h3>Смена пароля</h3>
          <form onSubmit={savePassword}>
            <label>Текущий пароль<input name="current" type="password" autoComplete="current-password" required /></label>
            <label>Новый пароль<input name="password" type="password" minLength={6} autoComplete="new-password" required /></label>
            <label>Повторите пароль<input name="repeat" type="password" minLength={6} autoComplete="new-password" required /></label>
            <button>Изменить пароль</button>
          </form>
        </>}
      </>}
    </main>
  );
}
