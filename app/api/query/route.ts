const SAMPLE_RESPONSES = [
  {
    summary: "Quick project snapshot generated from local demo data.",
    bulletPoints: [
      "Acme Corp: OAuth scope finalized and implementation is in progress.",
      "TechStart Inc: Delivery pipeline is stable with no blocking issues.",
      "Global Solutions: Release timeline needs review due to integration delays.",
    ],
  },
  {
    summary: "Current status highlights from the local knowledge store.",
    bulletPoints: [
      "4 client streams are on track this week.",
      "2 clients need attention on integration tasks.",
      "1 client is currently blocked pending external dependency access.",
    ],
  },
  {
    summary: "Action-oriented digest prepared for your latest query.",
    bulletPoints: [
      "Prioritize blocked client follow-ups before sprint close.",
      "Review attention-tier projects in the next standup.",
      "Share pulse summary to stakeholders after validation.",
    ],
  },
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      query?: string;
      sessionId?: string | null;
    };

    const selected =
      SAMPLE_RESPONSES[Math.floor(Math.random() * SAMPLE_RESPONSES.length)];

    const query = body.query?.trim() || "";
    const answer = query
      ? `You asked: \"${query}\". Here is the best answer from local demo data.`
      : "Here is a local demo response based on your request.";

    return Response.json({
      success: true,
      data: {
        answer,
        summary: selected.summary,
        bulletPoints: selected.bulletPoints,
        sessionId: body.sessionId || `session-${Date.now()}`,
      },
    });
  } catch {
    return Response.json(
      {
        success: false,
        error: "Failed to process query",
      },
      { status: 500 }
    );
  }
}
