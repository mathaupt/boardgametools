export function canDeleteEventProposal(input: {
  createdById: string;
  userId: string;
  proposedById: string | null;
}): boolean {
  return input.createdById === input.userId || input.proposedById === input.userId;
}
