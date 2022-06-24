---
layout: default
title: Limiting
nav_order: 4
parent: Queries - SQL
has_toc: false
---

# Limiting

To limit the results the LIMIT clause is used, it is possible to use TOP but that requires more advanced knowledge of the plugin so not recommended.

The following query will list 3 tasks due from today.

 ```task-sql
 WHERE status->indicator = 'x'
   AND moment(dueDate)->isAfter(moment()->startOf('day'))
 LIMIT 3
 ```

```task-sql
WHERE status->indicator = 'x'
  AND moment(dueDate)->isAfter(moment()->startOf('day'))
LIMIT 3
```
