import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("apns2", () => {
  const sendMany = vi.fn();
  const send = vi.fn();
  const ApnsClient = vi.fn().mockImplementation(function () { return { send, sendMany }; });
  const Notification = vi.fn().mockImplementation(function (deviceToken: string, options: unknown) {
    return { deviceToken, options };
  });

  return {
    ApnsClient,
    Notification,
    Host: {
      production: "api.push.apple.com",
      development: "api.sandbox.push.apple.com",
    },
  };
});

vi.mock("@/lib/db", () => ({
  default: {
    pushDevice: { findMany: vi.fn() },
  },
}));

import * as PushService from "@/lib/services/push.service";
import prisma from "@/lib/db";
import { ApnsClient, Notification } from "apns2";

const mockedFindMany = vi.mocked(prisma.pushDevice.findMany);
const mockedApnsClient = ApnsClient as unknown as ReturnType<typeof vi.fn>;
const mockedNotification = vi.mocked(Notification);

function base64Key() {
  return Buffer.from(
    "-----BEGIN PRIVATE KEY-----\nMGYCAQEEWC4o+...\n-----END PRIVATE KEY-----"
  ).toString("base64");
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.APNS_ENABLED = "false";
  process.env.APNS_PRODUCTION = "false";
  process.env.APNS_TEAM_ID = "TEAMID1234";
  process.env.APNS_KEY_ID = "KEYID12345";
  process.env.APNS_SIGNING_KEY = base64Key();
  process.env.APNS_TOPIC = "com.boardgametools.ios";
  PushService._resetApnsClientForTests();
});

describe("PushService", () => {
  it("does nothing when APNS is disabled", async () => {
    await PushService.sendToUser("u1", { title: "T", body: "B" });

    expect(mockedFindMany).not.toHaveBeenCalled();
    expect(mockedApnsClient).not.toHaveBeenCalled();
  });

  it("returns early when the user has no devices", async () => {
    process.env.APNS_ENABLED = "true";
    mockedFindMany.mockResolvedValue([] as never);

    await PushService.sendToUser("u1", { title: "T", body: "B" });

    expect(mockedFindMany).toHaveBeenCalledWith({
      where: { userId: "u1", platform: "ios" },
    });
    expect(mockedApnsClient).not.toHaveBeenCalled();
  });

  it("sends one notification per device", async () => {
    process.env.APNS_ENABLED = "true";
    const sendMany = vi.fn().mockResolvedValue([undefined, undefined]);
    const send = vi.fn();
    mockedApnsClient.mockImplementation(function () { return { send, sendMany }; });

    mockedFindMany.mockResolvedValue([
      { deviceToken: "token-1" },
      { deviceToken: "token-2" },
    ] as never);

    await PushService.sendToUser("u1", {
      title: "Neue Event-Einladung",
      body: "Jemand hat dich eingeladen.",
      deepLink: "boardgametools://event/e1",
    });

    expect(mockedApnsClient).toHaveBeenCalledWith(
      expect.objectContaining({
        team: "TEAMID1234",
        keyId: "KEYID12345",
        defaultTopic: "com.boardgametools.ios",
        host: "api.sandbox.push.apple.com",
      })
    );
    expect(sendMany).toHaveBeenCalledTimes(1);

    const notifications = sendMany.mock.calls[0]?.[0] as Array<{ deviceToken: string; options: unknown }>;
    expect(notifications).toHaveLength(2);
    expect(notifications[0]?.deviceToken).toBe("token-1");
    expect(notifications[1]?.deviceToken).toBe("token-2");

    expect(mockedNotification).toHaveBeenCalledWith(
      "token-1",
      expect.objectContaining({
        alert: { title: "Neue Event-Einladung", body: "Jemand hat dich eingeladen." },
        sound: "default",
        data: { deepLink: "boardgametools://event/e1" },
      })
    );
  });

  it("uses the production host when configured", async () => {
    process.env.APNS_ENABLED = "true";
    process.env.APNS_PRODUCTION = "true";
    mockedFindMany.mockResolvedValue([{ deviceToken: "token" }] as never);
    const sendMany = vi.fn().mockResolvedValue([undefined]);
    mockedApnsClient.mockImplementation(function () { return { send: vi.fn(), sendMany }; });

    await PushService.sendToUser("u1", { title: "T", body: "B" });

    expect(mockedApnsClient).toHaveBeenCalledWith(
      expect.objectContaining({ host: "api.push.apple.com" })
    );
  });

  it("logs and skips when the signing key cannot be decoded", async () => {
    process.env.APNS_ENABLED = "true";
    process.env.APNS_SIGNING_KEY = "invalid";

    await PushService.sendToUser("u1", { title: "T", body: "B" });

    expect(mockedApnsClient).not.toHaveBeenCalled();
  });
});
