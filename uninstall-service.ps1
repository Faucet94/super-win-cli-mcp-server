# Elevate to admin if not already
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {  
    $arguments = "& '" +$myinvocation.mycommand.definition + "'"
    Start-Process powershell -Verb runAs -ArgumentList $arguments
    Break
}

$serviceName = "MCPServer"

# Ensure NSSM executable exists
$nssmPath = "$PSScriptRoot\nssm.exe"
if (-NOT (Test-Path $nssmPath)) {
    Write-Error "NSSM executable not found at $nssmPath. Please download and place it here."
    Break
}

# Stop and remove service using NSSM
Write-Host "Attempting to remove service '$serviceName' using NSSM..."
& $nssmPath remove $serviceName confirm

if ($LASTEXITCODE -eq 0) {
    Write-Host "Service '$serviceName' removed successfully!"
} else {
    Write-Host "Failed to remove service '$serviceName'. It might not exist or NSSM encountered an error."
}