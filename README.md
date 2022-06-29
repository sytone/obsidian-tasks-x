---
layout: default
title: Documentation for Obsidian Tasks
nav_exclude: true
---

# Documentation for Obsidian Tasks

## Overview

- For background, including which branch to work on, see ["Updating documentation" in CONTRIBUTING](../CONTRIBUTING.md#updating-documentation)
- The documentation is written in Markdown
- It is converted to HTML via Ruby and Jekyll
  - Important: Ruby 2 is required, for example, Ruby 2.7
- The published documentation is at <https://obsidian-tasks-group.github.io/obsidian-tasks/>
- The documentation is also a test and example vault for features of this plugin.
  - Keep all folder and note names in lowercase and us a `-` instead of a space
  - If a page has a order put a prefix on it, for root files put them in a folder so they are the same order as the navigation.
- When adding in example queries indent the example and put a non indented version below so the output can be seen if the user downloads the vault.

## Test documentation locally with Jekyll

When making significant edits to the documentation, it is helpful to see what
the published docs will look like. This allows spotting of problems like formatting oddities.

<div class="code-example" markdown="1">
📝 Note
{: .label .label-blue }

As wiki links are used there is a step in the github build action that replaces them with Markdown links. This means you will not see them by default. You can run this manually if needed with the following commands. Do not check in any of the modified files.

```shell
export INPUT_SRC_ROOT_DIRECTORY=/mnt/g/repos/gh/obsidian-tasks-x/docs
export INPUT_URL_BASE=/obsidian-tasks-x
python3 .github/actions/obsidian-vault-to-jekyll-markdown/convert.py
```

```PowerShell
$env:INPUT_SRC_ROOT_DIRECTORY="G:/repos/gh/obsidian-tasks-x/docs"
$env:INPUT_URL_BASE="/obsidian-tasks-x"
python3 .github/actions/obsidian-vault-to-jekyll-markdown/convert.py
```


</div>

### Setup

See below for how to set up either of two options for creating the published pages during development:

1. [Running inside a Docker container (recommended)](#option-1-running-inside-a-docker-container)
2. [Running without Docker](#option-2-running-without-docker)

### Development cycle

In both cases, once the Jekyll server is running and you are viewing it in your browser,
there is a fast feedback cycle of:

1. Edit a markdown pageSS
1. Wait a few seconds until you see console output like this:

    ```text
    web_1  |       Regenerating: 1 file(s) changed at 2022-05-07 08:03:54
    web_1  |                     README.md
    web_1  |       Remote Theme: Using theme pmarsceill/just-the-docs
    web_1  |        Jekyll Feed: Generating feed for posts
    web_1  |                     ...done in 4.02288725 seconds.
    ```

1. Reload the page in your browser to see the changes

## Option 1: Running inside a Docker container

If you can run docker, this is the easiest way.

### Prerequisites for using Docker

1. Install Docker
2. Ensure Docker is running

### Seeing the docs via Docker

Now every time you want to see the docs locally, run:

```bash
cd ./docs
./docker_start
```

You will eventually see output ending something like this:

```text
web_1  | Configuration file: /code/docs/_config.yml
web_1  |             Source: /code/docs
web_1  |        Destination: /code/docs/_site
web_1  |  Incremental build: disabled. Enable with --incremental
web_1  |       Generating...
web_1  |       Remote Theme: Using theme pmarsceill/just-the-docs
web_1  |        Jekyll Feed: Generating feed for posts
web_1  |                     done in 4.838 seconds.
web_1  | /usr/local/bundle/gems/pathutil-0.16.2/lib/pathutil.rb:502: warning: Using the last argument as keyword parameters is deprecated
web_1  |  Auto-regeneration: enabled for '/code/docs'
web_1  |     Server address: http://0.0.0.0:4000/obsidian-tasks/
web_1  |   Server running... press ctrl-c to stop.
```

This runs a web server inside Docker that you can view on your own machine.
Look for the line containing `Server address:` and open that URL in your local browser.
It will be something like <http://0.0.0.0:4000/obsidian-tasks/>.

You can stop the service by hitting `Ctrl+c`.

## Option 2: Running without Docker

### Prerequisites for using installed Jekyll

1. Install ruby 2.x.
    - It is important that you use a version 2 of ruby, not version 3, for example 2.7.0.
1. Run:

    ```bash
    cd obsidian-tasks/
    gem install bundler
    cd docs/
    bundle install
    ```

You can find more information about these tools, and download links, at
[Testing your GitHub Pages site locally with Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll).

### Seeing the docs via installed Jekyll

Now every time you want to see the docs locally, run:

```bash
cd obsidian-tasks/docs
bundle exec jekyll serve
```

In the output, look for the line containing `Server address:` and open that URL in your local browser.
It will be something like <http://0.0.0.0:4000/obsidian-tasks/>.
