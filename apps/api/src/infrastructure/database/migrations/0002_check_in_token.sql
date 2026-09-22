ALTER TABLE "machines" RENAME COLUMN "nfc_tag_id" TO "check_in_token";--> statement-breakpoint
DO $$
DECLARE
  unique_constraint text;
BEGIN
  SELECT conname INTO unique_constraint
  FROM pg_constraint
  WHERE conrelid = 'machines'::regclass AND contype = 'u';

  IF unique_constraint IS NOT NULL AND unique_constraint <> 'machines_checkInToken_unique' THEN
    EXECUTE format('ALTER TABLE "machines" RENAME CONSTRAINT %I TO "machines_checkInToken_unique"', unique_constraint);
  END IF;
END $$;--> statement-breakpoint
UPDATE "machines" SET "check_in_token" = gen_random_uuid()::text WHERE "check_in_token" IS NULL;--> statement-breakpoint
ALTER TABLE "machines" ALTER COLUMN "check_in_token" SET NOT NULL;--> statement-breakpoint
UPDATE "bookings" SET "checked_in_via" = 'QR' WHERE "checked_in_via" = 'NFC';
