import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://utiefqkcdkiyzjfybjfw.supabase.co";
const supabaseKey = "sb_publishable_x818hZmmrbtPK6F_JuD7oQ_mxWTdGO4";

export const supabase = createClient(supabaseUrl, supabaseKey);git add .