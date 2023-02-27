export const queries = {
  person: 'SELECT * FROM person',
  personById: 'SELECT * FROM person WHERE id = $1',
  personInsert:
    'INSERT INTO "person" ("firstName", "lastName", "age") VALUES (\'john\', \'doe\', 42) ON CONFLICT DO NOTHING',
  personDelete: 'DELETE FROM "person" WHERE "firstName" = \'john\' AND "lastName" = \'doe\'',
};
