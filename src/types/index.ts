export interface Client {
    id: string
    user_id: string
    name: string
    linkedin_url?: string
    bio?: string
    goals?: string
    tone_preferences?: string
    industry?: string
    role?: string
    target_audience?: string
    approval_email?: string
    brand_colors?: any
    logo_url?: string
    onboarding_data?: any
    company_name?: string
    company_linkedin_url?: string
    created_at: string
}

export interface ClientProfileAudit {
    id: string
    client_id: string
    positioning_statement: string
    content_pillars: string[]
    tone_voice: string
    strengths_weaknesses: string
    audience_insights: string
    primary_goals?: string[]
    relevant_content?: string
    created_at: string
}

export interface ContentCalendarItem {
    id: string
    client_id: string
    title: string
    brief: string
    format: 'text' | 'story' | 'carousel'
    pillar: string
    status: 'pending' | 'approved' | 'rejected' | 'scheduled'
    audience_target?: string
    psychological_trigger?: string
    why_it_works?: string
    scheduled_date: string
    scheduled_time?: string
    media_url?: string
    media_type?: 'image' | 'video' | 'carousel' | 'pdf'
    caption?: string
    feedback_status?: 'draft' | 'sent' | 'approved' | 'changes_requested'
    feedback_notes?: string
    feedback_entries?: {
        id: string
        content: string
        created_at: string
        client_id: string
    }[]
    workflow_stage?: 'brief' | 'content'
    created_at: string
}

export interface ContentScript {
    id: string
    calendar_id: string
    content_text: string
    hook_variations: string[]
    cta: string
    hashtags: string[]
    version: number
    status: 'draft' | 'approved'
    draft_data?: any
    created_at: string
}
