-- Add image_key column for user-uploaded avatars (R2 storage key)
ALTER TABLE users ADD COLUMN image_key text;
