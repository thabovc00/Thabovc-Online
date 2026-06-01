import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hsxtlxjtfzmqyrtcbyqb.supabase.co'
const supabaseKey = 'sb_publishable_8ld4RpwnyH5B_A07dWoqcg_GPvAndDV'

export const supabase = createClient(supabaseUrl, supabaseKey)