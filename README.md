# Setup & run instructions
## Backend
To install dependencies, and build/run the backend, use:

```sh
fueleu/backend$ npm i
fueleu/backend$ npm run build
fueleu/backend$ node dist/index.js
```


## Frontend
To preview the frontend, use:
```sh
fueleu/frontend$ npm run dev
```

To build the frontend, use:
```sh
fueleu/frontend$ npm run build
```

Then the compiled site will be under `fueleu/frontend/dist`, where you can serve them, for example, with python's built-in http server:
```sh
fueleu/frontend/dist$ python -m http.server
```

By default, the frontend will try to reach the backend on `http://localhost:3000`, which is the default for the backend. If you need to change this, use the environment variable `VITE_API_BASE_URL`.


## Postgres
You need a postgres server running and set up. You can find some info on setting up a docker container [here](https://postgres.guide/docs/getting-started).


### Env
By default, this will try to connect to a postgres server on `localhost`, port 5432, using your username and no password, and with no tls. Depending on your setup, you will probably want to configure this by making a `backend/.env` file containing any of the following variables you want to change:
```sh
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=username
PGPASSWORD=correct horse battery staple
PGDATABASE=fueleu
PGSSL=true
```

Alternatively, you could do that in a single variable `DATABASE_URL` (format described [here](https://www.geeksforgeeks.org/postgresql/postgresql-connection-string)).


### Schema
You can set up the schema via `psql` using the following commands. If you'd prefer to set it up through another method, e.g. a GUI, you should still be able to use the same SQL commands:
```sql
$ psql
postgres=# CREATE DATABASE fueleu;
postgres=# \c fueleu
fueleu=# CREATE TABLE routes (
    id SMALLSERIAL PRIMARY KEY,
    route_id TEXT,
    vessel_type TEXT,
    fuel_type TEXT,
    year SMALLINT,
    ghg_intensity REAL,
    fuel_consumption SMALLINT,
    distance SMALLINT,
    total_emissions SMALLINT,
    is_baseline BOOLEAN
);
fueleu=# INSERT INTO routes (route_id, vessel_type, fuel_type, year, ghg_intensity, fuel_consumption, distance, total_emissions, is_baseline) VALUES
    ('R001', 'Container'  , 'HFO', 2024, 91  , 5000, 12000, 4500, TRUE),
    ('R002', 'BulkCarrier', 'LNG', 2024, 88  , 4800, 11500, 4200, FALSE),
    ('R003', 'Tanker'     , 'MGO', 2024, 93.5, 5100, 12500, 4700, FALSE),
    ('R004', 'RoRo'       , 'HFO', 2025, 89.2, 4900, 11800, 4300, FALSE),
    ('R005', 'Container'  , 'LNG', 2025, 90.5, 4950, 11900, 4400, FALSE);
fueleu=# CREATE TABLE ship_compliance (
    id SMALLSERIAL PRIMARY KEY,
    ship_id TEXT,
    year INTEGER,
    cb_gco2eq REAL,
    UNIQUE (ship_id, year)
);
fueleu=# CREATE TABLE bank_entries (
    id SMALLSERIAL PRIMARY KEY,
    ship_id TEXT,
    year INTEGER,
    amount_gco2eq REAL
);
fueleu=# CREATE TABLE pools (
    id SMALLSERIAL PRIMARY KEY,
    year INTEGER,
    created_at TIMESTAMP
);
fueleu=# CREATE TABLE pool_members (
    pool_id SMALLSERIAL REFERENCES pools (id),
    ship_id TEXT,
    cb_before REAL,
    cb_after REAL
);
```