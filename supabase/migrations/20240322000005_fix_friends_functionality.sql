-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    status TEXT DEFAULT 'offline',
    last_seen TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add username column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'username'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN username TEXT UNIQUE;
    END IF;
END $$;

-- Create user_friends table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    friend_id UUID NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Create chat_groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    created_by UUID NOT NULL,
    is_private BOOLEAN DEFAULT false,
    member_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_group_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    attachments JSONB,
    reactions JSONB,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_discovery table if it doesn't exist
CREATE TABLE IF NOT EXISTS group_discovery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE NOT NULL,
    discovery_enabled BOOLEAN DEFAULT true,
    join_requests_enabled BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    category TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS group_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID NOT NULL,
    invited_user UUID NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_join_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS group_join_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Create notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS group_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE NOT NULL,
    created_by UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    tags TEXT[],
    collaborators UUID[],
    is_pinned BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shared_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS shared_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
    shared_by UUID NOT NULL,
    shared_with UUID,
    group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
    permission TEXT DEFAULT 'read' CHECK (permission IN ('read', 'write', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create note_versions table if it doesn't exist
CREATE TABLE IF NOT EXISTS note_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create note_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS note_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create note_analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS note_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create note_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS note_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_activity table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    activity_type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to generate username from email
CREATE OR REPLACE FUNCTION generate_username_from_email(email_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    base_username TEXT;
    final_username TEXT;
    counter INTEGER := 1;
BEGIN
    base_username := LOWER(REGEXP_REPLACE(SPLIT_PART(email_input, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
    
    IF LENGTH(base_username) < 3 THEN
        base_username := 'user' || base_username;
    END IF;
    
    final_username := base_username;
    WHILE EXISTS (SELECT 1 FROM user_profiles WHERE username = final_username) LOOP
        final_username := base_username || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_username;
END;
$$;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_profiles (user_id, username, display_name)
    VALUES (
        NEW.id,
        generate_username_from_email(NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$;

-- Function to search users
CREATE OR REPLACE FUNCTION search_users(search_term TEXT, requesting_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    email TEXT,
    friendship_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.username,
        up.display_name,
        up.avatar_url,
        au.email,
        CASE 
            WHEN uf1.status = 'accepted' OR uf2.status = 'accepted' THEN 'friends'
            WHEN uf1.status = 'pending' AND uf1.user_id = requesting_user_id THEN 'request_sent'
            WHEN uf1.status = 'pending' AND uf1.friend_id = requesting_user_id THEN 'request_received'
            WHEN uf2.status = 'pending' AND uf2.user_id = requesting_user_id THEN 'request_sent'
            WHEN uf2.status = 'pending' AND uf2.friend_id = requesting_user_id THEN 'request_received'
            ELSE 'none'
        END as friendship_status
    FROM user_profiles up
    JOIN auth.users au ON up.user_id = au.id
    LEFT JOIN user_friends uf1 ON (uf1.user_id = requesting_user_id AND uf1.friend_id = up.user_id)
    LEFT JOIN user_friends uf2 ON (uf2.user_id = up.user_id AND uf2.friend_id = requesting_user_id)
    WHERE 
        up.user_id != requesting_user_id
        AND (
            up.username ILIKE '%' || search_term || '%'
            OR up.display_name ILIKE '%' || search_term || '%'
            OR au.email ILIKE '%' || search_term || '%'
        )
    ORDER BY 
        CASE WHEN up.username ILIKE search_term || '%' THEN 1 ELSE 2 END,
        up.username
    LIMIT 20;
END;
$$;

-- Function to expire invitations
CREATE OR REPLACE FUNCTION expire_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE group_invitations 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$;

-- Create trigger for user profile creation
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Update existing users without profiles
INSERT INTO user_profiles (user_id, username, display_name)
SELECT 
    au.id,
    generate_username_from_email(au.email),
    COALESCE(au.raw_user_meta_data->>'full_name', SPLIT_PART(au.email, '@', 1))
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = au.id)
ON CONFLICT (user_id) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_discovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
CREATE POLICY "Users can view all profiles" ON user_profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_friends
DROP POLICY IF EXISTS "Users can view own friendships" ON user_friends;
CREATE POLICY "Users can view own friendships" ON user_friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can create friend requests" ON user_friends;
CREATE POLICY "Users can create friend requests" ON user_friends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own friendships" ON user_friends;
CREATE POLICY "Users can update own friendships" ON user_friends
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can delete own friendships" ON user_friends;
CREATE POLICY "Users can delete own friendships" ON user_friends
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies for chat_groups
DROP POLICY IF EXISTS "Users can view groups they are members of" ON chat_groups;
CREATE POLICY "Users can view groups they are members of" ON chat_groups
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            created_by = auth.uid() OR
            EXISTS (SELECT 1 FROM chat_group_members WHERE group_id = id AND user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can create groups" ON chat_groups;
CREATE POLICY "Users can create groups" ON chat_groups
    FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Group creators can update groups" ON chat_groups;
CREATE POLICY "Group creators can update groups" ON chat_groups
    FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for notes
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
CREATE POLICY "Users can view own notes" ON notes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own notes" ON notes;
CREATE POLICY "Users can create own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notes" ON notes;
CREATE POLICY "Users can update own notes" ON notes
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notes" ON notes;
CREATE POLICY "Users can delete own notes" ON notes
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_users(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_username_from_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_invitations() TO authenticated;

-- Enable realtime for tables
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'user_friends'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_friends;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'user_profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'chat_group_members'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_group_members;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON user_friends(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_group_id ON chat_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_group_id ON chat_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_user_id ON chat_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
