import { NextResponse } from "next/server";
import { getAvailableModels } from "@/lib/ai/getModels";

export async function GET() {
  try {
    const available = await getAvailableModels();
    return NextResponse.json(available.models, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch available models:", err);
    return NextResponse.json([], { status: 500 });
  }
}
