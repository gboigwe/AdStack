/**
 * Encrypted User Messaging
 * Secure peer-to-peer messaging using Gaia storage
 */

import { putData, getData, listFiles } from './gaia-storage';
import { getStoragePath, generateFilename } from './gaia-config';
import { PrivateMessage } from '../types/user-profile';
import { getIdentityAddress } from './auth';
import { encryptString, decryptString } from './encryption';

export async function sendMessage(
  to: string,
  subject: string,
  body: string,
  threadId?: string
): Promise<PrivateMessage> {
  const from = getIdentityAddress();
  const messageId = generateFilename('msg', 'json').replace('.json', '');

  const encryptedBody = await encryptString(body);

  const message: PrivateMessage = {
    id: messageId,
    from,
    to,
    subject,
    body: encryptedBody,
    encrypted: true,
    read: false,
    sentAt: Date.now(),
    threadId
  };

  const path = getStoragePath('messages', `sent/${messageId}.json`);
  await putData(path, message, { encrypt: true });

  return message;
}

export async function getInbox(): Promise<PrivateMessage[]> {
  const messagesPath = getStoragePath('messages', 'inbox/');
  const messageFiles = await listFiles((filename) =>
    filename.startsWith(messagesPath) && filename.endsWith('.json')
  );

  const messages: PrivateMessage[] = [];
  for (const file of messageFiles) {
    const message = await getData<PrivateMessage>(file, { decrypt: true });
    if (message) {
      if (message.encrypted) {
        message.body = await decryptString(message.body);
      }
      messages.push(message);
    }
  }

  return messages.sort((a, b) => b.sentAt - a.sentAt);
}

export async function markAsRead(messageId: string): Promise<void> {
  const path = getStoragePath('messages', `inbox/${messageId}.json`);
  const message = await getData<PrivateMessage>(path, { decrypt: true });

  if (message) {
    message.read = true;
    message.readAt = Date.now();
    await putData(path, message, { encrypt: true });
  }
}

export default { sendMessage, getInbox, markAsRead };
