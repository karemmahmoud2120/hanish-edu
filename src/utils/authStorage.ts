import type { AuthUser } from '../components/AuthModal';

const USERS_STORAGE_KEY = 'hanish_registered_users';
const PASSWORD_ITERATIONS = 210_000;

export type PasswordCredential = Pick<AuthUser, 'passwordHash' | 'passwordSalt'>;

export const readRegisteredUsers = (): AuthUser[] => {
  const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
  if (!storedUsers) return [];

  const users: unknown = JSON.parse(storedUsers);
  if (!Array.isArray(users) || users.some((user) =>
    !user ||
    typeof user.id !== 'string' ||
    typeof user.name !== 'string' ||
    typeof user.email !== 'string' ||
    !['student', 'parent', 'admin'].includes(user.role) ||
    (user.permissions !== undefined &&
      (!Array.isArray(user.permissions) ||
        user.permissions.some((permission: unknown) =>
          typeof permission !== 'string' ||
          !['lessons', 'quizzes', 'announcements', 'students', 'accounts', 'backup', 'links'].includes(permission)
        ))) ||
    (user.providerId !== undefined && typeof user.providerId !== 'string') ||
    (user.supervisorTitle !== undefined && typeof user.supervisorTitle !== 'string')
  )) {
    throw new Error('سجل الحسابات المحفوظ غير صالح.');
  }
  return users as AuthUser[];
};

export const saveRegisteredUsers = (users: AuthUser[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const createPasswordCredential = async (password: string): Promise<PasswordCredential> => {
  if (!window.crypto?.subtle) {
    throw new Error('المتصفح لا يدعم التشفير المطلوب. استخدم اتصالاً آمناً HTTPS.');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const key = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await window.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PASSWORD_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );

  return {
    passwordSalt: Array.from(salt, (byte) => byte.toString(16).padStart(2, '0')).join(''),
    passwordHash: Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join(''),
  };
};

export const verifyPassword = async (
  user: AuthUser,
  password: string
): Promise<{ valid: boolean; upgradedUser?: AuthUser }> => {
  if (user.passwordHash && user.passwordSalt) {
    const credential = await derivePasswordCredential(password, user.passwordSalt);
    return { valid: credential.passwordHash === user.passwordHash };
  }

  if (user.password && user.password === password) {
    const credential = await createPasswordCredential(password);
    const { password: _legacyPassword, ...userWithoutLegacyPassword } = user;
    return {
      valid: true,
      upgradedUser: { ...userWithoutLegacyPassword, ...credential },
    };
  }

  return { valid: false };
};

const derivePasswordCredential = async (password: string, saltHex: string): Promise<PasswordCredential> => {
  if (!window.crypto?.subtle) {
    throw new Error('المتصفح لا يدعم التحقق الآمن من كلمة المرور. استخدم اتصالاً آمناً HTTPS.');
  }

  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
  const key = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await window.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PASSWORD_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );

  return {
    passwordSalt: saltHex,
    passwordHash: Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join(''),
  };
};

export const toSessionUser = (user: AuthUser): AuthUser => {
  const { password: _password, passwordHash: _passwordHash, passwordSalt: _passwordSalt, ...sessionUser } = user;
  return sessionUser;
};
