<#
.SYNOPSIS
    Published the plugin on github as a new version.
.DESCRIPTION
    This script wraps the process to publish a new version of the plugin on github. It will also update the documentation.
.NOTES
    This is designed to be cross platform and should work in linux, windows and macOS
.LINK
    Specify a URI to a help page, this will show when Get-Help -Online is used.
.PARAMETER Version
    The version of the plugin to publish. Follows SemVer formatting.
.PARAMETER MinimumObsidianVersion
    The minimum version of Obsidian that this plugin will work with.
.PARAMETER DocumentationOnly
    Will not tag or update version, just push the documentation updates.
.EXAMPLE
    Publish-Plugin -Version "1.2.3" -MinimumObsidianVersion "0.12.1"
    This will create a tag called v1.2.3, update the manifest, package and versions files and publish the plugin on github.
#>
[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    $Version,
    [Parameter(Mandatory = $true)]
    $MinimumObsidianVersion
    # [switch]
    # $DocumentationOnly
)

[Parameter(Position = 0, Mandatory = $true)]

$pendingChanges = $(git status --porcelain)
$mainBranchName = 'main-tasks-sql'

if ($pendingChanges -ne '') {
    Write-Output 'There are pending changes in the working directory. Please commit or stash them before running this command.'
    #exit 1
}

Push-Location $PSScriptRoot
Push-Location '..'

Write-Output "Updating to version ${Version} with minimum obsidian version ${MinimumObsidianVersion}"

if ($DocumentationOnly) {
    # $publish = Read-Host 'Update documentation? (y/n)'
    # if ($publish -ieq 'y') {
    #     git switch gh-pages
    #     git merge $mainBranchName
    #     $env:LEFTHOOK = 0
    #     git push
    #     git switch -
    # }
} else {
    $publish = Read-Host 'Update versions in files? (y/n)'

    if ($publish -ieq 'y') {
        Write-Output 'Updating package.json'
        $packageJson = Get-Content -Path './package.json' | ConvertFrom-Json
        $packageJson.version = $Version
        $packageJson | ConvertTo-Json -Depth 100 | Set-Content -Path './package.json'


        Write-Output 'Updating manifest.json'
        $manifestJson = Get-Content -Path './manifest.json' | ConvertFrom-Json
        $manifestJson.version = $Version
        $manifestJson.minAppVersion = $MinimumObsidianVersion
        $manifestJson | ConvertTo-Json -Depth 10 | Set-Content -Path './manifest.json'

        Write-Output 'Updating versions.json'
        $versionJson = Get-Content -Path './versions.json' | ConvertFrom-Json
        if (!$versionJson.$Version) {
            $versionJson | Add-Member -MemberType NoteProperty -Name $Version -Value $MinimumObsidianVersion
            $versionJson | ConvertTo-Json -Depth 10 | Set-Content -Path './versions.json'
        }
    }

    $publish = Read-Host 'Create git commit, tag, and push? (y/n)'
    if ($publish -ieq 'y') {
        git add -A
        git commit -m "chore: update to version ${Version}"
        git tag "${Version}"
        git push
        $env:LEFTHOOK = 0
        git push --tags
    }

    # $publish = Read-Host 'Update documentation? (y/n)'
    # if ($publish -ieq 'y') {
    #     git switch gh-pages
    #     git merge $mainBranchName
    #     $env:LEFTHOOK = 0
    #     git push
    #     git switch -
    # }

}
