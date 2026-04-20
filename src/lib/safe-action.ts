import { createSafeActionClient } from "next-safe-action";
import { createClient } from "@/lib/supabase/server";

export const action = createSafeActionClient();

export const authedAction = createSafeActionClient().use(async ({ next }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return next({ ctx: { user, supabase } });
});
