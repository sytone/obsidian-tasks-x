<#
.SYNOPSIS
    Published the GitHub documentation site.
.DESCRIPTION
    This script wraps the process to publish a new version of the documentation on github.
.NOTES
    This is designed to be cross platform and should work in linux, windows and macOS
#>
[CmdletBinding()]
param (
    $MainBranchName = 'main-tasks-sql'
)

Push-Location $PSScriptRoot
Push-Location '..'

git switch gh-pages
git merge $MainBranchName
$env:LEFTHOOK = 0
git push
git switch -

Pop-Location
Pop-Location
