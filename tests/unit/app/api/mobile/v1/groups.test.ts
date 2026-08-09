import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  default: {
    $transaction: vi.fn(),
    apiLog: { create: vi.fn() },
    group: { findFirst: vi.fn() },
    groupMember: { findFirst: vi.fn(), create: vi.fn() },
    groupPoll: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    groupPollVote: { deleteMany: vi.fn(), create: vi.fn() },
    groupComment: { findMany: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/lib/api-auth", () => ({ apiAuth: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/services/group.service", () => ({
  GroupService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { GET as listGroups, POST as createGroup } from "@/app/api/mobile/v1/groups/route";
import { GET as getGroup, PUT as updateGroup, DELETE as deleteGroup } from "@/app/api/mobile/v1/groups/[id]/route";
import { POST as joinGroup } from "@/app/api/mobile/v1/groups/[id]/join/route";
import { GET as listPolls, POST as createPoll } from "@/app/api/mobile/v1/groups/[id]/polls/route";
import { POST as votePoll } from "@/app/api/mobile/v1/groups/[id]/polls/[pollId]/vote/route";
import { GET as listComments, POST as createComment } from "@/app/api/mobile/v1/groups/[id]/comments/route";

import { apiAuth } from "@/lib/api-auth";
import { GroupService } from "@/lib/services/group.service";
import prisma from "@/lib/db";

const mockedApiAuth = vi.mocked(apiAuth);
const mockedList = vi.mocked(GroupService.list);
const mockedCreate = vi.mocked(GroupService.create);
const mockedUpdate = vi.mocked(GroupService.update);
const mockedDelete = vi.mocked(GroupService.delete);
const mockedGroupFindFirst = vi.mocked(prisma.group.findFirst);
const mockedGroupMemberFindFirst = vi.mocked(prisma.groupMember.findFirst);
const mockedGroupMemberCreate = vi.mocked(prisma.groupMember.create);
const mockedGroupPollFindMany = vi.mocked(prisma.groupPoll.findMany);
const mockedGroupPollFindFirst = vi.mocked(prisma.groupPoll.findFirst);
const mockedGroupPollCreate = vi.mocked(prisma.groupPoll.create);
const mockedGroupPollVoteDeleteMany = vi.mocked(prisma.groupPollVote.deleteMany);
const mockedGroupPollVoteCreate = vi.mocked(prisma.groupPollVote.create);
const mockedGroupCommentFindMany = vi.mocked(prisma.groupComment.findMany);
const mockedGroupCommentCreate = vi.mocked(prisma.groupComment.create);
const mockedTransaction = vi.mocked(prisma.$transaction);

function authUser() {
  return { user: { id: "u1", email: "a@b.c", name: "Max", role: "USER" } };
}

const baseGroup = {
  id: "g1",
  name: "Game Night",
  description: null,
  ownerId: "u1",
  isPublic: false,
  shareToken: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  deletedAt: null,
  owner: { id: "u1", name: "Max", email: "a@b.c" },
  _count: { members: 1, polls: 0, events: 0 },
};

const fullGroup = {
  ...baseGroup,
  members: [
    {
      id: "m1",
      groupId: "g1",
      userId: "u1",
      role: "owner",
      joinedAt: new Date("2024-01-01"),
      user: { id: "u1", name: "Max", email: "a@b.c" },
    },
  ],
  events: [],
  polls: [],
  comments: [],
};

const samplePoll = {
  id: "p1",
  groupId: "g1",
  title: "Where to play?",
  description: null,
  type: "single",
  status: "open",
  createdById: "u1",
  closedAt: null,
  createdAt: new Date("2024-01-01"),
  createdBy: { id: "u1", name: "Max" },
  options: [
    {
      id: "o1",
      pollId: "p1",
      text: "Home",
      sortOrder: 0,
      votes: [],
      _count: { votes: 0 },
    },
    {
      id: "o2",
      pollId: "p1",
      text: "Cafe",
      sortOrder: 1,
      votes: [],
      _count: { votes: 0 },
    },
  ],
  _count: { comments: 0 },
};

const sampleComment = {
  id: "c1",
  groupId: "g1",
  pollId: null,
  authorName: "Max",
  userId: "u1",
  content: "Looking forward!",
  createdAt: new Date("2024-01-01"),
};

const sampleVote = {
  id: "v1",
  optionId: "o1",
  voterName: "Max",
  userId: "u1",
  createdAt: new Date("2024-01-01"),
};

function routeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function pollRouteContext(id: string, pollId: string) {
  return { params: Promise.resolve({ id, pollId }) };
}

describe("Mobile Group Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedTransaction.mockImplementation(async (cb: any) => cb(prisma));
  });

  describe("GET /api/mobile/v1/groups", () => {
    it("returns a list of groups as DTOs", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedList.mockResolvedValue([baseGroup] as never);

      const res = await listGroups(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups"),
        {}
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe("g1");
      expect(body[0].name).toBe("Game Night");
    });

    it("handles paginated responses", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedList.mockResolvedValue({
        data: [baseGroup],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      } as never);

      const res = await listGroups(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups?page=1&limit=10"),
        {}
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(mockedList).toHaveBeenCalledWith("u1", { page: 1, limit: 10 });
    });

    it("returns 401 when not authenticated", async () => {
      mockedApiAuth.mockResolvedValue(null as never);

      const res = await listGroups(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups"),
        {}
      );

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/mobile/v1/groups", () => {
    it("creates a group and returns a DTO", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedCreate.mockResolvedValue(baseGroup as never);

      const res = await createGroup(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups", {
          method: "POST",
          body: JSON.stringify({ name: "Game Night" }),
        }),
        {}
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.id).toBe("g1");
      expect(body.name).toBe("Game Night");
      expect(mockedCreate).toHaveBeenCalledWith("u1", { name: "Game Night" });
    });
  });

  describe("GET /api/mobile/v1/groups/[id]", () => {
    it("returns group details with members, polls, events and comments mapped to DTOs", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedGroupFindFirst.mockResolvedValue(fullGroup as never);

      const res = await getGroup(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups/g1"),
        routeContext("g1")
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.id).toBe("g1");
      expect(body.members).toHaveLength(1);
      expect(body.members[0].userId).toBe("u1");
      expect(body.polls).toEqual([]);
      expect(body.comments).toEqual([]);
      expect(body.events).toEqual([]);
    });

    it("returns 404 when group not found", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedGroupFindFirst.mockResolvedValue(null as never);

      const res = await getGroup(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups/g1"),
        routeContext("g1")
      );

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/mobile/v1/groups/[id]", () => {
    it("updates a group and returns a DTO", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedUpdate.mockResolvedValue({ ...baseGroup, name: "Game Night 2.0" } as never);

      const res = await updateGroup(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups/g1", {
          method: "PUT",
          body: JSON.stringify({ name: "Game Night 2.0" }),
        }),
        routeContext("g1")
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.name).toBe("Game Night 2.0");
      expect(mockedUpdate).toHaveBeenCalledWith("u1", "g1", { name: "Game Night 2.0" });
    });
  });

  describe("DELETE /api/mobile/v1/groups/[id]", () => {
    it("deletes a group and returns a german message", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedDelete.mockResolvedValue({} as never);

      const res = await deleteGroup(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups/g1", {
          method: "DELETE",
        }),
        routeContext("g1")
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.message).toBe("Gruppe gelöscht");
      expect(mockedDelete).toHaveBeenCalledWith("u1", "g1");
    });
  });

  describe("POST /api/mobile/v1/groups/[id]/join", () => {
    it("joins a group with a valid share token", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedGroupFindFirst.mockResolvedValue({
        id: "g1",
        shareToken: "secret-token",
        isPublic: false,
      } as never);
      mockedGroupMemberFindFirst.mockResolvedValue(null as never);
      mockedGroupMemberCreate.mockResolvedValue({
        id: "m2",
        groupId: "g1",
        userId: "u1",
        role: "member",
        joinedAt: new Date("2024-01-01"),
      } as never);

      const res = await joinGroup(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups/g1/join", {
          method: "POST",
          body: JSON.stringify({ shareToken: "secret-token" }),
        }),
        routeContext("g1")
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.role).toBe("member");
      expect(mockedGroupMemberCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            groupId: "g1",
            userId: "u1",
            role: "member",
          }),
        })
      );
    });

    it("rejects an invalid share token", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedGroupFindFirst.mockResolvedValue({
        id: "g1",
        shareToken: "secret-token",
        isPublic: false,
      } as never);

      const res = await joinGroup(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups/g1/join", {
          method: "POST",
          body: JSON.stringify({ shareToken: "wrong" }),
        }),
        routeContext("g1")
      );

      expect(res.status).toBe(403);
    });

    it("returns 409 when user is already a member", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedGroupFindFirst.mockResolvedValue({
        id: "g1",
        shareToken: "secret-token",
        isPublic: false,
      } as never);
      mockedGroupMemberFindFirst.mockResolvedValue({
        id: "m1",
        groupId: "g1",
        userId: "u1",
        role: "owner",
      } as never);

      const res = await joinGroup(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups/g1/join", {
          method: "POST",
          body: JSON.stringify({ shareToken: "secret-token" }),
        }),
        routeContext("g1")
      );

      expect(res.status).toBe(409);
    });
  });

  describe("GET /api/mobile/v1/groups/[id]/polls", () => {
    it("lists polls with options and votes as DTOs", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedGroupMemberFindFirst.mockResolvedValue({ id: "m1" } as never);
      mockedGroupPollFindMany.mockResolvedValue([samplePoll] as never);

      const res = await listPolls(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups/g1/polls"),
        routeContext("g1")
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe("p1");
      expect(body[0].options).toHaveLength(2);
      expect(body[0].options[0].votes).toEqual([]);
    });

    it("returns 403 when user is not a member", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedGroupMemberFindFirst.mockResolvedValue(null as never);

      const res = await listPolls(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups/g1/polls"),
        routeContext("g1")
      );

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/mobile/v1/groups/[id]/polls", () => {
    it("creates a poll and returns a DTO", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedGroupMemberFindFirst.mockResolvedValue({ id: "m1" } as never);
      mockedGroupPollCreate.mockResolvedValue(samplePoll as never);

      const res = await createPoll(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups/g1/polls", {
          method: "POST",
          body: JSON.stringify({
            title: "Where to play?",
            options: ["Home", "Cafe"],
          }),
        }),
        routeContext("g1")
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.id).toBe("p1");
      expect(body.title).toBe("Where to play?");
      expect(body.options).toHaveLength(2);
    });

    it("returns 400 when less than two options are provided", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedGroupMemberFindFirst.mockResolvedValue({ id: "m1" } as never);

      const res = await createPoll(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups/g1/polls", {
          method: "POST",
          body: JSON.stringify({
            title: "Where to play?",
            options: ["Home"],
          }),
        }),
        routeContext("g1")
      );

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/mobile/v1/groups/[id]/polls/[pollId]/vote", () => {
    it("votes on a poll option and returns vote DTOs", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedGroupMemberFindFirst.mockResolvedValue({ id: "m1" } as never);
      mockedGroupPollFindFirst.mockResolvedValue({
        id: "p1",
        groupId: "g1",
        status: "open",
        type: "single",
      } as never);
      mockedGroupPollVoteDeleteMany.mockResolvedValue({ count: 0 } as never);
      mockedGroupPollVoteCreate.mockResolvedValue(sampleVote as never);

      const res = await votePoll(
        new NextRequest(
          "http://localhost:3000/api/mobile/v1/groups/g1/polls/p1/vote",
          {
            method: "POST",
            body: JSON.stringify({ optionId: "o1" }),
          }
        ),
        pollRouteContext("g1", "p1")
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body).toHaveLength(1);
      expect(body[0].optionId).toBe("o1");
    });

    it("returns 400 when optionId is missing", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedGroupMemberFindFirst.mockResolvedValue({ id: "m1" } as never);
      mockedGroupPollFindFirst.mockResolvedValue({
        id: "p1",
        groupId: "g1",
        status: "open",
        type: "single",
      } as never);

      const res = await votePoll(
        new NextRequest(
          "http://localhost:3000/api/mobile/v1/groups/g1/polls/p1/vote",
          {
            method: "POST",
            body: JSON.stringify({}),
          }
        ),
        pollRouteContext("g1", "p1")
      );

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/mobile/v1/groups/[id]/comments", () => {
    it("lists comments as DTOs", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedGroupMemberFindFirst.mockResolvedValue({ id: "m1" } as never);
      mockedGroupCommentFindMany.mockResolvedValue([sampleComment] as never);

      const res = await listComments(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups/g1/comments"),
        routeContext("g1")
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].content).toBe("Looking forward!");
    });
  });

  describe("POST /api/mobile/v1/groups/[id]/comments", () => {
    it("creates a comment and returns a DTO", async () => {
      mockedApiAuth.mockResolvedValue(authUser() as never);
      mockedGroupMemberFindFirst.mockResolvedValue({ id: "m1" } as never);
      mockedGroupCommentCreate.mockResolvedValue(sampleComment as never);

      const res = await createComment(
        new NextRequest("http://localhost:3000/api/mobile/v1/groups/g1/comments", {
          method: "POST",
          body: JSON.stringify({ content: "Looking forward!" }),
        }),
        routeContext("g1")
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.content).toBe("Looking forward!");
      expect(body.authorName).toBe("Max");
    });
  });
});
