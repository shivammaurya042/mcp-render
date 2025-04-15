# MCP Render

This MCP (Model Context Protocol) server makes managing your Render.com account refreshingly easy. Skip the endless clicking, just connect it to your favorite MCP client (like Claude app or windsurf/cursor), tell your LLM what you want done, and let it handle your Render services for you. Deployment management without the UI hassle, because you’ve got better things to do.

## Features
- Get services list
- Get deploys list
- Trigger deploy
- Retrieve deploy
- Cancel deploy
- List environment variables
- Add/update environment variables
- Delete environment variables
- Get logs

## Installation
```bash
npx mcp-server
```

## Configuration
1. Get your Render API key from [Render Dashboard](https://dashboard.render.com)
Steps:
- Click on your profile picture in the top right corner
- Select "Account Settings" from the dropdown menu
- Navigate to the "API Keys" section
- Click "Create API Key"

## Usage
To integrate this server with the MCP client (ex: claude app, windsurf/cursor), add the following to your app's server configuration:

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

## Testing the MCP server
Use MCP inspector tool to test MCP server -> [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

Use command:
```bash
npx @modelcontextprotocol/inspector -e RENDER_API_KEY=<YOUR_RENDER_API_KEY> node build/index.js
```

## Contributing
Contributions are welcome! Here's how you can help:

1. **Report Bugs**
   - Search existing issues to avoid duplicates
   - Provide detailed steps to reproduce the issue
   - Include relevant error messages and screenshots if possible

2. **Suggest a new capability**
   - Open a new issue with a clear description
   - Explain the use case and potential benefits

3. **Submit Pull Requests**
   - Fork the repository
   - Create a feature branch (`git checkout -b feature/amazing-feature`)
   - Commit your changes (`git commit -m 'Add some amazing feature'`)
   - Push to the branch (`git push origin feature/amazing-feature`)
   - Open a Pull Request


## License
This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.