"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Vote, Plus } from "lucide-react";
import { SerializedGroup } from "@/types/group";
import { CreatePollForm } from "./create-poll-form";
import { PollCard } from "./poll-card";

interface GroupPollsSectionProps {
  group: SerializedGroup;
  userId: string;
  isOwner: boolean;
  showCreatePoll: boolean;
  onToggleCreatePoll: () => void;
  loading: string;
  setLoading: (value: string) => void;
  onPollCreated: () => void;
  onRefresh: () => void;
}

export function GroupPollsSection({
  group,
  userId,
  isOwner,
  showCreatePoll,
  onToggleCreatePoll,
  loading,
  setLoading,
  onPollCreated,
  onRefresh,
}: GroupPollsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Abstimmungen ({group.polls.length})
            </CardTitle>
            <CardDescription>Erstelle Umfragen und stimme ab</CardDescription>
          </div>
          <Button onClick={onToggleCreatePoll}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Abstimmung
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Poll Form */}
        {showCreatePoll && <CreatePollForm groupId={group.id} loading={loading} setLoading={setLoading} onCreated={onPollCreated} onCancel={onToggleCreatePoll} />}

        {/* Poll List */}
        {group.polls.length === 0 && !showCreatePoll ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🗳️</div>
            <h3 className="font-semibold mb-2">Noch keine Abstimmungen</h3>
            <p className="text-muted-foreground mb-4">
              Erstelle eine Abstimmung, um die Meinung der Gruppe einzuholen.
            </p>
          </div>
        ) : (
          group.polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} groupId={group.id} userId={userId} isOwner={isOwner} onRefresh={onRefresh} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
