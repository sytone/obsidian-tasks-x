---
layout: default
title: Examples
nav_order: 7
parent: Queries - SQL
has_toc: false
---

### All open tasks that are due today

    ```tasks
    WHERE status->indicator = '!' AND  moment()->[format]('YYYY-MM-DD') = moment(dueDate)->[format]('YYYY-MM-DD')
    ```

```task-sql
WHERE status->indicator = '!' AND  moment()->[format]('YYYY-MM-DD') = moment(dueDate)->[format]('YYYY-MM-DD')
```

---

### All open tasks that are due within the next two weeks, but are not overdue (due today or later)

    ```task-sql
    WHERE status->indicator = ' ' AND moment(dueDate)->isBetween(moment()->startOf('day').subtract(1, 'days'), moment()->startOf('day').add(14, 'days'))

    ```

```task-sql
WHERE status->indicator = ' ' AND moment(dueDate)->isBetween(moment()->startOf('day').subtract(1, 'days'), moment()->startOf('day').add(14, 'days'))

```

---

### All done tasks that are anywhere in the vault under a `tasks` heading (e.g. `## Tasks`)

    ```task-sql
    WHERE status->indicator = 'x' AND precedingHeader LIKE '%tasks%'
    ```

```task-sql
WHERE status->indicator = 'x' AND precedingHeader LIKE '%tasks%'
```

---

### Show all tasks that aren’t done, are due on the 9th of April 2021, and where the path includes `GitHub`

    ```task-sql
    WHERE status->indicator = ' '
    AND moment(dueDate)->[format]('YYYY-MM-DD') = '2021-04-09'
    AND path LIKE '%GitHub%'
    ```

```task-sql
WHERE status->indicator = ' '
AND moment(dueDate)->[format]('YYYY-MM-DD') = '2021-04-09'
AND path LIKE '%GitHub%'
```

---

### All tasks with waiting, waits or wartet

    ```task-sql
    WHERE description LIKE '%waiting%' OR description LIKE '%waits%' OR description LIKE '%wartet%'
    #short
    ```

```task-sql
WHERE description LIKE '%waiting%' OR description LIKE '%waits%' OR description LIKE '%wartet%'
#short
```

---

### All tasks with 'trash' in the description

    ```task-sql
    WHERE description LIKE '%trash%'
    ```

```task-sql
WHERE description LIKE '%trash%'
```
