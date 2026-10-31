import { ApiError } from "@/lib/require-auth";
import { withEventMutation } from "@/lib/services/event-mutation.service";
import * as PushService from "@/lib/services/push.service";
import logger from "@/lib/logger";

export async function closeEvent(userId: string, eventId: string, selectedGameId?: string, winningProposalId?: string) {
  const { updated, event } = await withEventMutation(
    { kind: "user", eventId, userId },
    "close",
    async ({ tx, event }) => {
      if (event.createdById !== userId) throw new ApiError(403, "Only the event creator may close voting.");

      const proposals = await tx.gameProposal.findMany({
        where: { eventId },
        select: {
          id: true,
          gameId: true,
          createdAt: true,
          _count: { select: { votes: true, guestVotes: true } },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      });
      let winningProposal: (typeof proposals)[number] | null = proposals[0] ?? null;

      if (winningProposalId) {
        winningProposal = proposals.find((proposal) => proposal.id === winningProposalId) ?? null;
        if (!winningProposal) throw new ApiError(400, "The selected proposal does not belong to this event.");
      } else if (selectedGameId) {
        winningProposal = proposals.find((proposal) => proposal.gameId === selectedGameId) ?? null;
        if (!winningProposal) throw new ApiError(400, "The selected game is not proposed for this event.");
      } else {
        winningProposal = [...proposals].sort((a, b) => {
          const votesA = a._count.votes + a._count.guestVotes;
          const votesB = b._count.votes + b._count.guestVotes;
          return votesB - votesA || a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id);
        })[0] ?? null;
      }

      const finalGameId = selectedGameId ?? winningProposal?.gameId ?? null;
      if (finalGameId) {
        const game = await tx.game.findFirst({ where: { id: finalGameId, deletedAt: null }, select: { id: true } });
        if (!game) throw new ApiError(400, "The selected game is no longer available.");
        if (winningProposal && winningProposal.gameId !== finalGameId) {
          throw new ApiError(400, "The selected game does not match the winning proposal.");
        }
      }

      const updated = await tx.event.update({
        where: { id: eventId },
        data: {
          status: "closed",
          selectedGameId: finalGameId,
          winningProposalId: winningProposal?.id ?? null,
        },
        include: { selectedGame: true },
      });
      return { updated, event };
    }
  );

  const winningGameName = updated.selectedGame?.name;
  for (const invite of event.invites) {
    try {
      await PushService.notifyEventClosed(invite.userId ?? invite.user?.id ?? userId, eventId, event.title, winningGameName);
    } catch (pushErr) {
      logger.error({ err: pushErr, inviteId: invite.id }, "Failed to send event closed push");
    }
  }
  return updated;
}
