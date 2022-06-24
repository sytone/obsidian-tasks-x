---
layout: default
title: Comments
nav_order: 6
parent: Queries - SQL
has_toc: false
---

# Comments

The SQL Query block uses the `#` symbol for comments as well as rendering directives to change your layout. You can still use this to add comments to your query to make it simpler to understand.

Example:

````markdown
```task-sql
# This will show all my important tasks.
WHERE status->indicator = '!'

# The entry below will render the tasks using the short format.
#short
```
````
