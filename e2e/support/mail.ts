import { expect } from '@playwright/test';
import { localSupabase } from './env';

interface MailpitSummary {
  ID: string;
  Subject: string;
}

async function mailpit<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${localSupabase().mailpitUrl}/api/v1${path}`, init);
  if (!response.ok) throw new Error(`Mailpit ${path}: ${response.status}`);
  return (await response.json()) as T;
}

export async function messagesTo(email: string): Promise<MailpitSummary[]> {
  const query = encodeURIComponent(`to:"${email}"`);
  const result = await mailpit<{ messages: MailpitSummary[] }>(`/search?query=${query}`);
  return result.messages;
}

/** Waits for the newest e-mail to `email` and returns the app's /auth/callback link in it. */
export async function latestAuthLink(email: string): Promise<string> {
  let messageId = '';
  await expect
    .poll(async () => (messageId = (await messagesTo(email))[0]?.ID ?? ''), {
      message: `No e-mail arrived for ${email}`,
      timeout: 20_000,
    })
    .not.toBe('');

  const message = await mailpit<{ Text: string }>(`/message/${messageId}`);
  const link = message.Text.match(/https?:\/\/\S+\/auth\/callback\?[^\s)\]>]+/)?.[0];
  if (!link) throw new Error(`No login link in e-mail to ${email}:\n${message.Text}`);
  return link.replaceAll('&amp;', '&');
}
