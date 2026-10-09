import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract optional fields; be permissive so frontend can send whatever
    const { name, email, company, plan, consent } = body || {};

    // Minimal validation — you can expand this later with DB writes, etc.
    if (!name && !email && !company) {
      return new Response(
        JSON.stringify({ error: "Provide at least name, email, or company." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ⬇️ TODO: persist to your DB / send welcome email / etc.
    // For now we just acknowledge receipt.
    const response = {
      success: true,
      received: {
        ...(name && { name }),
        ...(email && { email }),
        ...(company && { company }),
        ...(plan && { plan }),
        ...(consent && { consent }),
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("/api/get-started error:", err);
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}