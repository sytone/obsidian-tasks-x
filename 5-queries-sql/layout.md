---
layout: default
title: Layout
nav_order: 7
parent: Queries - SQL
---

# Layout and Rendering options

{: .no_toc }

<details markdown="block">
  <summary>
    Table of contents
  </summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

## Hiding Elements

You can hide certain elements of the rendered list with the "hide" option.

The following options exist:

- `edit button`
- `backlink`
- `priority`
- `start date`
- `scheduled date`
- `due date`
- `done date`
- `recurrence rule`
- `task count`

Example:

 ```task-sql
 WHERE status->indicator = '!'
    #hide recurrence rule
    #hide task count
    #hide backlink
 ```

## Short Mode

In short mode, query results will only show the emojis, but not the concrete recurrence rule or dates.
You can hover over the task to see the rule and dates in a tooltip.

The option is `short mode`.

Example:

 ```task-sql
 WHERE status->indicator = '!'
    #short
 ```
