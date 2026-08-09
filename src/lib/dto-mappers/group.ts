import type {
  GroupDTO,
  GroupMemberDTO,
  GroupPollDTO,
  GroupPollOptionDTO,
  GroupPollVoteDTO,
  GroupCommentDTO,
} from "@/lib/sync-types";
import { iso } from "./utils";

export function toGroupMemberDto(member: {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  joinedAt: Date;
}): GroupMemberDTO {
  return {
    id: member.id,
    groupId: member.groupId,
    userId: member.userId,
    role: member.role,
    joinedAt: iso(member.joinedAt) as string,
  };
}

export function toGroupPollVoteDto(vote: {
  id: string;
  optionId: string;
  voterName: string;
  userId: string | null;
  createdAt: Date;
}): GroupPollVoteDTO {
  return {
    id: vote.id,
    optionId: vote.optionId,
    voterName: vote.voterName,
    userId: vote.userId,
    createdAt: iso(vote.createdAt) as string,
  };
}

export function toGroupPollOptionDto(option: {
  id: string;
  pollId: string;
  text: string;
  sortOrder: number;
  votes?: { id: string; optionId: string; voterName: string; userId: string | null; createdAt: Date }[];
}): GroupPollOptionDTO {
  return {
    id: option.id,
    pollId: option.pollId,
    text: option.text,
    sortOrder: option.sortOrder,
    votes: option.votes?.map(toGroupPollVoteDto),
  };
}

export function toGroupPollDto(poll: {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  createdById: string;
  closedAt: Date | null;
  options?: { id: string; pollId: string; text: string; sortOrder: number; votes?: { id: string; optionId: string; voterName: string; userId: string | null; createdAt: Date }[] }[];
  createdAt: Date;
}): GroupPollDTO {
  return {
    id: poll.id,
    groupId: poll.groupId,
    title: poll.title,
    description: poll.description,
    type: poll.type,
    status: poll.status,
    createdById: poll.createdById,
    closedAt: iso(poll.closedAt),
    options: poll.options?.map(toGroupPollOptionDto),
    createdAt: iso(poll.createdAt) as string,
  };
}

export function toGroupCommentDto(comment: {
  id: string;
  groupId: string;
  pollId: string | null;
  authorName: string;
  userId: string | null;
  content: string;
  createdAt: Date;
}): GroupCommentDTO {
  return {
    id: comment.id,
    groupId: comment.groupId,
    pollId: comment.pollId,
    authorName: comment.authorName,
    userId: comment.userId,
    content: comment.content,
    createdAt: iso(comment.createdAt) as string,
  };
}

export function toGroupDto(group: {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  isPublic: boolean;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): GroupDTO {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    ownerId: group.ownerId,
    isPublic: group.isPublic,
    shareToken: group.shareToken,
    createdAt: iso(group.createdAt) as string,
    updatedAt: iso(group.updatedAt) as string,
    deletedAt: iso(group.deletedAt),
  };
}
