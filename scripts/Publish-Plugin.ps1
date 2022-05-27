[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    $Version,
    [Parameter(Mandatory = $true)]
    $MinimumObsidianVersion,
    [switch]
    $DocumentationOnly
)

[Parameter(Position = 0, Mandatory = $true)]

$pendingChanges = $(git status --porcelain)

if ($pendingChanges -ne '') {
    Write-Output 'There are pending changes in the working directory. Please commit or stash them before running this command.'
    #exit 1
}

Push-Location $PSScriptRoot
Push-Location '..'

Write-Output "Updating to version ${Version} with minimum obsidian version ${MinimumObsidianVersion}"

if ($DocumentationOnly) {
    $publish = Read-Host 'Update documentation? (y/n)'
    if ($publish -ieq 'y') {
        git switch gh-pages
        git merge main
        $env:LEFTHOOK = 0
        git push
        git switch -
    }
} else {
    $publish = Read-Host 'Update versions in files? (y/n)'

    if ($publish -ieq 'y') {
        Write-Output 'Updating package.json'
        $packageJson = Get-Content -Path './package.json' | ConvertFrom-Json
        $packageJson.version = $Version
        $packageJson | ConvertTo-Json -Depth 100 |
            ForEach-Object { $_ -replace '(?m)  (?<=^(?:  )*)', '    ' } |
            Set-Content -Path './package.json'


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
        git commit -m"Update to version ${Version}"
        git tag "${Version}"
        git push
        $env:LEFTHOOK = 0
        git push --tags
    }

    $publish = Read-Host 'Update documentation? (y/n)'
    if ($publish -ieq 'y') {
        git switch gh-pages
        git merge main
        $env:LEFTHOOK = 0
        git push
        git switch -
    }

}
