import { ApnsClient, Host, Notification } from "apns2";
import prisma from "@/lib/db";
import { env } from "@/lib/env";
import logger from "@/lib/logger";

interface PushPayload {
  title: string;
  body: string;
  deepLink?: string;
  badge?: number;
}

let apnsClient: ApnsClient | null | undefined;

function isEnabled(): boolean {
  return env.APNS_ENABLED === "true" || env.APNS_ENABLED === "1";
}

function resolveSigningKey(raw?: string): string | null {
  if (!raw) return null;
  if (raw.includes("BEGIN PRIVATE KEY")) {
    return raw.replace(/\\n/g, "\n");
  }
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    return decoded.includes("BEGIN PRIVATE KEY") ? decoded : null;
  } catch {
    return null;
  }
}

export function _resetApnsClientForTests(): void {
  apnsClient = undefined;
}

function getClient(): ApnsClient | null {
  if (apnsClient !== undefined) return apnsClient;

  if (!isEnabled()) {
    apnsClient = null;
    return null;
  }

  const teamId = env.APNS_TEAM_ID;
  const keyId = env.APNS_KEY_ID;
  const signingKeyRaw = env.APNS_SIGNING_KEY;
  const topic = env.APNS_TOPIC;

  if (!teamId || !keyId || !signingKeyRaw || !topic) {
    logger.warn({ teamId: !!teamId, keyId: !!keyId, topic: !!topic }, "APNS konfiguriert, aber Team/Key/Topic fehlen");
    apnsClient = null;
    return null;
  }

  const signingKey = resolveSigningKey(signingKeyRaw);
  if (!signingKey) {
    logger.warn("APNS_SIGNING_KEY konnte nicht als PEM entschlüsselt werden");
    apnsClient = null;
    return null;
  }

  apnsClient = new ApnsClient({
    team: teamId,
    keyId,
    signingKey,
    defaultTopic: topic,
    host: env.APNS_PRODUCTION === "true" || env.APNS_PRODUCTION === "1" ? Host.production : Host.development,
  });

  return apnsClient;
}

function buildNotification(deviceToken: string, payload: PushPayload): Notification {
  return new Notification(deviceToken, {
    alert: { title: payload.title, body: payload.body },
    sound: "default",
    badge: payload.badge ?? 1,
    data: payload.deepLink ? { deepLink: payload.deepLink } : undefined,
  });
}

export async function sendToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!isEnabled()) return;

  const devices = await prisma.pushDevice.findMany({
    where: { userId, platform: "ios" },
  });

  if (devices.length === 0) return;

  const client = getClient();
  if (!client) return;

  const notifications = devices.map((d) => buildNotification(d.deviceToken, payload));
  const results = await client.sendMany(notifications);

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result && "error" in result) {
      logger.error({ err: result.error, deviceToken: devices[i]?.deviceToken, userId }, "Push-Versand fehlgeschlagen");
    }
  }
}

export async function sendToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  await Promise.all(userIds.map((id) => sendToUser(id, payload)));
}

export async function notifyEventInvite(
  userId: string,
  eventId: string,
  eventTitle: string,
  inviterName: string
): Promise<void> {
  await sendToUser(userId, {
    title: "Neue Event-Einladung",
    body: `${inviterName} hat dich zu "${eventTitle}" eingeladen.`,
    deepLink: `boardgametools://event/${eventId}`,
  });
}

export async function notifyEventClosed(
  userId: string,
  eventId: string,
  eventTitle: string,
  winningGameName?: string | null
): Promise<void> {
  const body = winningGameName
    ? `Die Abstimmung für "${eventTitle}" ist beendet. Gewonnen hat: ${winningGameName}.`
    : `Die Abstimmung für "${eventTitle}" ist beendet.`;

  await sendToUser(userId, {
    title: "Abstimmung beendet",
    body,
    deepLink: `boardgametools://event/${eventId}`,
  });
}

export async function notifyNewGameProposal(
  userId: string,
  eventId: string,
  eventTitle: string,
  proposerName: string,
  gameName: string
): Promise<void> {
  await sendToUser(userId, {
    title: "Neuer Spielvorschlag",
    body: `${proposerName} hat "${gameName}" für "${eventTitle}" vorgeschlagen.`,
    deepLink: `boardgametools://event/${eventId}`,
  });
}

export async function notifyNewVote(
  userId: string,
  eventId: string,
  eventTitle: string,
  voterName: string
): Promise<void> {
  await sendToUser(userId, {
    title: "Neue Stimme",
    body: `${voterName} hat bei "${eventTitle}" abgestimmt.`,
    deepLink: `boardgametools://event/${eventId}`,
  });
}

export async function notifySessionCreated(
  userId: string,
  gameId: string,
  gameName: string,
  creatorName: string
): Promise<void> {
  await sendToUser(userId, {
    title: "Neue Session",
    body: `${creatorName} hat eine Runde "${gameName}" aufgezeichnet.`,
    deepLink: `boardgametools://game/${gameId}`,
  });
}
