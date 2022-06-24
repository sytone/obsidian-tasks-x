---
layout: default
title: Change filter based on time of day
nav_order: 1
parent: Scenarios
has_toc: false
---

# Change filter based on time of day

This example provides a way to change the filter being run based on the time of day.

    ```task-sql
    WHERE status->indicator = ' ' AND (
      moment()->isBetween(moment('08:00:00','hh:mm:ss'), moment('17:00:00','hh:mm:ss')) AND tags->includes('#Work')
    OR
      NOT moment()->isBetween(moment('08:00:00','hh:mm:ss'), moment('17:00:00','hh:mm:ss')) AND tags->includes('#Home')
    )
    ```

```task-sql
WHERE status->indicator = ' ' AND (
  moment()->isBetween(moment('08:00:00','hh:mm:ss'), moment('17:00:00','hh:mm:ss')) AND tags->includes('#work')
OR
  NOT moment()->isBetween(moment('08:00:00','hh:mm:ss'), moment('17:00:00','hh:mm:ss')) AND tags->includes('#home')
)
```
