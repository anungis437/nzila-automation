"use client";

export const dynamic = 'force-dynamic';

/**
 * Voting & Elections Page
 * 
 * Comprehensive elections management interface integrating:
 * - Ballot builder for creating elections
 * - Vote casting interface
 * - Election results dashboard
 * - Election schedule calendar
 * - Voter eligibility manager
 * - Election audit log
 * 
 * @page app/[locale]/voting/page.tsx
 */

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BallotBuilder } from "@/components/voting/ballot-builder";
import { VoteCastingInterface } from "@/components/voting/vote-casting-interface";
import { ElectionResultsDashboard } from "@/components/voting/election-results-dashboard";
import { ElectionScheduleCalendar } from "@/components/voting/election-schedule-calendar";
import { VoterEligibilityManager } from "@/components/voting/voter-eligibility-manager";
import { ElectionAuditLog } from "@/components/voting/election-audit-log";

export default function VotingPage() {
  const [showBallotBuilder, setShowBallotBuilder] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [elections, setElections] = React.useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeElection, setActiveElection] = React.useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [latestResults, setLatestResults] = React.useState<any>(null);

  React.useEffect(() => {
    async function loadElections() {
      try {
        const res = await fetch('/api/v2/elections');
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data?.elections ?? data?.data ?? [];
          setElections(items);
          const active = items.find((e: { status: string }) => e.status === 'active');
          if (active) {
            setActiveElection(active);
          }
          const completed = items.find((e: { status: string }) => e.status === 'completed');
          if (completed) {
            setLatestResults(completed);
          }
        }
      } catch { /* API not available */ }
    }
    loadElections();
  }, []);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Voting & Elections</h1>
          <p className="text-gray-600 mt-2">
            Participate in elections, view results, and manage voting processes
          </p>
        </div>
        <Button onClick={() => setShowBallotBuilder(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Election
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Elections</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeElection ? (
            <VoteCastingInterface
              ballot={{
                id: activeElection.id,
                title: activeElection.title ?? 'Election',
                description: activeElection.description ?? '',
                questions: activeElection.questions ?? [],
                isAnonymous: activeElection.isAnonymous ?? false,
                requiresVerification: activeElection.requiresVerification ?? false,
                allowsAbstain: activeElection.allowsAbstain ?? false,
              }}
              onSubmit={async (_votes) => {
                setActiveElection(null);
              }}
              onCancel={() => setActiveElection(null)}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No active elections at this time</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="results">
          <ElectionResultsDashboard
            results={latestResults ?? {
              id: "",
              title: "No Results",
              status: "upcoming",
              startDate: new Date(),
              endDate: new Date(),
              totalEligibleVoters: 0,
              totalVotesCast: 0,
              turnoutPercentage: 0,
              questions: [],
            }}
          />
        </TabsContent>

        <TabsContent value="schedule">
          <ElectionScheduleCalendar
            elections={elections}
            onSelectElection={(election) => setActiveElection(elections.find((e: { id: string }) => e.id === election.id) ?? null)}
          />
        </TabsContent>

        <TabsContent value="eligibility">
          <VoterEligibilityManager
            electionId={activeElection?.id ?? ""}
            electionTitle={activeElection?.title ?? "Voter Eligibility"}
            members={activeElection?.eligibleMembers ?? []}
          />
        </TabsContent>

        <TabsContent value="audit">
          <ElectionAuditLog
            electionId={activeElection?.id ?? ""}
            electionTitle={activeElection?.title ?? "Election Audit"}
            entries={activeElection?.auditEntries ?? []}
          />
        </TabsContent>
      </Tabs>

      {/* Ballot Builder Modal */}
      {showBallotBuilder && (
        <BallotBuilder
          onSave={async (_ballot) => {
setShowBallotBuilder(false);
          }}
          onCancel={() => setShowBallotBuilder(false)}
        />
      )}
    </div>
  );
}
