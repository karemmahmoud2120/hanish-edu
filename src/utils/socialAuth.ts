import type { AuthUser } from '../components/AuthModal';
import { readRegisteredUsers, saveRegisteredUsers } from './authStorage';

export type SocialProvider = 'google' | 'facebook';
export type SocialRole = 'student' | 'parent';

interface SocialProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface FacebookLoginResponse {
  authResponse?: { accessToken: string };
  status?: string;
}

interface FacebookSdk {
  init: (options: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
  login: (callback: (response: FacebookLoginResponse) => void, options: { scope: string }) => void;
}

interface GoogleSdk {
  accounts: {
    oauth2: {
      initTokenClient: (options: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
        error_callback: (error: { type?: string; message?: string }) => void;
      }) => { requestAccessToken: (options?: { prompt?: string }) => void };
    };
  };
}

declare global {
  interface Window {
    FB?: FacebookSdk;
    google?: GoogleSdk;
    fbAsyncInit?: () => void;
  }
}

let googleSdkPromise: Promise<GoogleSdk> | undefined;
let facebookSdkPromise: Promise<FacebookSdk> | undefined;

const loadScript = (id: string, src: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === 'true') {
      resolve();
      return;
    }

    const script = existing || document.createElement('script');
    const handleLoad = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    const handleError = () => reject(new Error('تعذر تحميل خدمة تسجيل الدخول. تحقق من اتصال الإنترنت وحاول مرة أخرى.'));

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    if (!existing) {
      script.id = id;
      script.src = src;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

const loadGoogleSdk = async (): Promise<GoogleSdk> => {
  if (window.google) return window.google;
  googleSdkPromise ??= loadScript('google-identity-sdk', 'https://accounts.google.com/gsi/client')
    .then(() => {
      if (!window.google) throw new Error('لم يتم تحميل خدمة Google بشكل صحيح.');
      return window.google;
    });
  return googleSdkPromise;
};

const loadFacebookSdk = (appId: string): Promise<FacebookSdk> => {
  if (window.FB) return Promise.resolve(window.FB);
  facebookSdkPromise ??= new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      if (!window.FB) {
        reject(new Error('لم يتم تحميل خدمة Facebook بشكل صحيح.'));
        return;
      }
      window.FB.init({ appId, cookie: true, xfbml: false, version: 'v21.0' });
      resolve(window.FB);
    };
    loadScript('facebook-jssdk', 'https://connect.facebook.net/en_US/sdk.js').catch(reject);
  });
  return facebookSdkPromise;
};

const requestGoogleAccessToken = async (clientId: string) => {
  const google = await loadGoogleSdk();
  return new Promise<string>((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || 'لم يوافق Google على تسجيل الدخول.'));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => reject(new Error(error.message || 'تعذر فتح نافذة تسجيل Google.')),
    });
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  });
};

const requestFacebookAccessToken = async (appId: string) => {
  const facebook = await loadFacebookSdk(appId);
  return new Promise<string>((resolve, reject) => {
    facebook.login((response) => {
      const accessToken = response.authResponse?.accessToken;
      if (!accessToken) {
        reject(new Error('تم إلغاء تسجيل الدخول عبر Facebook أو لم يتم منح الإذن.'));
        return;
      }
      resolve(accessToken);
    }, { scope: 'public_profile,email' });
  });
};

export const authenticateWithSocialProvider = async (
  provider: SocialProvider,
  role: SocialRole
): Promise<AuthUser> => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

  if (provider === 'google' && !clientId) {
    throw new Error('تسجيل Google غير مُعد بعد. أضف VITE_GOOGLE_CLIENT_ID إلى إعدادات البيئة.');
  }
  if (provider === 'facebook' && !facebookAppId) {
    throw new Error('تسجيل Facebook غير مُعد بعد. أضف VITE_FACEBOOK_APP_ID إلى إعدادات البيئة.');
  }

  const accessToken = provider === 'google'
    ? await requestGoogleAccessToken(clientId)
    : await requestFacebookAccessToken(facebookAppId);
  const response = await fetch(`/api/auth/${provider}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken }),
  });
  const result: SocialProfile & { error?: string } = await response.json();
  if (!response.ok) throw new Error(result.error || 'تعذر التحقق من حسابك لدى مزود تسجيل الدخول.');
  if (!result.id || !result.email || !result.name) {
    throw new Error('لم يرسل مزود تسجيل الدخول بيانات حساب مكتملة.');
  }

  const users = readRegisteredUsers();
  const existingSocialUser = users.find((user) => user.provider === provider && user.providerId === result.id);
  if (existingSocialUser) return existingSocialUser;

  const existingEmailUser = users.find((user) => user.email.toLowerCase() === result.email.toLowerCase());
  if (existingEmailUser) {
    throw new Error('هذا البريد مرتبط بحساب موجود بطريقة دخول أخرى. سجّل الدخول بالطريقة الأصلية أولاً.');
  }

  const user: AuthUser = {
    id: `usr-${crypto.randomUUID()}`,
    name: result.name,
    email: result.email.toLowerCase(),
    role,
    provider,
    providerId: result.id,
    avatar: result.avatar,
    createdAt: new Date().toISOString(),
  };
  saveRegisteredUsers([user, ...users]);
  return user;
};
