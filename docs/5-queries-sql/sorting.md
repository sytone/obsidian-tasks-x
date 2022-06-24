---
layout: default
title: Sorting
nav_order: 5
parent: Queries - SQL
---

# Sorting

{: .no_toc }

<details markdown="block">
  <summary>
    Table of contents
  </summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

There is no default sorting for the SQL based queries, if you want to have a order you need to specify it.

## Using  `ORDER BY`

Syntax:

    ORDER BY expression1 [ASC|DESC], ...

You can specify order with keywords:

- `ASC` - ascending (by default)
- `DESC` - descending

The expression can be any of the columns available to you.

This example returns all the completed tasks ordering by due date and then done date.

 ```task-sql
 WHERE status->indicator = 'x'
 ORDER BY dueDate DESC, doneDate DESC
 ```

```task-sql
WHERE status->indicator = 'x'
ORDER BY dueDate DESC, doneDate DESC
```
