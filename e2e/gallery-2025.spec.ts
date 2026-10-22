import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from './support/fixtures';
import { createUser, db, userClient } from './support/db';

const GALLERY_YEAR = 2025;

test('the 2025 gallery is closed for photo uploads', async () => {
  // A 2025 participant with an entry, made directly since 2025 registration is closed.
  const user = await createUser({ label: 'gallery2025' });
  const { data: participant, error: participantError } = await db()
    .from('participants')
    .insert({
      user_id: user.id,
      email: user.email,
      full_name: user.fullName,
      bib_number: 90000 + Math.floor(Math.random() * 9999),
      event_year: GALLERY_YEAR,
    })
    .select('id')
    .single();
  expect(participantError).toBeNull();
  const { data: completion, error: completionError } = await db()
    .from('completions')
    .insert({
      participant_id: participant!.id,
      completed_date: '2025-11-15',
      event_year: GALLERY_YEAR,
    })
    .select('id')
    .single();
  expect(completionError).toBeNull();

  const client = await userClient(user);
  const filePath = `multi/${GALLERY_YEAR}/${participant!.id}/e2e.jpg`;
  const photo = await readFile(path.join(__dirname, 'fixtures', 'run.jpg'));

  const upload = await client.storage
    .from('completion-photos')
    .upload(filePath, photo, { contentType: 'image/jpeg' });
  expect(upload.error).not.toBeNull();

  const insert = await client.from('photos').insert({
    completion_id: completion!.id,
    participant_id: participant!.id,
    event_year: GALLERY_YEAR,
    image_url: `https://example.test/${filePath}`,
  });
  expect(insert.error).not.toBeNull();

  const { count } = await db()
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('completion_id', completion!.id);
  expect(count).toBe(0);
});
