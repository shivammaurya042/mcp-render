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
// Format service data
function formatService(serviceData) {
    const service = serviceData.service;
    const details = service.serviceDetails;
    return [
        `ID: ${service.id}`,
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
server.tool("get-services", "Get list of available services", async () => {
    try {
        const servicesUrl = `${API_BASE_URL}/v1/services?includePreviews=true&limit=20`;
        const servicesData = await getResponseFromRender(servicesUrl);
        if (servicesData.length === 0) {
            return createTextResponse("No services found");
        }
        const formattedServices = servicesData.map((data) => formatService(data));
        const servicesText = `Available Render Services:\n\n${formattedServices.join("\n")}`;
        return createTextResponse(servicesText);
    }
    catch (error) {
        return createTextResponse(`Failed to retrieve services list: ${error}`);
    }
});
server.tool("get-deploys", "Get list of available deploys", { serviceId: z.string() }, async ({ serviceId }) => {
    try {
        const servicesUrl = `${API_BASE_URL}/v1/services/${serviceId}/deploys?limit=20`;
        const deployData = await getResponseFromRender(servicesUrl);
        if (deployData.length === 0) {
            return createTextResponse("No deploys found");
        }
        const formattedDeploys = deployData.map((data) => formatDeploy(data));
        const deploysText = `Available Render Deploys:\n\n${formattedDeploys.join("\n")}`;
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
server.tool("retrieve-deploy", "Retrieve a deploy", { serviceId: z.string(), deployId: z.string() }, async ({ serviceId, deployId }) => {
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
function formatDeploy(deployData) {
    const deploy = deployData.deploy;
    return [
        `ID: ${deploy.id}`,
        `Commit: ${deploy.commit.id}`,
        `Commit Message: ${deploy.commit.message}`,
        `Commit Created At: ${deploy.commit.createdAt}`,
        `Status: ${deploy.status}`,
        `Trigger: ${deploy.trigger}`,
        `Finished At: ${deploy.finishedAt}`,
        `Created At: ${deploy.createdAt}`,
        `Updated At: ${deploy.updatedAt}`,
        "---"
    ].join("\n");
}
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Render MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
