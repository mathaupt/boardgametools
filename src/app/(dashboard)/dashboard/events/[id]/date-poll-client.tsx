"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2 } from "lucide-react";
import { getDateOnlyKey } from "@/lib/events/event-date";
import {
  collectDateParticipants,
  summarizeDateAvailability,
  type KnownDateParticipant,
} from "@/lib/events/date-availability";
import { DateProposalItem } from "@/components/event-voting/date-proposal-item";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { DateProposal } from "./date-poll-types";
import { DateCreateForm } from "./date-poll-create-form";
import { DateVotingMatrix } from "./date-poll-voting-matrix";
import { PollClosedBanner, ResetPollDialog } from "./date-poll-reset-dialog";
import { useDatePollController } from "./use-date-poll-controller";

export interface DatePollClientProps {
  eventId: string;
  userId: string | null;
  isCreator: boolean;
  canVoteDate: boolean;
  canManageDates: boolean;
  canSelectDate: boolean;
  canResetDates: boolean;
  blockedReason: string | null;
  knownParticipants?: KnownDateParticipant[];
  initialProposals: DateProposal[];
  selectedDate: string | null;
}

export default function DatePollClient(props: DatePollClientProps) {
  const poll = useDatePollController(props);
  const participants = useMemo(
    () => collectDateParticipants(poll.proposals, props.knownParticipants),
    [poll.proposals, props.knownParticipants],
  );
  const selectedKey = poll.finalDate ? getDateOnlyKey(poll.finalDate) : null;
  const pollUnavailable = !props.canVoteDate && !props.canManageDates && !props.canSelectDate && !props.canResetDates;
  const canVote = props.canVoteDate && !poll.pollClosed;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle as="h2" className="flex items-center gap-2">
              <Calendar className="h-5 w-5" aria-hidden="true" />
              Terminabstimmung
            </CardTitle>
            <CardDescription>
              {poll.proposals.length === 0
                ? "Noch keine Terminvorschläge erstellt"
                : `${poll.proposals.length} Terminvorschläge`}
            </CardDescription>
          </div>
          {props.isCreator && props.canManageDates && !poll.pollClosed && (
            <div className="flex flex-wrap gap-2">
              {poll.proposals.length > 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  className="min-h-11"
                  onClick={() => poll.setShowDeleteAllDialog(true)}
                  disabled={poll.loading}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Alle löschen
                </Button>
              )}
              <Button
                type="button"
                className="min-h-11"
                onClick={() => poll.setShowCreateForm((show) => !show)}
                disabled={poll.loading}
              >
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {poll.showCreateForm ? "Abbrechen" : "Termine erstellen"}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {poll.error && <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{poll.error}</p>}
        {pollUnavailable && props.blockedReason && poll.proposals.length === 0 && (
          <p className="text-sm text-muted-foreground" role="status">{props.blockedReason}</p>
        )}

        {poll.pollClosed && poll.finalDate && (
          <PollClosedBanner
            finalDate={poll.finalDate}
            canReset={props.isCreator && props.canResetDates}
            resetting={poll.resetting}
            onResetClick={() => poll.setShowResetDialog(true)}
          />
        )}

        {props.isCreator && props.canManageDates && !poll.pollClosed && poll.showCreateForm && (
          <DateCreateForm
            startDate={poll.startDate}
            endDate={poll.endDate}
            selectedWeekdays={poll.selectedWeekdays}
            loading={poll.loading}
            onStartDateChange={poll.setStartDate}
            onEndDateChange={poll.setEndDate}
            onToggleWeekday={poll.toggleWeekday}
            onSubmit={poll.createProposals}
          />
        )}

        {poll.proposals.length > 0 ? (
          <>
            <ul className="min-w-0 divide-y divide-border/70">
              {poll.proposals.map((proposal) => {
              const summary = summarizeDateAvailability(
                proposal,
                participants,
                props.userId ? `user:${props.userId}` : null,
              );
              return (
                <DateProposalItem
                  key={proposal.id}
                  proposal={proposal}
                  summary={summary}
                  canVote={canVote}
                  canSelect={props.isCreator && props.canSelectDate && !poll.pollClosed}
                  busy={poll.busyProposalIds.has(proposal.id)}
                  selecting={poll.selectingDateId === proposal.id}
                  selected={selectedKey !== null && getDateOnlyKey(proposal.date) === selectedKey}
                  activeParticipant={props.userId !== null}
                  unavailableReason={!canVote ? props.blockedReason ?? "Für diesen Termin ist keine Antwort mehr möglich." : null}
                  error={poll.voteErrors[proposal.id] || null}
                  onVote={(answer) => poll.vote(proposal.id, answer)}
                  onSelect={() => poll.selectDate(proposal.id)}
                />
              );
              })}
            </ul>
            {participants.length > 0 && (
              <details className="hidden min-w-0 lg:block">
                <summary className="flex min-h-11 cursor-pointer items-center rounded-md px-2 font-medium text-foreground underline-offset-4 hover:bg-muted hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Teilnehmer im Vergleich
                </summary>
                <div className="mt-3">
                  <DateVotingMatrix proposals={poll.proposals} selectedDate={poll.finalDate} knownParticipants={props.knownParticipants} />
                </div>
              </details>
            )}
          </>
        ) : !poll.showCreateForm && !poll.pollClosed ? (
          <div className="py-6">
            <h3 className="font-semibold text-foreground">Keine Terminvorschläge</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {props.isCreator && props.canManageDates
                ? "Erstelle Terminvorschläge, damit die Teilnehmer abstimmen können."
                : "Der Organisator hat noch keine Terminvorschläge erstellt."}
            </p>
          </div>
        ) : null}

        <ResetPollDialog
          open={poll.showResetDialog}
          onOpenChange={poll.setShowResetDialog}
          resetting={poll.resetting}
          onReset={poll.resetPoll}
        />

        <AlertDialog open={poll.showDeleteAllDialog} onOpenChange={poll.setShowDeleteAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alle Terminvorschläge löschen</AlertDialogTitle>
              <AlertDialogDescription>
                Alle Terminvorschläge und Abstimmungen werden gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="min-h-11">Abbrechen</AlertDialogCancel>
              <AlertDialogAction className="min-h-11" onClick={poll.deleteAllProposals}>Löschen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
