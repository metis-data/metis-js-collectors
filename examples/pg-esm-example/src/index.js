import express from 'express';
import { queries } from './queries.js';
import { Util } from './utils.js';

// NOTE: doesnt work
// import pg from 'pg';
// const { Pool } = pg;
// const Pool = pg.Pool;

// NOTE: doesnt work
// import * as pg from 'pg';
// const { Pool } = pg.default;

// NOTE: works
// import { createRequire } from 'module';
// import { getFilename } from 'cross-dirname';
// const _require = createRequire(getFilename());
// const { Pool } = _require('pg');

const { setPgConnection } = await Util.import('@metis-data/pg-interceptor');

// NOTE: works

const connectionString = process.env.PG_CONNECTION_STRING || 'postgresql://postgres:postgres@localhost:5432/platform';

async function initPg() {
  const pg = await Util.import('pg');
  const { Pool } = pg;
  return new Pool({ connectionString });
}
const databasePg = await Util.import('@databases/pg');
const { sql } = databasePg

async function initDatabasePg() {
  return new databasePg({ connectionString });
}

async function fetchDBConnectionString() {
  return new Promise((res, rej) => {
    setTimeout(() => {
      return res(connectionString);
    }, 5000);
  });
}

(async () => {
  const connectionString = await fetchDBConnectionString();
  setPgConnection(connectionString);
  const pgClient = await initPg();
  const databasePgClient = await initDatabasePg();

  const app = express();

  app.use(express.json());

  app.get('/person', async (req, res) => {
    const { rows } = await pgClient.query(queries.person);
    const q = sql`SELECT * FROM person`;
    const databasePgData = await databasePgClient.query(q);
    console.log({ databasePgData });
    return res.json(databasePgData);
  });

  // app.get('/person/:id', async (req, res) => {
  //   const c = await client.query(queries.personById, [req.params.id]);
  //   return res.json(c.rows);
  // });

  // app.get('/person-insert', async (req, res) => {
  //   const c = await client.query(queries.personInsert);
  //   return res.json(c);
  // });

  // app.get('/person-delete', async (req, res) => {
  //   const c = await client.query(queries.personDelete);
  //   return res.json(c);
  // });

  app.listen(3000, () => console.log(`🚀 Server ready at: http://localhost:3000`));
})()
