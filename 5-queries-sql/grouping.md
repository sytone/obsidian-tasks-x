---
layout: default
title: Grouping
nav_order: 2
parent: Queries - SQL
has_toc: false
---

This is still a work in progress as the SQL query uses the rendering logic from tasks which has the grouping hardcoded to the results and not part of the results.

Grouping using a single level works, if you use two columns the header will not currently reflect this but the grouping will be correct. The example below shows this working with only the first group by column being shown.

 ```task-sql
 WHERE status->indicator = 'x'
 GROUP BY path, tags->(0)
 ```

```task-sql
WHERE status->indicator = 'x'
GROUP BY path, tags->(0)
```
