import auth from "@/lib/auth";

// Export the handler methods for Next.js API routes
// These map to: GET (signin callback), POST (signin/signup), etc.
export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "";
  
  return new Response(
    JSON.stringify({ 
      message: `Auth endpoint received path: ${path}`,
      hasAuth: auth !== undefined,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};

export const POST = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "";
  
  return new Response(
    JSON.stringify({ 
      message: `Auth POST endpoint received action: ${action}`,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};