#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ServiceData, DeployData, DeployResponse, EnvVar, EnvResponse } from "./types.js";

const API_BASE_URL = "https://api.render.com";

// Create server instance
const server = new McpServer({
    name: "render",
    version: "1.0.0",
});

function getApiKey(): string {
    const apiKey = "rnd_LY1CFXNCRh6PYMShYONebR5iebCI";
    // const apiKey = process.env.RENDER_API_KEY;
    if (!apiKey) {
      console.error("RENDER_API_KEY environment variable is not set");
      process.exit(1);
    }
    return apiKey;
  }

const RENDER_API_KEY = getApiKey();

// Helper function for making Render API requests
async function getResponseFromRender<T>(url: string, options?: RequestInit): Promise<T[] | null> {
    try {
        const response = await fetch(url, {
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${RENDER_API_KEY}`,
            },
            ...options,
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error making Render request:", error);
        return null;
    }
}

// Format service data
function formatService(serviceData: ServiceData) {
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
    const servicesUrl = `${API_BASE_URL}/v1/services?includePreviews=true&limit=20`;
    const servicesData = await getResponseFromRender<ServiceData>(servicesUrl);
    
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

    const formattedServices = servicesData.map((data: ServiceData) => formatService(data));
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

server.tool("get-deploys", "Get list of available deploys", { serviceId: z.string() }, async ({ serviceId }) => {
    const servicesUrl = `${API_BASE_URL}/v1/services/${serviceId}/deploys?limit=20`;
    const servicesData = await getResponseFromRender<DeployData>(servicesUrl);
    
    if (!servicesData) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve deploys data",
                },
            ],
        };
    }

    if (servicesData.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: "No deploys found",
                },
            ],
        };
    }

    const formattedDeploys = servicesData.map((data: DeployData) => formatDeploy(data));
    const deploysText = `Available Render Deploys:\n\n${formattedDeploys.join("\n")}`;
    
    return {
        content: [
            {
                type: "text",
                text: deploysText,
            },
        ],
    };
});

server.tool("trigger-deploy", "Trigger a deploy", { serviceId: z.string() }, async ({ serviceId }) => {
    const deployUrl = `${API_BASE_URL}/v1/services/${serviceId}/deploys`;
    const deployResponse = await getResponseFromRender<DeployResponse>(deployUrl, {
      method: 'POST'
    }) as DeployResponse | null;
    
    if (!deployResponse) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to trigger deploy",
                },
            ],
        };
    }

    return {
        content: [
            {
                type: "text",
                text: `Deploy triggered with status: ${deployResponse.status}. Complete detail:\n${JSON.stringify(deployResponse, null, 2)}`,
            },
        ],
    };
});

server.tool("retrieve-deploy", "Retrieve a deploy", { serviceId: z.string(), deployId: z.string() }, async ({ serviceId, deployId }) => {
    const deployUrl = `${API_BASE_URL}/v1/services/${serviceId}/deploys/${deployId}`;
    const deployResponse = await getResponseFromRender<DeployResponse>(deployUrl, {
      method: 'GET'
    }) as DeployResponse | null;
    
    if (!deployResponse) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve deploy",
                },
            ],
        };
    }

    return {
        content: [
            {
                type: "text",
                text: `Deploy retrieve status: ${deployResponse.status}. Complete detail:\n${JSON.stringify(deployResponse, null, 2)}`,
            },
        ],
    };
});

server.tool("cancel-deploy", "Cancel a deploy", { serviceId: z.string(), deployId: z.string() }, async ({ serviceId, deployId }) => {
    const deployUrl = `${API_BASE_URL}/v1/services/${serviceId}/deploys/${deployId}/cancel`;
    const deployResponse = await getResponseFromRender<DeployResponse>(deployUrl, {
      method: 'POST'
    }) as DeployResponse | null;
    
    if (!deployResponse) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to cancel deploy",
                },
            ],
        };
    }

    return {
        content: [
            {
                type: "text",
                text: `Deploy cancel status: ${deployResponse.status}. Complete detail:\n${JSON.stringify(deployResponse, null, 2)}`,
            },
        ],
    };
});

server.tool("list-env-var", "List environment variables", { serviceId: z.string() }, async ({ serviceId }) => {
    const envUrl = `${API_BASE_URL}/v1/services/${serviceId}/env`;
    const envResponse = await getResponseFromRender<EnvResponse>(envUrl, {
      method: 'GET'
    }) as EnvResponse | null;
    
    if (!envResponse) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to list environment variables",
                },
            ],
        };
    }

    return {
        content: [
            {
                type: "text",
                text: `Environment variables list:\n${JSON.stringify(envResponse, null, 2)}`,
            },
        ],
    };
});

server.tool("add-update-env-var", "Add or update environment variables", { serviceId: z.string(), envVarKey: z.string(), envVarValue: z.string() }, async ({ serviceId, envVarKey, envVarValue }) => {
    const envUrl = `${API_BASE_URL}/v1/services/${serviceId}/env-vars/${envVarKey}`;
    const envResponse = await getResponseFromRender<EnvVar>(envUrl, {
      method: 'PUT',
      body: JSON.stringify({ value: envVarValue })
    }) as EnvVar | null;
    
    if (!envResponse) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to add/update environment variable",
                },
            ],
        };
    }

    return {
        content: [
            {
                type: "text",
                text: `Env. variable added/updated:\n${JSON.stringify(envResponse, null, 2)}`,
            },
        ],
    };
});

server.tool("delete-env-var", "Delete environment variables", { serviceId: z.string(), envVarKey: z.string() }, async ({ serviceId, envVarKey }) => {
    const envUrl = `${API_BASE_URL}/v1/services/${serviceId}/env-vars/${envVarKey}`;
    const envResponse = await getResponseFromRender(envUrl, {
      method: 'DELETE'
    });
    
    if (!envResponse) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to delete environment variable",
                },
            ],
        };
    }

    return {
        content: [
            {
                type: "text",
                text: `API response:\n${JSON.stringify(envResponse, null, 2)}`,
            },
        ],
    };
});

function formatDeploy(deployData: DeployData) {
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
