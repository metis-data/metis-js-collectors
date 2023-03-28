import { startMetisInstrumentation } from './tracer';
startMetisInstrumentation();

import express from 'express';
import { Client } from 'pg';
import { execSync } from 'child_process';
import { parse } from 'pg-connection-string';
import { queries } from './queries';

let client: Client;
async function setClient() {
  const connectionString = process.env.PG_CONNECTION_STRING;
  const config = parse(connectionString);
  client = new Client({ connectionString });
  await client.connect();
  execSync(`psql -U postgres -d ${config.database} -a -f ./dump.sql`);
}
setClient();

const app = express();

app.use(express.json());

app.get('/person', async (req, res) => {
  const c = await client.query(queries.person);
  return res.json(c.rows);
});

app.get('/person/:id', async (req, res) => {
  const c = await client.query(queries.personById, [req.params.id]);
  return res.json(c.rows);
});

app.get('/person-insert', async (req, res) => {
  const c = await client.query(queries.personInsert);
  return res.json(c);
});

app.get('/person-delete', async (req, res) => {
  const c = await client.query(queries.personDelete);
  return res.json(c);
});

app.listen(3000, () => console.log(`🚀 Server ready at: http://localhost:3000`));
