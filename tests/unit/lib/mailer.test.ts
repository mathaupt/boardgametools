import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSendMail = vi.fn().mockResolvedValue({ messageId: "test-id" });

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

describe("mailer", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.SMTP_HOST = "smtp.test.local";
    process.env.SMTP_PORT = "587";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("sendPasswordResetEmail sends with correct subject", async () => {
    const { sendPasswordResetEmail } = await import("@/lib/mailer");
    await sendPasswordResetEmail("user@test.com", "https://example.com/reset", new Date());
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@test.com",
        subject: "Passwort zurücksetzen",
      })
    );
  });

  it("sendEventInviteEmail includes event title in subject", async () => {
    const { sendEventInviteEmail } = await import("@/lib/mailer");
    await sendEventInviteEmail({
      to: "player@test.com",
      eventTitle: "Spieleabend",
      eventDate: new Date("2025-06-15T19:00:00"),
      inviterName: "Max",
      eventUrl: "https://example.com/event/1",
    });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "player@test.com",
        subject: "Einladung: Spieleabend",
      })
    );
  });

  it("sendEventReminderEmail sends reminder", async () => {
    const { sendEventReminderEmail } = await import("@/lib/mailer");
    await sendEventReminderEmail({
      to: "player@test.com",
      eventTitle: "Spieleabend",
      eventDate: new Date("2025-06-15T19:00:00"),
      inviterName: "Max",
      eventUrl: "https://example.com/event/1",
    });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Erinnerung: Spieleabend",
      })
    );
  });

  it("sendInviteResponseEmail handles accepted response", async () => {
    const { sendInviteResponseEmail } = await import("@/lib/mailer");
    await sendInviteResponseEmail({
      to: "organizer@test.com",
      eventTitle: "Spieleabend",
      responderName: "Lisa",
      response: "accepted",
      eventUrl: "https://example.com/event/1",
    });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "organizer@test.com",
        subject: expect.stringContaining("zugesagt"),
      })
    );
  });

  it("sendInviteResponseEmail handles declined response", async () => {
    const { sendInviteResponseEmail } = await import("@/lib/mailer");
    await sendInviteResponseEmail({
      to: "organizer@test.com",
      eventTitle: "Spieleabend",
      responderName: "Lisa",
      response: "declined",
      eventUrl: "https://example.com/event/1",
    });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("abgesagt"),
      })
    );
  });

  it("sendCustomEventMessage uses custom subject when provided", async () => {
    const { sendCustomEventMessage } = await import("@/lib/mailer");
    await sendCustomEventMessage({
      to: "player@test.com",
      subject: "Wichtige Info",
      eventTitle: "Spieleabend",
      eventDate: new Date("2025-06-15T19:00:00"),
      senderName: "Max",
      message: "Bitte bringt Snacks mit!",
      eventUrl: "https://example.com/event/1",
    });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Wichtige Info",
      })
    );
  });

  it("sendEventUpcomingReminder sends reminder with event title", async () => {
    const { sendEventUpcomingReminder } = await import("@/lib/mailer");
    await sendEventUpcomingReminder({
      to: "player@test.com",
      eventTitle: "Spieleabend",
      eventDate: new Date("2025-06-15T19:00:00"),
      organizerName: "Max",
      eventUrl: "https://example.com/event/1",
    });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("Spieleabend"),
      })
    );
  });
});
