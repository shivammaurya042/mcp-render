#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
const API_BASE_URL = "https://api.render.com";
// Create server instance
const server = new McpServer({
    name: "render",
    version: "1.0.0",
});
function getApiKey() {
    const apiKey = process.env.RENDER_API_KEY;
    if (!apiKey) {
        console.error("RENDER_API_KEY environment variable is not set");
        process.exit(1);
    }
    return apiKey;
}
const RENDER_API_KEY = getApiKey();
// Helper function for making Render API requests
async function getListOfServiceRequest(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${RENDER_API_KEY}`,
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error("Error making Render request:", error);
        return null;
    }
}
// Format service data
function formatService(serviceData) {
    const service = serviceData.service;
    const details = service.serviceDetails;
    return [
        `Name: ${service.name}`,
        `Type: ${service.type}`,
        `Status: ${service.suspended}`,
        `Region: ${details.region || 'Not specified'}`,
        `Environment: ${details.env || 'Not specified'}`,
        `Plan: ${details.buildPlan || details.plan || 'Not specified'}`,
        `URL: ${details.url || 'Not deployed'}`,
        `Auto Deploy: ${service.autoDeploy}`,
        `Branch: ${service.branch}`,
        `Created At: ${service.createdAt}`,
        "---"
    ].join("\n");
}
// Register render service tools
server.tool("get-render-services", "Get list of available services", async () => {
    const servicesUrl = `${API_BASE_URL}/v1/services?includePreviews=true&limit=20`;
    const servicesData = await getListOfServiceRequest(servicesUrl);
    if (!servicesData) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve services data",
                },
            ],
        };
    }
    if (servicesData.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: "No services found",
                },
            ],
        };
    }
    const formattedServices = servicesData.map((data) => formatService(data));
    const servicesText = `Available Render Services:\n\n${formattedServices.join("\n")}`;
    return {
        content: [
            {
                type: "text",
                text: servicesText,
            },
        ],
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Render MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
