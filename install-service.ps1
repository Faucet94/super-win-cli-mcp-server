# Elevate to admin if not already
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {  
    $arguments = "& '" +$myinvocation.mycommand.definition + "'"
    Start-Process powershell -Verb runAs -ArgumentList $arguments
    Break
}

# --- Configuration for NSSM ---
$serviceName = "MCPServer"
$serviceDisplayName = "MCP Command Server (NSSM)"
$serviceDescription = "Windows Command Server via NSSM"

# Path to node.exe (NSSM will find it in PATH)
$nodePath = "node.exe"
# Path to the actual script to run
$scriptPath = "$PSScriptRoot\dist\index.js"
# Working directory for the script
$workingDir = $PSScriptRoot

# --- Service Management with NSSM ---

# Ensure NSSM executable exists
$nssmPath = "$PSScriptRoot\nssm.exe"
if (-NOT (Test-Path $nssmPath)) {
    Write-Error "NSSM executable not found at $nssmPath. Please download and place it here."
    Break
}

# Stop and Remove existing service (if any)
Write-Host "Attempting to remove existing service '$serviceName' (if any)..."
& $nssmPath remove $serviceName confirm
Start-Sleep -s 2 # Give time for removal

# Install the service using NSSM
Write-Host "Installing service '$serviceName' using NSSM..."
& $nssmPath install $serviceName $nodePath $scriptPath
if ($LASTEXITCODE -ne 0) {
    Write-Error "NSSM install command failed."
    Break
}

# Configure service parameters
Write-Host "Configuring service parameters..."
& $nssmPath set $serviceName AppDirectory $workingDir
& $nssmPath set $serviceName DisplayName $serviceDisplayName
& $nssmPath set $serviceName Description $serviceDescription
& $nssmPath set $serviceName Start SERVICE_AUTO_START
& $nssmPath set $serviceName ObjectName LocalSystem

# Start the service
Write-Host "Starting service '$serviceName'..."
Start-Service $serviceName

# Display final status
Write-Host ""
Write-Host "Service '$serviceName' installation attempted."
Write-Host "Check the status using 'Get-Service $serviceName' or the Services application."
Write-Host "Executable: $nodePath"
Write-Host "Arguments: $scriptPath"
Write-Host "Working Directory: $workingDir"