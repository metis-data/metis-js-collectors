import { startMetisInstrumentation } from './tracer';
startMetisInstrumentation();

import express from 'express';
import { execSync } from 'child_process';
import { parse } from 'pg-connection-string';
import { PersonDefinition } from './entities';
import { Sequelize } from 'sequelize';

const app = express();
app.use(express.json());

let sequelize;
async function setClient() {
  const connectionString = process.env.PG_CONNECTION_STRING;
  const config = parse(connectionString);
  sequelize = new Sequelize(connectionString, { dialect: 'postgres' });
  execSync(`psql -U postgres -d ${config.database} -a -f ./dump.sql`);
}
setClient();

const Person = sequelize.define('Person', PersonDefinition.def, PersonDefinition.options);

app.get('/person', async (req, res) => {
  const c = await Person.findAll();
  return res.json(c);
});

app.get('/person/:id', async (req, res) => {
  const c = await Person.findByPk(req.params.id);
  return res.json(c);
});

app.get('/person-insert', async (req, res) => {
  const newPerson = { firstName: 'John', lastName: 'Doe', age: 42 };
  const c = await Person.findOrCreate({ where: { firstName: 'John', lastName: 'Doe' }, defaults: newPerson });
  return res.json(c);
});

app.get('/person-delete', async (req, res) => {
  const c = await Person.destroy({ where: { firstName: 'John', lastName: 'Doe' } });
  return res.json(c);
});

app.listen(3000, () => console.log(`🚀 Server ready at: http://localhost:3000`));
