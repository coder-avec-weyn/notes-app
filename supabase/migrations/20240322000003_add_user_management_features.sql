CREATE TABLE IF NOT EXISTS user_friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE TABLE IF NOT EXISTS shared_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
  permission TEXT DEFAULT 'read' CHECK (permission IN ('read', 'write', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT shared_with_user_or_group CHECK (
    (shared_with IS NOT NULL AND group_id IS NULL) OR
    (shared_with IS NULL AND group_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS group_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_user UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, invited_user)
);

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'note_created', 'note_shared', 'group_joined', 'friend_added')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_discovery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE NOT NULL,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  discovery_enabled BOOLEAN DEFAULT true,
  join_requests_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS user_friends_user_id_idx ON user_friends(user_id);
CREATE INDEX IF NOT EXISTS user_friends_friend_id_idx ON user_friends(friend_id);
CREATE INDEX IF NOT EXISTS user_friends_status_idx ON user_friends(status);
CREATE INDEX IF NOT EXISTS shared_notes_note_id_idx ON shared_notes(note_id);
CREATE INDEX IF NOT EXISTS shared_notes_shared_by_idx ON shared_notes(shared_by);
CREATE INDEX IF NOT EXISTS shared_notes_shared_with_idx ON shared_notes(shared_with);
CREATE INDEX IF NOT EXISTS shared_notes_group_id_idx ON shared_notes(group_id);
CREATE INDEX IF NOT EXISTS group_invitations_group_id_idx ON group_invitations(group_id);
CREATE INDEX IF NOT EXISTS group_invitations_invited_user_idx ON group_invitations(invited_user);
CREATE INDEX IF NOT EXISTS group_invitations_status_idx ON group_invitations(status);
CREATE INDEX IF NOT EXISTS user_activity_user_id_idx ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS user_activity_type_idx ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS group_discovery_category_idx ON group_discovery(category);
CREATE INDEX IF NOT EXISTS group_discovery_tags_idx ON group_discovery USING GIN(tags);
CREATE INDEX IF NOT EXISTS group_discovery_featured_idx ON group_discovery(is_featured);
CREATE INDEX IF NOT EXISTS group_join_requests_group_id_idx ON group_join_requests(group_id);
CREATE INDEX IF NOT EXISTS group_join_requests_user_id_idx ON group_join_requests(user_id);
CREATE INDEX IF NOT EXISTS group_join_requests_status_idx ON group_join_requests(status);

alter publication supabase_realtime add table user_friends;
alter publication supabase_realtime add table shared_notes;
alter publication supabase_realtime add table group_invitations;
alter publication supabase_realtime add table user_activity;
alter publication supabase_realtime add table group_discovery;
alter publication supabase_realtime add table group_join_requests;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_friends_updated_at BEFORE UPDATE ON user_friends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_notes_updated_at BEFORE UPDATE ON shared_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_invitations_updated_at BEFORE UPDATE ON group_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_discovery_updated_at BEFORE UPDATE ON group_discovery
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_join_requests_updated_at BEFORE UPDATE ON group_join_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'notes' THEN
            INSERT INTO user_activity (user_id, activity_type, metadata)
            VALUES (NEW.user_id, 'note_created', json_build_object('note_id', NEW.id, 'title', NEW.title));
        ELSIF TG_TABLE_NAME = 'shared_notes' THEN
            INSERT INTO user_activity (user_id, activity_type, metadata)
            VALUES (NEW.shared_by, 'note_shared', json_build_object('note_id', NEW.note_id, 'shared_with', NEW.shared_with, 'group_id', NEW.group_id));
        ELSIF TG_TABLE_NAME = 'chat_group_members' THEN
            INSERT INTO user_activity (user_id, activity_type, metadata)
            VALUES (NEW.user_id, 'group_joined', json_build_object('group_id', NEW.group_id));
        ELSIF TG_TABLE_NAME = 'user_friends' AND NEW.status = 'accepted' THEN
            INSERT INTO user_activity (user_id, activity_type, metadata)
            VALUES (NEW.user_id, 'friend_added', json_build_object('friend_id', NEW.friend_id));
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_note_activity AFTER INSERT ON notes
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER log_shared_note_activity AFTER INSERT ON shared_notes
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER log_group_member_activity AFTER INSERT ON chat_group_members
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER log_friend_activity AFTER INSERT OR UPDATE ON user_friends
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE OR REPLACE FUNCTION expire_invitations()
RETURNS void AS $$
BEGIN
    UPDATE group_invitations 
    SET status = 'expired' 
    WHERE status = 'pending' AND expires_at < NOW();
END;
$$ language 'plpgsql';
