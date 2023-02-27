import { startMetisInstrumentation } from './tracer';
startMetisInstrumentation();

import express from 'express';
import { execSync } from 'child_process';
import { parse } from 'pg-connection-string';
import { DataSource } from 'typeorm';
import { Person } from './entities';

const app = express();
app.use(express.json());

let client;
async function setClient() {
  const connectionString = process.env.PG_CONNECTION_STRING;
  const config = parse(connectionString);
  client = new DataSource({
    type: 'postgres',
    host: config.host,
    port: +config.port,
    username: config.user,
    password: config.password,
    database: config.database,
    entities: [Person],
  });
  await client.initialize();
  execSync(`psql -U postgres -d ${config.database} -a -f ./dump.sql`);
}
setClient();

app.get('/person', async (req, res) => {
  const c = await client.manager.find(Person);
  return res.json(c);
});

app.get('/person/:id', async (req, res) => {
  const c = await client.manager.find(Person, { where: { id: req.params.id } });
  return res.json(c);
});

app.get('/person-insert', async (req, res) => {
  const newPerson = new Person();
  Object.assign(newPerson, { firstName: 'John', lastName: 'Doe', age: 42 });
  const c = await client.manager.upsert(Person, newPerson, { conflictPaths: ['firstName', 'lastName'] });
  return res.json(c);
});

app.get('/person-delete', async (req, res) => {
  const c = await client.manager.delete(Person, { firstName: 'John' });
  return res.json(c);
});

app.listen(3000, () => console.log(`🚀 Server ready at: http://localhost:3000`));
