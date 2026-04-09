-- Phase 4: Community Features (4.7)

-- 1. Study Groups Table
CREATE TABLE IF NOT EXISTS public.study_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) NOT NULL,
    subject_id UUID REFERENCES public.subjects(id),
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Study Group Members
CREATE TABLE IF NOT EXISTS public.study_group_members (
    group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (group_id, user_id)
);

-- 3. Study Group Messages (Group Chat)
CREATE TABLE IF NOT EXISTS public.study_group_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Direct Messages Table
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. RLS Policies
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read: study_groups" ON public.study_groups FOR SELECT USING (true);
CREATE POLICY "Auth Create: study_groups" ON public.study_groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Members Read: study_group_members" ON public.study_group_members FOR SELECT USING (true);
CREATE POLICY "Auth Join: study_group_members" ON public.study_group_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Members Read: study_group_messages" ON public.study_group_messages FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = study_group_messages.group_id AND user_id = auth.uid()));

CREATE POLICY "Members Send: study_group_messages" ON public.study_group_messages FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = group_id AND user_id = auth.uid()));

CREATE POLICY "Participant Read: direct_messages" ON public.direct_messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Participant Send: direct_messages" ON public.direct_messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);
