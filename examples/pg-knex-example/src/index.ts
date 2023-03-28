import { startMetisInstrumentation } from './tracer';
startMetisInstrumentation();

import express from 'express';
import { knex as knexClient, Knex } from 'knex';
import { execSync } from 'child_process';
import { parse } from 'pg-connection-string';
import { Person } from './entities';

let knex: Knex;
async function setClient() {
  const connectionString = process.env.PG_CONNECTION_STRING;
  const config = parse(connectionString);
  const knexConfig: Knex.Config = {
    client: 'pg',
    connection: { connectionString },
  };
  knex = knexClient(knexConfig);
  execSync(`psql -U postgres -d ${config.database} -a -f ./dump.sql`);
}
setClient();

const app = express();

app.use(express.json());

app.get('/person', async (req, res) => {
  const c = await knex<Person>('person');
  return res.json(c);
});

app.get('/person/:id', async (req, res) => {
  const c = await knex<Person>('person').where('id', req.params.id).first();
  return res.json(c);
});

app.get('/person-insert', async (req, res) => {
  const c = await knex<Person>('person')
    .insert({ firstName: 'John', lastName: 'Doe', age: 42 }, ['id'])
    .onConflict(['firstName', 'lastName'])
    .ignore();
  return res.json(c);
});

app.get('/person-delete', async (req, res) => {
  const c = await knex<Person>('person').where('firstName', 'John').del(['id']);
  return res.json(c);
});

app.listen(3000, () => console.log(`🚀 Server ready at: http://localhost:3000`));
