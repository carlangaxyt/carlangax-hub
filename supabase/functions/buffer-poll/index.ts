import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BUFFER_ORG_ID = "6a9702a82ac77445c60538e6";

const SERVICE_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  twitter: "X (Twitter)",
  pinterest: "Pinterest",
  bluesky: "Bluesky",
  threads: "Threads",
  mastodon: "Mastodon",
  googlebusiness: "Google Business",
  substack: "Substack",
};

const POSTS_QUERY = `
  query PollPosts($organizationId: OrganizationId!) {
    posts(
      input: {
        organizationId: $organizationId
        filter: { status: [sent, error] }
      }
      first: 100
    ) {
      edges {
        node {
          id
          status
          text
          sentAt
          externalLink
          channelService
          channel {
            displayName
            name
          }
          error {
            message
          }
        }
      }
    }
  }
`;

function safeTruncate(text: string, max: number) {
  const chars = Array.from(text);
  return chars.length > max ? chars.slice(0, max).join("") + "…" : text;
}

async function bufferGraphQL(token: string, query: string, variables: Record<string, unknown>) {
  const body = JSON.stringify({ query, variables });
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  let res = await fetch("https://api.buffer.com/graphql", { method: "POST", headers, body });
  if (res.status === 404) {
    res = await fetch("https://api.buffer.com", { method: "POST", headers, body });
  }
  if (!res.ok) {
    throw new Error(`Buffer API error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(`Buffer GraphQL error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: tokenRow, error: tokenError } = await supabase.rpc("get_buffer_access_token");
  if (tokenError || !tokenRow) {
    return new Response(
      JSON.stringify({ error: "Buffer access token not configured", detail: tokenError?.message }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
  const bufferToken = tokenRow as string;

  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError || !users?.users?.length) {
    return new Response(
      JSON.stringify({ error: "No user found", detail: usersError?.message }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
  const userId = users.users[0].id;

  let data;
  try {
    data = await bufferGraphQL(bufferToken, POSTS_QUERY, { organizationId: BUFFER_ORG_ID });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Buffer query failed", detail: String(err) }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  const posts = (data?.posts?.edges ?? []).map((e: { node: Record<string, unknown> }) => e.node);
  if (posts.length === 0) {
    return new Response(JSON.stringify({ checked: 0, created: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: existing } = await supabase
    .from("notifications")
    .select("metadata")
    .in("type", ["buffer_post_sent", "buffer_post_error"]);

  const alreadyNotified = new Set(
    (existing ?? [])
      .map((row: { metadata: { postId?: string } }) => row.metadata?.postId)
      .filter(Boolean),
  );

  const toInsert = posts
    .filter((p: { id: string }) => !alreadyNotified.has(p.id))
    .map((p: Record<string, unknown>) => {
      const service = String(p.channelService ?? "");
      const platform = SERVICE_LABEL[service] ?? service;
      const channel = p.channel as { displayName?: string; name?: string } | null;
      const channelName = channel?.displayName ?? channel?.name ?? platform;
      const isError = p.status === "error";
      const errorInfo = p.error as { message?: string } | null;

      return {
        user_id: userId,
        type: isError ? "buffer_post_error" : "buffer_post_sent",
        title: isError ? `Error al publicar en ${platform}` : `Video publicado en ${platform}`,
        body: isError
          ? (errorInfo?.message ?? "Buffer reportó un error al publicar.")
          : safeTruncate(String(p.text ?? ""), 200),
        link: (p.externalLink as string) ?? null,
        metadata: { postId: p.id, service, channel: channelName },
      };
    });

  const failures: Record<string, unknown>[] = [];
  let created = 0;
  for (const row of toInsert) {
    const { error: insertError } = await supabase.from("notifications").insert(row);
    if (insertError) {
      failures.push({ row, message: insertError.message, code: insertError.code });
    } else {
      created++;
    }
  }
  if (failures.length > 0) {
    return new Response(
      JSON.stringify({ error: "Some inserts failed", failures }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ checked: posts.length, created }),
    { headers: { "Content-Type": "application/json" } },
  );
});
