# Sequelize & Express Example

## Build

- `lerna bootstrap`
- `lerna link`
- `lerna run build`

## Start

- `lerna --scope=prisma-express-example run start`

## Add environment

create _.env_ file

```
PG_CONNECTION_HOST={data}
PG_CONNECTION_DATABASE={data}
PG_CONNECTION_USER={data}
PG_CONNECTION_PASSWORD={data}
PG_CONNECTION_PORT={data}
METIS_EXPORTER_URL={data}
METIS_API_KEY={data}
```

## Run

1

- `source .env`
- `npm run start`

2

navigate to localhost:3000/countries

3

validate if you see data on Recent Activity
