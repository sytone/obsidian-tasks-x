[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    $Version,
    [Parameter(Mandatory = $true)]
    $MinimumObsidianVersion
)

[Parameter(Position = 0, Mandatory = $true)]

$pendingChanges = $(git status --porcelain)

if ($pendingChanges -ne '') {
    Write-Output 'There are pending changes in the working directory. Please commit or stash them before running this command.'
    #exit 1
}

push-location $PSScriptRoot
Push-Location ".."

Write-Output "Updating to version ${Version} with minimum obsidian version ${MinimumObsidianVersion}"

$publish = Read-Host 'Are you sure you want to continue? (y/n)'

if ($publish -ieq 'y') {
    Write-Output 'Updating package.json'
    $packageJson = Get-Content -Path './package.json' | ConvertFrom-Json
    $packageJson.version = $Version
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path './package.json'


    Write-Output 'Updating manifest.json'
    $manifestJson = Get-Content -Path './manifest.json' | ConvertFrom-Json
    $manifestJson.version = $Version
    $manifestJson.minAppVersion = $MinimumObsidianVersion
    $manifestJson | ConvertTo-Json -Depth 10 | Set-Content -Path './manifest.json'

    Write-Output 'Updating versions.json'
    TEMP_FILE=$(mktemp)
    jq '. += {\'${NEW_VERSION}\": \"${MINIMUM_OBSIDIAN_VERSION}\"}" versions.json > "$TEMP_FILE" || exit 1
    Move-Item "$TEMP_FILE" versions.json

    read -p 'Create git commit, tag, and push? [y/N] ' -n 1 -r
    Write-Output
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
    git add -A .
    git commit -m"Update to version ${NEW_VERSION}"
    git tag "${NEW_VERSION}"
    git push
    LEFTHOOK=0 git push --tags
    fi

    read -p 'Update documentation? [y/N] ' -n 1 -r
    Write-Output
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
    git switch gh-pages
    git merge main
    LEFTHOOK=0 git push
    git switch -
    fi
}
