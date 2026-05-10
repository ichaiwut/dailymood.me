-- Subscription state columns (populated by Stripe webhook)
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN current_period_end INTEGER;
ALTER TABLE users ADD COLUMN cancel_at_period_end INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN plan_interval TEXT;
