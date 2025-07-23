# Super Windows CLI MCP Server

An enhanced fork of the Windows CLI MCP Server providing unrestricted system access to Windows environments via a command-line interface (MCP).

**Based on:** [win-cli-mcp-server](https://github.com/SimonB97/win-cli-mcp-server) by SimonB97.

<a href="https://glama.ai/mcp/servers/@Faucet94/super-win-cli-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@Faucet94/super-win-cli-mcp-server/badge" alt="Super Windows CLI Server MCP server" />
</a>

---

## ⚠️ CRITICAL SECURITY WARNING ⚠️

This server is designed to run with **SYSTEM-level privileges** on Windows. This grants it **complete and unrestricted access** to the entire operating system, including all files, processes, and configuration settings.

*   **DO NOT** install or run this server unless you fully understand the implications of granting SYSTEM-level access.
*   **ONLY** use this server in **highly trusted environments** where you have full control over network access.
*   **NETWORK SECURITY IS PARAMOUNT:** Since application-level restrictions are minimal by design, rely heavily on firewalls, network segmentation, and strict access control lists (ACLs) to protect the machine running this server.
*   **REVIEW THE CONFIGURATION CAREFULLY:** Pay close attention to `allowedPaths`, `blockedCommands`, and other security settings in `config.json`. A misconfiguration can easily expose your system.

**Use this software responsibly and at your own risk. The maintainers assume no liability for misuse or security breaches resulting from its use.**

---

## Features

*   Complete access to Windows shell environments (PowerShell, CMD, Git Bash - configurable).
*   Unrestricted command execution (configurable via `config.json`).
*   Full file system access (configurable via `config.json`).
*   SYSTEM-level service installation via NSSM for persistence and auto-recovery.
*   Automatic service recovery features provided by NSSM.
*   Network binding controls (intended, but primarily managed at the network/firewall level).
*   Disabled PowerShell telemetry for enhanced privacy.
*   Process reuse for performance (for shells).
*   Extended timeouts for long-running operations (configurable).

## Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js:** Version 18.0.0 or later. Download from [nodejs.org](https://nodejs.org/). (Includes npm).
2.  **NSSM (Non-Sucking Service Manager):** Required for reliable service installation. Download the latest version from [nssm.cc](https://nssm.cc/download).

## Installation (Using NSSM - Recommended)

This method installs the server as a persistent Windows service that runs with SYSTEM privileges and starts automatically.

1.  **Clone or Download:**
    *   Clone this repository: `git clone <repository-url>`
    *   Or download the source code `.zip` and extract it to a suitable location (e.g., `C:\Servers\SuperWinCLIServer`). Avoid user profile folders.

2.  **Place NSSM:**
    *   Download NSSM from [nssm.cc](https://nssm.cc/download).
    *   Extract the zip file.
    *   Copy the `nssm.exe` file from the appropriate architecture folder (`win32` or `win64`) into the **root directory** of this project (the same folder as `install-service.ps1`).

3.  **Install Dependencies & Build:**
    *   Open a terminal (PowerShell or CMD) in the project's root directory.
    *   Run: `npm install`
    *   This command installs necessary Node.js packages and automatically runs `npm run build` to compile the TypeScript code into the `dist` folder.

4.  **Configure `config.json`:**
    *   **Copy:** Make a copy of `config.sample.json` and name it `config.json` in the project's root directory.
    *   **Edit:** Open `config.json` and **carefully review and modify** the settings:
        *   `security.allowedPaths`: **CRITICAL!** Change this from the sample paths to the *actual* directories the server needs access to. For security, be as specific as possible. Start with the project directory itself if unsure (e.g., `"C:\\Servers\\SuperWinCLIServer"` - remember double backslashes `\\`). The service runs as SYSTEM, so paths must be valid for that account.
        *   `security.blockedCommands` / `blockedArguments`: Review the default lists. Add or remove commands/arguments based on your security policy.
        *   `shells`: Enable/disable shells (PowerShell, CMD, Git Bash) and verify the `command` path (especially for Git Bash).
        *   `ssh`: Configure if you intend to use the SSH execution feature (disabled by default).
    *   **Save** the `config.json` file.

5.  **Run Installation Script:**
    *   Open **PowerShell as Administrator**.
    *   Navigate to the project's root directory (`cd C:\Servers\SuperWinCLIServer`).
    *   Execute the installation script: `.\install-service.ps1`
    *   This script uses NSSM to install and configure the `MCPServer` service to run `node.exe dist/index.js` as `LocalSystem`, starting automatically.

6.  **Verify Service Status:**
    *   In the same administrative PowerShell window, run: `Get-Service MCPServer`
    *   The status should be `Running`. If it's `Stopped`, check the NSSM logs or Windows Event Viewer (Application and System logs) for errors.

## Configuration (`config.json`) Details

*   **`security`**:
    *   `maxCommandLength`: Max characters allowed in a command string.
    *   `blockedCommands`: Array of command names (without extension) to block (case-insensitive).
    *   `blockedArguments`: Array of exact arguments to block (case-insensitive).
    *   `allowedPaths`: **Crucial setting.** Array of absolute paths. If `restrictWorkingDirectory` is true, commands can only be executed if their working directory starts with one of these paths. Paths are compared case-insensitively after normalization. Use double backslashes (e.g., `"C:\\Tools\\Scripts"`).
    *   `restrictWorkingDirectory`: Boolean. If true, enforce the `allowedPaths` check for the working directory. Highly recommended to keep `true`.
    *   `logCommands`: Boolean. If true, executed commands and their output (truncated) are stored in memory (up to `maxHistorySize`).
    *   `maxHistorySize`: Max number of commands to keep in the in-memory history.
    *   `commandTimeout`: Seconds before a running command is killed automatically.
    *   `enableInjectionProtection`: Boolean. If true, attempts to block shell operators (`&`, `|`, `;`, etc. defined per shell) in commands.
*   **`shells`**: Configure available local shells (powershell, cmd, gitbash).
    *   `enabled`: Boolean. Allow use of this shell.
    *   `command`: Path to the shell executable.
    *   `args`: Array of default arguments passed to the shell before the user's command.
    *   `blockedOperators`: Array of strings/characters to block within commands for this specific shell (used if `enableInjectionProtection` is true).
*   **`ssh`**: Configure remote command execution via SSH.
    *   `enabled`: Boolean. Enable the `ssh_execute` and `ssh_disconnect` tools.
    *   `connections`: Object containing named connection configurations (host, port, username, password/privateKeyPath).
*   **Configuration Merging:** When `config.json` is loaded, if it contains a `security` or `shells` section, that entire section **replaces** the default configuration for that section. It does *not* merge individual fields within `security` or `shells`. The `ssh` section is merged more granularly. Ensure your `config.json` includes all necessary fields for these sections if you customize them.

## Service Management (NSSM)

Once installed via `install-service.ps1`, you can manage the service using standard Windows tools or NSSM commands from an **administrative PowerShell/CMD** in the project directory:

*   **Start:** `Start-Service MCPServer` or `.\nssm.exe start MCPServer`
*   **Stop:** `Stop-Service MCPServer` or `.\nssm.exe stop MCPServer`
*   **Restart:** `Restart-Service MCPServer` or `.\nssm.exe restart MCPServer`
*   **Status:** `Get-Service MCPServer` or `.\nssm.exe status MCPServer`
*   **Edit Configuration (Advanced):** `.\nssm.exe edit MCPServer` (Opens the NSSM GUI editor)
*   **View Configuration:** `.\nssm.exe dump MCPServer`

## Uninstallation (NSSM)

1.  Open **PowerShell as Administrator**.
2.  Navigate to the project's root directory.
3.  Execute the uninstallation script: `.\uninstall-service.ps1`
4.  This uses NSSM to stop and remove the `MCPServer` service.

## Alternative Execution (Manual/Debug)

You can run the server directly without installing it as a service for testing or debugging purposes:

1.  Ensure you have run `npm install`.
2.  Ensure `config.json` exists and is configured.
3.  Open a normal terminal (PowerShell/CMD) in the project root.
4.  Run: `npm run start`
5.  The server will run in the foreground. Press `Ctrl + C` to stop it.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.