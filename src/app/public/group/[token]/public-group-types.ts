export interface GroupVote {
  id: string;
  voterName: string;
}

export interface GroupPollOption {
  id: string;
  text: string;
  _count?: { votes: number };
  votes?: GroupVote[];
}

export interface GroupComment {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface GroupPoll {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdBy?: { name: string };
  options: GroupPollOption[];
  comments?: GroupComment[];
}
