-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase RPC: Atomic credit operations
-- ─────────────────────────────────────────────────────────────────────────────
-- Run this in Supabase SQL Editor or as a migration.
-- These functions ensure race-safe credit deduction and addition.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── deduct_credits ──────────────────────────────────────────────────────────
-- Atomically deducts p_amount from the user's balance.
-- Returns the new balance, or -1 if insufficient credits.
-- Uses row-level locking (FOR UPDATE) to prevent double-spend.

CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_amount INT DEFAULT 1)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INT;
BEGIN
  -- Lock the row and read current balance
  SELECT balance INTO v_balance
  FROM "UserCredits"
  WHERE "userId" = p_user_id
  FOR UPDATE;

  -- No record found — create with default 12 credits, then deduct
  IF NOT FOUND THEN
    INSERT INTO "UserCredits" (id, "userId", balance)
    VALUES (gen_random_uuid(), p_user_id, 12 - p_amount)
    ON CONFLICT ("userId") DO NOTHING;

    -- Re-read in case of race on insert
    SELECT balance INTO v_balance
    FROM "UserCredits"
    WHERE "userId" = p_user_id
    FOR UPDATE;

    IF v_balance >= p_amount THEN
      UPDATE "UserCredits"
      SET balance = balance - p_amount
      WHERE "userId" = p_user_id;
      RETURN v_balance - p_amount;
    END IF;

    RETURN v_balance;
  END IF;

  -- Insufficient credits
  IF v_balance < p_amount THEN
    RETURN -1;
  END IF;

  -- Deduct
  UPDATE "UserCredits"
  SET balance = balance - p_amount
  WHERE "userId" = p_user_id;

  RETURN v_balance - p_amount;
END;
$$;


-- ── add_credits ─────────────────────────────────────────────────────────────
-- Atomically adds p_amount to the user's balance.
-- Creates the record if it doesn't exist (with p_amount as initial balance).
-- Returns the new balance.

CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_amount INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INT;
BEGIN
  -- Upsert: insert or add to existing balance
  INSERT INTO "UserCredits" (id, "userId", balance)
  VALUES (gen_random_uuid(), p_user_id, p_amount)
  ON CONFLICT ("userId")
  DO UPDATE SET balance = "UserCredits".balance + p_amount
  RETURNING balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;


-- ── Grant execute to authenticated and service_role ─────────────────────────
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION add_credits(UUID, INT) TO authenticated, service_role;
