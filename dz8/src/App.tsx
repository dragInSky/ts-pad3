import { useState } from 'react';
import type { FormEvent } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

type Channel = 'email' | 'phone';
const CODE = '123456';
const digits = (phone: string) => phone.replace(/\D/g, '');

function readForm(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  return Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
}

export default function App() {
  const [users, setUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem('dz8-users') || '[]'));
  const [id, setId] = useState(sessionStorage.getItem('dz8-user') || '');
  const [registration, setRegistration] = useState(false);
  const [tab, setTab] = useState('general');
  const [channel, setChannel] = useState<Channel | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const user = users.find(item => item.id === id);
  const verified = user && (user.emailVerified || user.phoneVerified);
  const method = channel || 'email';

  function clearMessages() {
    setError('');
    setNotice('');
  }

  function store(next: User[]) {
    setUsers(next);
    localStorage.setItem('dz8-users', JSON.stringify(next));
  }

  function update(next: User) {
    store(users.map(item => item.id === next.id ? next : item));
  }

  function enter(userId: string) {
    setId(userId);
    sessionStorage.setItem('dz8-user', userId);
    setChannel(null);
    setTab('general');
    setRegistration(false);
    clearMessages();
  }

  function contactError(email: string, phone: string, exceptId = '') {
    if (digits(phone).length < 10 || digits(phone).length > 15) return 'В телефоне должно быть от 10 до 15 цифр';
    if (users.some(item => item.id !== exceptId && (item.email === email || digits(item.phone) === digits(phone)))) {
      return 'Эта почта или телефон уже используются';
    }
    return '';
  }

  function signUp(event: FormEvent<HTMLFormElement>) {
    const data = readForm(event);
    clearMessages();
    const email = data.email.trim().toLowerCase();
    const phone = data.phone.trim();
    const problem = contactError(email, phone);
    if (!data.name.trim()) return setError('Введите имя');
    if (problem) return setError(problem);
    if (data.password !== data.repeat) return setError('Пароли не совпадают');
    const account: User = {
      id: crypto.randomUUID(), name: data.name.trim(), email, phone,
      password: data.password, emailVerified: false, phoneVerified: false
    };
    store([...users, account]);
    enter(account.id);
  }

  function signIn(event: FormEvent<HTMLFormElement>) {
    const data = readForm(event);
    clearMessages();
    const login = data.login.trim().toLowerCase();
    const account = users.find(item => item.email === login || digits(item.phone) === digits(login));
    if (!account || account.password !== data.password) return setError('Неверный логин или пароль');
    enter(account.id);
  }

  function confirm(event: FormEvent<HTMLFormElement>) {
    const data = readForm(event);
    clearMessages();
    if (!user) return;
    if (data.code !== CODE) return setError('Неверный код');
    update({ ...user, emailVerified: user.emailVerified || method === 'email', phoneVerified: user.phoneVerified || method === 'phone' });
    setChannel(null);
    setNotice('Контакт подтверждён');
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    const data = readForm(event);
    clearMessages();
    if (!user) return;
    const email = data.email.trim().toLowerCase();
    const phone = data.phone.trim();
    const problem = contactError(email, phone, user.id);
    if (!data.name.trim()) return setError('Введите имя');
    if (problem) return setError(problem);
    update({ ...user, name: data.name.trim(), email, phone,
      emailVerified: user.emailVerified && email === user.email,
      phoneVerified: user.phoneVerified && digits(phone) === digits(user.phone)
    });
    setNotice('Данные сохранены');
  }

  function savePassword(event: FormEvent<HTMLFormElement>) {
    const data = readForm(event);
    clearMessages();
    if (!user) return;
    if (data.current !== user.password) return setError('Текущий пароль неверный');
    if (data.password !== data.repeat) return setError('Пароли не совпадают');
    update({ ...user, password: data.password });
    event.currentTarget.reset();
    setNotice('Пароль изменён');
  }

  return (
    <main className={verified && !channel ? 'dashboard' : ''}>
      <header>
        <h1>Личный кабинет</h1>
        {user && <button className="link" onClick={() => enter('')}>Выйти</button>}
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
