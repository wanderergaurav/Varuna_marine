# AI Agent Workflow Log

## Agents Used
Cursor Agent (I'm not sure what LLM it's built on)

## Prompts & Outputs
```
Create a basic typescript http server using the existing directory structure (hexagonal architecture) with the GET endpoints /routes, /compliance and /banking.

The postgres schema is as follows:
routes	id, route_id, year, ghg_intensity, is_baseline	basic data
ship_compliance	id, ship_id, year, cb_gco2eq	computed CB records
bank_entries	id, ship_id, year, amount_gco2eq	banked surplus
pools	id, year, created_at	pool registry
pool_members	pool_id, ship_id, cb_before, cb_after	allocations
```

```
Create a corresponding basic react frontend under `frontend/` using typescript and tailwind.
```

```
Make the banking page show the result of a GET to /banking/records?shipId&year when a route (ship) and year are selected. You do not need to modify the backend. The endpoint responds with a single object.
```

```
Make the `Bank Surplus` and `Apply Banked Surplus` buttons POST to the endpoints /banking/bank and /banking/apply. Create these endpoints in the backend as well.
```

```
Add an endpoint to get the bank history for a given ship, and add a table to the banking page to show it.
```

```
Add a page called 'Pooling', which has a table that allows you to select multiple items to add to a pool. Add the necessary endpoints to the backend, including POST /pools, which creates a pool.
```

## Validation / Corrections
The agent used @imports in the typescript that it generated, but only added these aliases to the vite config, not the typescript config, meaning my IDE didn't pick them up. I just had to manually transfer them over.

It also kept modifying files that I didn't ask it to, for example, it was modifying the backend when I only asked for a frontend change I had to start adding an explicit instruction to my prompts.

## Observations
- The agent saved me time creating the initial project: since I'm not familiar with the hexagonal architecture, I asked it to fill it in for me. Of course, I have no idea if it did well.
- Close to the deadline, I relied more on the LLM to finish the project. Because of this, I Didn't have a very good understanding of the implementation of the last two pages. If there are any issues with them, it will be difficult for me to diagnose them.

## Best Practices Followed
I'm not familiar with best practices using LLMs, other than general prompting advice (e.g. keeping prompts clear,)