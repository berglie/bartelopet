-- ============================================================================
-- SAFE ACCOUNT DATA DELETION SCRIPT
-- ============================================================================
-- This script safely deletes all user data from the database
-- Run this in Supabase SQL Editor or psql
--
-- USAGE:
-- 1. Replace 'YOUR_EMAIL_HERE' with your actual email
-- 2. Run the entire script
-- ============================================================================

-- Set your email here
DO $$
DECLARE
  user_email TEXT := 'berglie.stian@gmail.com';  -- ⚠️ CHANGE THIS!
  participant_uuid UUID;
  completion_uuid UUID;
  deleted_images INTEGER;
  deleted_comments INTEGER;
  deleted_votes INTEGER;
BEGIN
  -- Get participant ID
  SELECT id INTO participant_uuid
  FROM participants
  WHERE email = user_email;

  IF participant_uuid IS NULL THEN
    RAISE NOTICE '❌ No participant found with email: %', user_email;
    RETURN;
  END IF;

  RAISE NOTICE '🔍 Found participant: % (ID: %)', user_email, participant_uuid;

  -- Get completion ID if exists
  SELECT id INTO completion_uuid
  FROM completions
  WHERE participant_id = participant_uuid;

  IF completion_uuid IS NOT NULL THEN
    RAISE NOTICE '🔍 Found completion record: %', completion_uuid;

    -- CRITICAL: Disable trigger to prevent constraint violations during deletion
    RAISE NOTICE '🔧 Temporarily disabling image deletion trigger...';
    ALTER TABLE completion_images DISABLE TRIGGER prevent_last_image_deletion_trigger;

    -- STEP 1: Delete votes (must be done first, no cascade from completion)
    RAISE NOTICE '🗑️  Step 1: Deleting votes...';
    DELETE FROM votes
    WHERE voter_id = participant_uuid OR completion_id = completion_uuid;
    GET DIAGNOSTICS deleted_votes = ROW_COUNT;
    RAISE NOTICE '   ✅ Deleted % votes', deleted_votes;

    -- STEP 2: Delete photo comments (must be done before completion)
    RAISE NOTICE '🗑️  Step 2: Deleting photo comments...';
    DELETE FROM photo_comments
    WHERE completion_id = completion_uuid;
    GET DIAGNOSTICS deleted_comments = ROW_COUNT;
    RAISE NOTICE '   ✅ Deleted % comments', deleted_comments;

    -- STEP 3: Delete completion images directly
    RAISE NOTICE '🗑️  Step 3: Deleting completion images...';
    DELETE FROM completion_images
    WHERE completion_id = completion_uuid;
    GET DIAGNOSTICS deleted_images = ROW_COUNT;
    RAISE NOTICE '   ✅ Deleted % images', deleted_images;

    -- STEP 4: Delete completion record
    RAISE NOTICE '🗑️  Step 4: Deleting completion record...';
    DELETE FROM completions
    WHERE id = completion_uuid;
    RAISE NOTICE '   ✅ Deleted completion record';

    -- Re-enable trigger
    RAISE NOTICE '🔧 Re-enabling image deletion trigger...';
    ALTER TABLE completion_images ENABLE TRIGGER prevent_last_image_deletion_trigger;
  ELSE
    RAISE NOTICE '⚠️  No completion found for this participant';

    -- Still delete votes by this user
    RAISE NOTICE '🗑️  Deleting votes by this user...';
    DELETE FROM votes
    WHERE voter_id = participant_uuid;
    GET DIAGNOSTICS deleted_votes = ROW_COUNT;
    RAISE NOTICE '   ✅ Deleted % votes', deleted_votes;
  END IF;

  -- STEP 5: Delete participant record (this will cascade delete auth user)
  RAISE NOTICE '🗑️  Step 5: Deleting participant record...';
  DELETE FROM participants
  WHERE id = participant_uuid;
  RAISE NOTICE '   ✅ Deleted participant record';

  RAISE NOTICE '';
  RAISE NOTICE '✅ ACCOUNT DELETION COMPLETE';
  RAISE NOTICE '   All data for % has been removed', user_email;
END;
$$;
