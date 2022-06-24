---
layout: default
title: Introduction
nav_order: 1
---

# Introduction

{: .no_toc }

<details markdown="block">
  <summary>
    Table of contents
  </summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

## Task management for the [Obsidian](https://obsidian.md/) knowledge base

This plugin allows you to:

- Track your tasks across your entire vault.
- Query them and mark them as done wherever you want.
- Supports due dates, recurring tasks (repetition), done dates, sub-set of checklist items, and filtering.
- You can toggle the task status in any view or query and it will update the source file.

To query your tasks you have two options using the version from `sytone/obsidian-tasks-x` the original query language and the newer one which uses SQL syntax. Information on installing both versions can be found on the [Installation](/obsidian-tasks-x/2-installation/2-installation) page.

The version of the plugin that supports the SQL syntax is being updated with changes from the original plugin periodically. Changes are making their way back to the original plugin but there is no timeline for complete migration back.

For bugs, ideas or help related to the **[Tasks SQL Powered](/obsidian-tasks-x/5-queries-sql/5-queries-sql)** version of the plugin use these links:

[Bugs and Issues](https://github.com/sytone/obsidian-tasks-x/issues), [Ideas](https://github.com/sytone/obsidian-tasks-x/discussions/categories/ideas), [Help](https://github.com/sytone/obsidian-tasks-x/discussions/categories/q-a), For changes in each release, please check the [CHANGELOG](https://github.com/sytone/obsidian-tasks-x/blob/main-tasks-sql/CHANGELOG.md).

For bugs, ideas or help related to the **[Original Tasks](/obsidian-tasks-x/4-queries-basic/4-queries-basic)** version of the plugin use these links:

[Bugs and Issues](https://github.com/obsidian-tasks-group/obsidian-tasks/issues), [Ideas](https://github.com/obsidian-tasks-group/obsidian-tasks/discussions/categories/ideas), [Help](https://github.com/obsidian-tasks-group/obsidian-tasks/discussions/categories/q-a), For changes in each release, please check the [releases page](https://github.com/obsidian-tasks-group/obsidian-tasks/releases).

---

## Screenshots

- *All screenshots assume the global filter `#task` which is not set by default (see also "Getting Started").*
- *The theme is [Obsidian Atom](https://github.com/kognise/obsidian-atom).*

![ACME Tasks](https://github.com/sytone/obsidian-tasks-x/raw/main-tasks-sql/docs/screenshots/acme.png)
The `ACME` note has some tasks.

![Important Project Tasks](https://github.com/sytone/obsidian-tasks-x/raw/main-tasks-sql/docs/screenshots/important_project.png)
The `Important Project` note also has some tasks.

![Tasks Queries](https://github.com/sytone/obsidian-tasks-x/raw/main-tasks-sql/docs/screenshots/tasks_queries.png)
The `Tasks` note gathers all tasks from the vault and displays them using queries.

![Create or Edit Modal](https://github.com/sytone/obsidian-tasks-x/raw/main-tasks-sql/docs/screenshots/modal.png)
The `Tasks: Create or edit` command helps you when editing a task.
