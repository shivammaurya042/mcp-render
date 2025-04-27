#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const API_BASE_URL = "https://api.render.com";
// Create server instance
const server = new McpServer({
    name: "render",
    version: "1.0.0",
    instructions: "To use this server, you need to set the RENDER_API_KEY environment variable to a valid Render API key."
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
async function getResponseFromRender(url, options) {
    try {
        const response = await fetch(url, {
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${RENDER_API_KEY}`,
            },
            ...options,
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Render API Error: ${errorData.message}`);
        }
        const contentLength = response.headers.get('content-length');
        if (contentLength === '0' || response.status === 204) {
            return {};
        }
        return await response.json();
    }
    catch (error) {
        console.error("Error making Render request:", error);
        throw error;
    }
}
// Helper function to create standard text response
// Explicitly define the return structure to match McpServer.tool expectations
function createTextResponse(text) {
    return {
        content: [
            {
                type: "text",
                text: text,
            },
        ],
    };
}
// Register render service tools
server.tool("get-services", "Get list of available services", async () => {
    try {
        const servicesUrl = `${API_BASE_URL}/v1/services?includePreviews=true&limit=20`;
        const servicesData = await getResponseFromRender(servicesUrl);
        if (servicesData.length === 0) {
            return createTextResponse("No services found");
        }
        const servicesText = `Available Render Services:\n\n${JSON.stringify(servicesData, null, 2)}`;
        return createTextResponse(servicesText);
    }
    catch (error) {
        return createTextResponse(`Failed to retrieve services list: ${error}`);
    }
});
server.tool("create-service", "Create a new Render service", {
    name: z.string(),
    type: z.enum(['static_site', 'web_service', 'private_service', 'background_worker', 'cron_job']),
    ownerId: z.string(),
    repo: z.string().optional(),
    envVars: z.array(z.object({
        key: z.string(),
        value: z.string()
    })).optional()
}, async ({ name, type, ownerId, repo, envVars }) => {
    try {
        const serviceUrl = `${API_BASE_URL}/v1/services`;
        const serviceResponse = await getResponseFromRender(serviceUrl, {
            method: 'POST',
            body: JSON.stringify({
                name,
                ownerId,
                type,
                repo,
                envVars
            })
        });
        return createTextResponse(`Service created successfully:\n${JSON.stringify(serviceResponse, null, 2)}`);
    }
    catch (error) {
        return createTextResponse(`Failed to create service: ${error}`);
    }
});
server.tool("get-deploys", "Get list of available deploys", { serviceId: z.string() }, async ({ serviceId }) => {
    try {
        const servicesUrl = `${API_BASE_URL}/v1/services/${serviceId}/deploys?limit=20`;
        const deployData = await getResponseFromRender(servicesUrl);
        if (deployData.length === 0) {
            return createTextResponse("No deploys found");
        }
        const deploysText = `Available Render Deploys:\n\n${JSON.stringify(deployData, null, 2)}`;
        return createTextResponse(deploysText);
    }
    catch (error) {
        return createTextResponse(`Failed to retrieve deploys: ${error}`);
    }
});
server.tool("trigger-deploy", "Trigger a deploy", { serviceId: z.string() }, async ({ serviceId }) => {
    try {
        const deployUrl = `${API_BASE_URL}/v1/services/${serviceId}/deploys`;
        const deployResponse = await getResponseFromRender(deployUrl, {
            method: 'POST'
        });
        return createTextResponse(`Deploy triggered with status: ${deployResponse.status}. Complete detail:\n${JSON.stringify(deployResponse, null, 2)}`);
    }
    catch (error) {
        return createTextResponse(`Failed to trigger deploy: ${error}`);
    }
});
server.tool("retrieve-deploy", "Retrieve a deploy to check status details", { serviceId: z.string(), deployId: z.string() }, async ({ serviceId, deployId }) => {
    try {
        const deployUrl = `${API_BASE_URL}/v1/services/${serviceId}/deploys/${deployId}`;
        const deployResponse = await getResponseFromRender(deployUrl, {
            method: 'GET'
        });
        return createTextResponse(`Deploy retrieve status: ${deployResponse.status}. Complete detail:\n${JSON.stringify(deployResponse, null, 2)}`);
    }
    catch (error) {
        return createTextResponse(`Failed to retrieve deploy: ${error}`);
    }
});
server.tool("cancel-deploy", "Cancel a deploy", { serviceId: z.string(), deployId: z.string() }, async ({ serviceId, deployId }) => {
    try {
        const deployUrl = `${API_BASE_URL}/v1/services/${serviceId}/deploys/${deployId}/cancel`;
        const deployResponse = await getResponseFromRender(deployUrl, {
            method: 'POST'
        });
        return createTextResponse(`Deploy cancel status: ${deployResponse.status}. Complete detail:\n${JSON.stringify(deployResponse, null, 2)}`);
    }
    catch (error) {
        return createTextResponse(`Failed to cancel deploy: ${error}`);
    }
});
server.tool("list-env-var", "List environment variables", { serviceId: z.string() }, async ({ serviceId }) => {
    try {
        const envUrl = `${API_BASE_URL}/v1/services/${serviceId}/env-vars`;
        const envResponse = await getResponseFromRender(envUrl, {
            method: 'GET'
        });
        return createTextResponse(`Environment variables list:\n${JSON.stringify(envResponse, null, 2)}`);
    }
    catch (error) {
        return createTextResponse(`Failed to list environment variables: ${error}`);
    }
});
server.tool("add-update-env-var", "Add or update environment variables", { serviceId: z.string(), envVarKey: z.string(), envVarValue: z.string() }, async ({ serviceId, envVarKey, envVarValue }) => {
    try {
        const envUrl = `${API_BASE_URL}/v1/services/${serviceId}/env-vars/${envVarKey}`;
        const envResponse = await getResponseFromRender(envUrl, {
            method: 'PUT',
            body: JSON.stringify({ value: envVarValue })
        });
        return createTextResponse(`Env. variable added/updated:\n${JSON.stringify(envResponse, null, 2)}`);
    }
    catch (error) {
        return createTextResponse(`Failed to add/update env. variable: ${error}`);
    }
});
server.tool("delete-env-var", "Delete environment variables", { serviceId: z.string(), envVarKey: z.string() }, async ({ serviceId, envVarKey }) => {
    try {
        const envUrl = `${API_BASE_URL}/v1/services/${serviceId}/env-vars/${envVarKey}`;
        await getResponseFromRender(envUrl, {
            method: 'DELETE'
        });
        return createTextResponse(`Env. variable '${envVarKey}' deleted successfully.`);
    }
    catch (error) {
        return createTextResponse(`Failed to delete env. variable '${envVarKey}'. ${error}`);
    }
});
server.tool("get-owners", "Get list of Render owners (users/teams)", async () => {
    try {
        const ownersUrl = `${API_BASE_URL}/v1/owners?limit=20`;
        const ownersResponse = await getResponseFromRender(ownersUrl);
        return createTextResponse(`Available owners:\n${JSON.stringify(ownersResponse, null, 2)}. If multiple owners found, ask user which one to use.`);
    }
    catch (error) {
        return createTextResponse(`Failed to fetch owners: ${error}`);
    }
});
server.tool("get-logs", "Get logs for a service", { ownerId: z.string(), serverId: z.string() }, async ({ ownerId, serverId }) => {
    try {
        const logsUrl = `${API_BASE_URL}/v1/logs?ownerId=${ownerId}&direction=backward&resource=${serverId}&limit=40`;
        const logsResponse = await getResponseFromRender(logsUrl, {
            method: 'GET'
        });
        return createTextResponse(`Logs:\n${JSON.stringify(logsResponse, null, 2)}`);
    }
    catch (error) {
        return createTextResponse(`Failed to get logs: ${error}`);
    }
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
