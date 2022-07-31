---
layout: default
title: Layout - Templated
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
The layout in Task SQL Powered can be controlled by a template, this uses [Handlebars (handlebarsjs.com)](https://handlebarsjs.com/) with additional block extensions. For the existing templating make sure it is prefixed by a `#` symbol and follow the guidance at [[4-queries-basic/layout#Layout options]]

This is currently a preview feature so needs to be enabled via the **Optional or in Development Features**. Once you enable **Templated Rendering** a new input box will appear in settings. This contains the entire template. By default it is the template below and all on one line.

``` Handlebars
{{#li}}{{input}}{{#text}}{{#if task.description}}{{description}} {{/if}}{{#if task.createdDate}}{{moment task.createdDate prefix="➕ "}} {{/if}}{{#if task.priority}}{{priority}} {{/if}}{{#if task.recurrence}}{{recurrence}} {{/if}}{{#if task.startDate}}{{moment task.startDate prefix="🛫 "}} {{/if}}{{#if task.scheduledDate}}{{moment task.scheduledDate prefix="⏳ "}} {{/if}}{{#if task.dueDate}}<span style="background-color: #663399">{{moment task.dueDate}}</span> {{/if}}{{#if task.doneDate}}{{moment task.doneDate prefix="✅ "}} {{/if}}{{#if task.blockLink}}{{task.blockLink}} {{/if}}{{/text}}{{backlink short="true"}}{{editicon}}{{/li}}
```

## Inline Templates

To enable inline templates got to settings and toggle **Enable templates to be defined along with query** on. You can then add `#template [template string]` to the query block. This will override the default query template you have in settings. The example below will only render the description, backlink and edit icon.

    ```task-sql
    WHERE dueDate != '' LIMIT 5
    #template {{#li}}{{input}}{{#text}}{{#if task.description}}{{description}} {{/if}}{{/text}}{{backlink short="true"}}{{editicon}} {{/li}}
    ```

```task-sql
WHERE dueDate != '' LIMIT 5
#template {{#li}}{{input}}{{#text}}{{#if task.description}}{{description}} {{/if}}{{/text}}{{backlink short="true"}}{{editicon}} {{/li}}
```

## Template Helpers

The following helpers are available to be used in the template. As this is a Handlebars template all the default ones are also available. The optional properties are delimited by square brackets `[]`.

| Helper Name | Description                                                                                                                                 | Properties                                   | Example                                            | Rendered               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------- | ---------------------- |
| li          | This is the main wrapper for the task, it adds all the metadata to Obsidian can render the checkboxes. The content goes between the blocks. | None                                         | `{{#li}}{{/li}}`                                   |                        |
| input       | Generates the input checkbox so you can check the task.                                                                                     | None                                         | `{{input}}`                                        |                        |
| text        | This block wraps the text to display when the task is rendered. It uses a `span` with the `tasks-list-text` class as the wrapping html.     | None                                         | `{{#text}}{{/text}}`                               |                        |
| moment      | Formats a date using `YYYY-MM-DD` as the default format. Allows custom prefixes. See [[8-Reference/8-Reference]] for format details.        | `value [prefix=""] [format="moment format"]` | `{{moment task.dueDate prefix="📅 " format="ll" }}` | ✅ May 30, 2022         |
| priority    | Renders the priority icon for the task.                                                                                                     | None                                         | `{{priority}}`                                     | ⏫                      |
| recurrence  | Renders the recurrence string if a reoccurring task.                                                                                        | None                                         | `{{recurrence}}`                                   | 🔁 every week on Sunday |
| description | Renders the main description of the task.                                                                                                   | None                                         | `{{description}}`                                  | buy milk               |
| backlink    | Renders the link to the page that the task is on. Will only render a link icon if the short property is specified.                          | `[short="true"]`                             | `{{backlink short="true"}}`                        | 🔗                      |
| editicon    | Adds the edit icon to the tasks that opens the tasks edit dialog                                                                            | none                                         | `{{editicon}}`                                     |                        |

```task-sql
WHERE dueDate != '' LIMIT 5

#template {{#li}}{{input}}{{#text}}{{#if task.description}}{{description}} {{/if}}{{#if task.createdDate}}{{moment task.createdDate prefix="➕ "}} {{/if}}{{#if task.priority}}{{priority}} {{/if}}{{#if task.recurrence}}{{recurrence}} {{/if}}{{#if task.startDate}}{{moment task.startDate prefix="🛫 "}} {{/if}}{{#if task.scheduledDate}}{{moment task.scheduledDate prefix="⏳ "}} {{/if}}{{#if task.dueDate}}{{moment task.dueDate}}{{/if}}{{#if task.doneDate}}{{moment task.doneDate prefix="✅ " format="ll"}} {{/if}}{{#if task.blockLink}}{{task.blockLink}} {{/if}}{{/text}}{{backlink short="true"}}{{editicon}} {{/li}}
```

## Advanced Rendering

With the template enabled you can significantly change the way your tasks are rendered. All the properties of the task are available to be used. To access task properties prefix with `task.` and use the [[5-queries-sql/columns]] as a reference for the names.

If you come up with a great way to show the tasks please reach out and provide an example.

### Render the results with values on separate lines

```task-sql
WHERE status->indicator != 'x' LIMIT 10
#template {{#li}}{{input}}{{#text}}{{#if task.description}}{{description}} {{/if}}{{backlink short="true"}}{{editicon}}<ul>{{#if task.createdDate}}<li>Created: {{moment task.createdDate format="ll"}}</li>{{/if}}{{#if task.recurrence}}<li>Recurrence: {{recurrence}}</li>{{/if}}{{#if task.startDate}}<li>Start: {{moment task.startDate format="ll"}}</li>{{/if}}{{#if task.scheduledDate}}<li>Scheduled: {{moment task.scheduledDate}}</li>{{/if}}{{#if task.dueDate}}<li>Due: {{moment task.dueDate}}</li>{{/if}}{{#if task.doneDate}}Done: {{moment task.doneDate format="ll"}}{{/if}}{{#if task.blockLink}}{{task.blockLink}} {{/if}}</ul>{{/text}} {{/li}}
```
