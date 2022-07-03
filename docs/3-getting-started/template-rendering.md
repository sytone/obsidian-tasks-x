---
layout: default
title: Template Rendering
nav_order: 6
parent: Getting Started
has_toc: false
---

# Template Rendering

This is a new feature that allows the user to specify the template used to render the query output. It works for the original and SQL based queries when enabled.

The default template is below. This is a single line to ensure it matches the current rendering. The template uses [Handlebars (handlebarsjs.com)](https://handlebarsjs.com/guide/)  to handle the rendering so the reference information is not duplicated here.

```text
{{#li}}{{input}}{{#text}}{{#if task.description}}{{description}} {{\/if}}{{#if task.createdDate}}{{moment task.createdDate prefix=\"➕ \"}} {{\/if}}{{#if task.priority}}{{priority}} {{\/if}}{{#if task.recurrence}}{{recurrence}} {{\/if}}{{#if task.startDate}}{{moment task.startDate prefix=\"🛫 \"}} {{\/if}}{{#if task.scheduledDate}}{{moment task.scheduledDate prefix=\"⏳ \"}} {{\/if}}{{#if task.dueDate}}{{moment task.dueDate prefix=\"📅 \"}} {{\/if}}{{#if task.doneDate}}{{moment task.doneDate prefix=\"✅ \"}} {{\/if}}{{#if task.blockLink}}{{task.blockLink}} {{\/if}}{{\/text}}{{backlink}}{{editicon}}{{\/li}}
```

## Available Helpers

| Block Helper Name | options                                | Description                                                                                                   |
| ----------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| li                | None                                   | This is the top level list item html, it sets the needed attributes.                                          |
| input             | None                                   | Will render the html input element and needed attributes                                                      |
| text              | None                                   | Creates the span that the visible texts sits in.                                                              |
| description       | None                                   | Renders the description of the task minus the attributes and tags.                                            |
| moment            | {date} prefix="S " format="YYYY-MM-DD" | Renders the specified date using the default or specified format and adds the prefix in front of it.          |
| priority          | None                                   | Renders the correct priority indicator                                                                        |
| recurrence        | None                                   | Renders the recurrence string                                                                                 |
| backlink          | short="true"                           | Renders the link back to the page the task is on, if the short option is added it just renders the link icon. |
| editicon          | None                                   | Renders the edit icon to open the edit UI.                                                                    |

The `if` statement works as per the handlebars documentation and is used to only render the items if they are set.
