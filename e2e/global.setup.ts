import { test as setup } from '@playwright/test';
import { cleanTestData, openEvent } from './support/db';
import { localSupabase } from './support/env';

setup('reset test data and open the event', async () => {
  await cleanTestData();
  await openEvent();
  // Old e-mails could otherwise be mistaken for the ones a test is waiting for.
  await fetch(`${localSupabase().mailpitUrl}/api/v1/messages`, { method: 'DELETE' });
});
