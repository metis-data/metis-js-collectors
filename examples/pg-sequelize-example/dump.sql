CREATE TABLE IF NOT EXISTS "person" (
  "id" SERIAL NOT NULL,
  "firstName" character varying NOT NULL,
  "lastName" character varying NOT NULL,
  "age" integer NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE ("firstName", "lastName")
);

INSERT INTO "person" ("firstName", "lastName", "age")
  VALUES
    ('Jerry', 'Seinfeld', 68),
    ('Elaine', 'Benes', 62),
    ('George', 'Steinbrenner', 75),
    ('Kramer', 'Kramer', 73),
    ('George', 'Costanza', 63)
  ON CONFLICT DO NOTHING;