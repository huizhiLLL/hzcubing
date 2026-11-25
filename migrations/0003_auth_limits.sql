CREATE TABLE auth_limits (
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  period INTEGER NOT NULL,
  hits INTEGER NOT NULL CHECK (hits > 0),
  PRIMARY KEY (category, key)
);
CREATE INDEX auth_limits_period ON auth_limits(period);
