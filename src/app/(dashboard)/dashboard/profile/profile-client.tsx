"use client";

import { User, Shield } from "lucide-react";
import { ProfileEditForm } from "./profile-edit-form";
import { PasswordChangeForm } from "./password-change-form";
import { ProfileActivityCards } from "./profile-activity-cards";
import { ProfileMessagesCard } from "./profile-messages-card";

interface ProfileUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface Invite {
  id: string;
  status: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string | null;
}

interface EventItem {
  id: string;
  title: string;
  eventDate: string;
  location: string | null;
  isCreator: boolean;
  proposalCount: number;
  inviteCount: number;
}

interface GroupItem {
  id: string;
  name: string;
  role: string;
  memberCount: number;
  pollCount: number;
  joinedAt: string;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  groupId: string;
  groupName: string;
  pollId: string | null;
  pollTitle: string | null;
}

interface SessionNote {
  id: string;
  notes: string;
  playedAt: string;
  gameId: string;
  gameName: string;
}

interface Props {
  user: ProfileUser;
  invites: Invite[];
  events: EventItem[];
  groups: GroupItem[];
  comments: CommentItem[];
  sessionNotes: SessionNote[];
}

export function ProfileClient({ user, invites, events, groups, comments, sessionNotes }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <User className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-sm text-muted-foreground">
            {user.email}
            {user.role === "ADMIN" && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Shield className="h-3 w-3" /> Admin
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mitglied seit {new Date(user.createdAt).toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Profile + Password */}
        <div className="space-y-6 lg:col-span-1">
          <ProfileEditForm user={user} />
          <PasswordChangeForm />
        </div>

        {/* Right column: Communication overview */}
        <ProfileActivityCards
          invites={invites}
          events={events}
          groups={groups}
        />
      </div>

      {/* Meine Nachrichten – ausklappbar */}
      <ProfileMessagesCard
        comments={comments}
        sessionNotes={sessionNotes}
      />
    </div>
  );
}
