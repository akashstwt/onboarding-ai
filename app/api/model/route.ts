import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { model } = await request.json();

    console.log(`Model changed to: ${model}`);

    return NextResponse.json({
      success: true,
      model: model,
      message: `Successfully switched to ${model}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in model API:", error);
    return NextResponse.json(
      { error: "Failed to change model" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    models: [
      { id: "gpt-4", name: "GPT-4", description: "Most capable model" },
      { id: "Grok", name: "Grok", description: "Fast and efficient" },
      { id: "claude", name: "Claude", description: "Anthropic's model" },
      { id: "gemini", name: "Gemini", description: "Google's model" },
    ],
    currentModel: "GPT-4",
  });
}
