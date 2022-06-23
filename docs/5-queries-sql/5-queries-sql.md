---
layout: default
title: Queries - SQL
nav_order: 5
has_children: true
---

# Queries - SQL

{: .no_toc }

Compared to the previous query language the new X version is more complex and powerful. There are a couple of key differences:

- The language is SQL based, if you know SQL you can use pretty much any query you can use in SQL. Please create an issue [here](https://github.com/sytone/obsidian-tasks-x/issues) if you hit a problem.
- If you want to make a fully custom query you need to select all the columns `*` at the moment unless you are grouping by. Selection of individual fields to generate a table is a future feature.

By default you should only need the conditions of the SQL query, that is everything after the `WHERE` clause including the `WHERE` for example `WHERE status->indicator != "x" AND path LIKE '%Journal%' LIMIT 10` which will return all tasks not completed (`x`) with `Journal` in the path.

## General Queries

The following columns are available to be used in the WHERE clauses.

| Column Name                 | Description                                                                         | Type |
| --------------------------- | ----------------------------------------------------------------------------------- | ---- |
| status->indicator           | The value between the square brackets. ('x', ' ', '-', '/', etc)                    |      |
| status->name                | The display name for the status. ('Done', 'Todo', 'Cancelled', 'In Progress')       |      |
| status->nextStatusIndicator | The next indicator to be used when clicked on.  ('x', ' ', '/', etc)                |      |
| description                 | The description of the task.                                                        |      |
| path                        | The path to the note the task is in.                                                |      |
| file                        | The TFile object in Obsidian.                                                       |      |
| precedingHeader             | The heading that the task is under                                                  |      |
| priority                    | The priority of the task. This has to be treated like a string ('1', '2', '3', '4') |      |

| startDate: Date | null;
| scheduledDate: Date | null;
| dueDate: Date | null;
| createdDate: Date | null;
| doneDate: Date | null;
| recurrence: RecurrenceRecord | null;
| blockLink: string;
| tags: string[] | [];

### Date Columns

When using the date columns you can use javascript commands in the WHERE clause. The example below will pull all tasks that were done in 2021.

````markdown
```task-sql
WHERE ((dueDate->getUTCFullYear() = 2021 AND status->indicator = 'x') OR (dueDate->getUTCFullYear() = 2022 AND status->indicator = ' ')) AND description LIKE '%#%'
```
````

- startDate: Date | null;
- scheduledDate: Date | null;
- dueDate: Date | null;
- createdDate: Date | null;
- doneDate: Date | null;
- recurrence: RecurrenceRecord | null;
- blockLink: string;
- tags: string[] | [];

Look at the [SQL Compatibility](https://github.com/AlaSQL/alasql/wiki/SQL%20keywords) table to see what SQL commands are supported.

### Queries using file

basename is the name of the page

`WHERE status->indicator = '!' AND file->basename = '2021-10-13'`

You can also now query based on the creation date of the note the task is in.

`WHERE status->indicator = ' ' AND moment(file->stat->ctime)->month() = 3`

you can use `mtime` to access the modified time.

### Object Properties & Functions

Object property

- a -> b
- a -> b -> c

Array member

- a -> 1
- a -> 1 -> 2

Calculated property name

- a -> (1+2)
- a -> ("text2 + " " + "more")

Functions

- myTime -> getFullYear()
- s -> substr(1,2)

-
JavaScript string functions can also be used

`SELECT s->length FROM mytext`

## Grouping

To group you need to specify the field and then `ARRAY(_) AS tasks` this will be more flexible over time but to get parity with the existing Tasks plugin it is constrained.

```SQL
SELECT status, ARRAY(_) AS tasks FROM Tasks GROUP BY status
```

You can list tasks from your entire vault by querying them using a `tasks` code block. You can edit the tasks from the query results by clicking on the little pencil icon next to them.
Tasks are by default sorted by status, due date, and then path. You can change the sorting (see query options below).

<div class="code-example" markdown="1">
Warning
{: .label .label-yellow }
The result list will list tasks unindented.
See [#51](https://github.com/sytone/obsidian-tasks-x/issues/51) for a discussion around the topic.
Do not hesitate to contribute 😊

---

Warning
{: .label .label-yellow }
The result list will not contain any footnotes of the original task.
The footnotes will *not* be carried over to documents with ```tasks blocks.
</div>

The simplest way to query tasks is this:

````markdown
```tasks
```
````

In preview mode, this will list *all* tasks from your vault, regardless of their properties like status.

This is probably not what you want.
Therefore, Tasks allows you to set query options to filter the tasks that you want to show.
See "Filters" in the documentation menu.