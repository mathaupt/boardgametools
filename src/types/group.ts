export interface SerializedGroupPollVote {
  id: string;
  optionId: string;
  voterName: string;
  userId: string | null;
  createdAt: string;
}

export interface SerializedGroupPollOption {
  id: string;
  pollId: string;
  text: string;
  sortOrder: number;
  votes: SerializedGroupPollVote[];
  _count: { votes: number };
}

export interface SerializedGroupPoll {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  createdById: string;
  createdAt: string;
  closedAt: string | null;
  createdBy: { id: string; name: string | null } | null;
  options: SerializedGroupPollOption[];
  _count: { comments: number };
}

export interface SerializedGroupComment {
  id: string;
  groupId: string;
  pollId: string | null;
  authorName: string;
  userId: string | null;
  content: string;
  createdAt: string;
}

export interface SerializedGroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: { id: string; name: string | null; email: string };
}

export interface SerializedGroup {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  isPublic: boolean;
  shareToken: string | null;
  password: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string | null; email: string };
  members: SerializedGroupMember[];
  polls: SerializedGroupPoll[];
  comments: SerializedGroupComment[];
}
