[CmdletBinding()]
param (
    [Parameter()]
    [string]
    $Tag = 'obsidian-tasks-docs:latest'
)

function message($message) {
    Write-Host "`n#`n#`n# $message`n#`n#`n"
}

# move to the docs root to do the docker creation.
Push-Location "$PSScriptRoot/../docs"

# Check if a built image exists.
# If not, we need to build it first.
if ($null -eq (docker images -q 'obsidian-tasks-docs:latest') ) {
    message 'First time starting the server.'
    message "Using: $Tag"
    message 'We need to build the image first...'
    docker build --tag $Tag .
}

message 'Stop the server with Ctrl-c'

# Actually run the jekyll server.
# Volume with :Z is required for linux users due to SELinux.
docker run --rm `
    -it `
    --volume "${PWD}:/docs:Z" `
    --publish 4000:4000 `
    "$Tag"

Pop-Location

