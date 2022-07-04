---
layout: default
title: Features
nav_order: 5
parent: Getting Started
has_toc: false
---

# Features

The plugin supports developmental features and a way to turn them on and off via the settings UI under **Optional or in development features**

| Feature Name                      | Enabled by Default | Stable | Description                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------- | ------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| APPEND_GLOBAL_FILTER              | true               | true   | Creates / Supports tasks with the global filter at end                                                                                                                                                                                                                                                                                                      |
| ENABLE_SQL_QUERY                  | true               | true   | Enable the ability to use SQL based queries to find tasks. This new<br /> syntax can be used by annotating the code block with "task-sql" instead of "task"                                                                                                                                                                                                 |
| ENABLE_TEMPLATE_RENDERING         | false              | false  | This is an enhanced form of rendering the query results that<br /> allows the user full control over the format of the rendered task<br />  that a query returns. It uses handlebars based templates with<br />  helpers that ensure the results work with Obsidian removing the need<br />  for user to know the internals of the Obsidian HTML structure. |
| ENABLE_ORIGINAL_TASK_REGISTRATION | false              | true   | This plugin is synced with the original tasks plugin, if you enable this you<br /> only need to have this plugin installed. This also means the rendering logic will<br /> work for the original string based queries as well.<br />                                                                                                                        |
