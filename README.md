# MCP Render

A render service application built with TypeScript.

## Features
- [List key features based on package.json scripts and dependencies]

## Installation
```bash
npx mcp-server
```

## Configuration
1. Get your Render API key from [Render Dashboard](https://dashboard.render.com/account/api-keys)

## Usage
To integrate this server with the desktop app, add the following to your app's server configuration:

#### NPX

```json
{
  "mcpServers": {
    "render": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-render"
      ],
      "env": {
        "RENDER_API_KEY": "<YOUR_RENDER_API_KEY>"
      }
    }
  }
}
```

## Development
```bash
npm run dev
```

## License
This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.