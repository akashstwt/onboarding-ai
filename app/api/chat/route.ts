import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message, model } = await request.json();

    // Test data responses based on the message
    const responses = [
      {
        summary: "Here's a comprehensive overview of your client and project status from the database.",
        bulletPoints: [
          "Here are the full details regarding Acme Corp:\n\n*Project Overview:\nAcme Corp is involved in a \"Backend Development\" project, with a primary focus on implementing OAuth 2.0 for authentication. The project status is \"In Progress\".\n\nKey Request - OAuth 2.0 with Google and GitHub:\n   *Requested by:* John Smith from Acme Corp.\n*   *Request Date:* During a kickoff meeting on 2025-01-13.\n*   *Priority:* High, as the customer is waiting for this feature.\n*   *Business Value:* Aims to improve user experience, reduce login friction, and is considered critical for enterprise customers.\n\n*Customer Requirements for OAuth:\n   OAuth 2.0 flow implementation.\n*   Google OAuth integration.\n*   GitHub OAuth integration.\n*   Ability to link OAuth accounts to existing users.\n*   Graceful handling of OAuth errors.\n\n*Technical Details for OAuth Implementation:\n   Setup OAuth applications in Google Cloud Console.\n*   Setup OAuth applications in GitHub.\n*   Securely store client IDs and secrets.\n*   Configure callback URLs.\n*   Validate the OAuth state parameter.\n*   Verify OAuth tokens.\n\n*Meetings & Discussions:\n   *Acme Corp - Project Kickoff (Internal Meeting):* Held on 2024-12-20. This meeting kicked off the authentication project, addressing technical requirements and implementation details. Decisions were made regarding OAuth 2.0, JWT for session management, and bcrypt for password hashing, with initial action items assigned.\n\n*Financial/Deal Status:\n   A Pipedrive deal titled 'Acme Corp - Backend Development' was updated by Sarah Johnson.\n*   *Value:* $50,000\n*   *Status:* Open"
        ]
      },
      {
        summary: "Project status analysis shows positive momentum with some areas requiring attention.",
        bulletPoints: [
          "Project Alpha: 85% complete, on schedule for Feb 15 delivery",
          "Project Beta: Experiencing minor delays due to resource constraints",
          "Project Gamma: Ahead of schedule by 1 week, client very satisfied",
          "New Client Onboarding: 3 new projects in pipeline for next month",
          "Technical Debt: Reduced by 15% this quarter through dedicated sprints"
        ]
      },
      {
        summary: "Your AI assistant has analyzed the current state of all projects and clients.",
        bulletPoints: [
          "High Priority Tasks: 8 items require immediate attention this week",
          "Team Performance: All team members meeting or exceeding KPIs",
          "Budget Tracking: 11 of 12 projects within allocated budget ranges",
          "Quality Metrics: Zero critical bugs in production environments",
          "Client Communication: All clients contacted within last 48 hours"
        ]
      }
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json({
      response: message,
      summary: response.summary,
      bulletPoints: response.bulletPoints,
      model: model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
