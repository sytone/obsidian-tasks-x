[CmdletBinding()]
param (
    [Parameter(HelpMessage = 'The path to the plugins folder under the .obsidian directory. For example: /mnt/d/obsidian/MyVault/.obsidian/plugins or D:\obsidian\MyVault\.obsidian\plugins')]
    [String]
    $ObsidianPluginRoot = $env:OBSIDIAN_PLUGIN_ROOT,
    [Parameter(HelpMessage = 'The folder name of the plugin to copy the files to.')]
    [String]
    $PluginFolderName = 'obsidian-tasks-x-plugin'
)

$repoRoot = (Resolve-Path -Path $(git rev-parse --show-toplevel)).Path

if (-not (Test-Path $ObsidianPluginRoot)) {
    Write-Error "Obsidian plugin root not found: $ObsidianPluginRoot"
    return
} else {
    Write-Host "Obsidian plugin root found: $ObsidianPluginRoot"
}

Push-Location $repoRoot
Write-Host "Repo root: $repoRoot"

yarn run build:dev

if ($?) {
    Write-Output 'Build successful'

    # if(-not (Test-Path $ObsidianPluginRoot/$PluginFolderName)) {
    #     New-Item -Path $ObsidianPluginRoot/$PluginFolderName -ItemType Directory
    # }

    # foreach ($file in $filesToLink ) {
    if (-not (Test-Path "$ObsidianPluginRoot/$PluginFolderName") -or (Get-Item "$ObsidianPluginRoot/$PluginFolderName" ).LinkType -ne 'Junction') {
        Write-Output "Removing $ObsidianPluginRoot/$PluginFolderName from plugin folder and linking"
        Remove-Item "$ObsidianPluginRoot/$PluginFolderName" -Force -ErrorAction SilentlyContinue
        New-Item -ItemType Junction -Path "$ObsidianPluginRoot/$PluginFolderName" -Target "$repoRoot"
    } else {
            (Get-Item "$ObsidianPluginRoot/$PluginFolderName/$file" ).LinkType
    }
    # }

    $hasHotReload = Test-Path "$ObsidianPluginRoot/$PluginFolderName/.hotreload"

    if (!$hasHotReload) {
        Write-Output 'Creating hotreload file'
        '' | Set-Content "$ObsidianPluginRoot/$PluginFolderName/.hotreload"
    }

    yarn run dev

} else {
    Write-Error 'Build failed'
}

Pop-Location
