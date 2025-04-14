#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

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

interface ServiceDetails {
    id: string;
    buildCommand?: string;
    parentServer?: {
        id: string;
        name: string;
    };
    publishPath?: string;
    previews?: {
        generation: string;
    };
    url?: string;
    buildPlan?: string;
    region?: string;
    env?: string;
    plan?: string;
}

interface Service {
    id: string;
    autoDeploy: string;
    branch: string;
    buildFilter?: {
        paths: string[];
        ignoredPaths: string[];
    };
    createdAt: string;
    dashboardUrl: string;
    environmentId: string;
    imagePath: string;
    name: string;
    notifyOnFail: string;
    ownerId: string;
    registryCredential?: {
        id: string;
        name: string;
    };
    repo: string;
    rootDir: string;
    slug: string;
    suspended: string;
    suspenders?: string[];
    type: string;
    updatedAt: string;
    serviceDetails: ServiceDetails;
}

interface ServiceData {
    service: Service;
    cursor: string;
}

interface DeployData {
    deploy: {
        id: string;
        commit: {
            id: string;
            message: string;
            createdAt: string;
        };
        image: {
            ref: string;
            sha: string;
            registryCredential: string;
        };
        status: string;
        trigger: string;
        finishedAt: string;
        createdAt: string;
        updatedAt: string;
    };
    cursor: string;
}

interface DeployResponse {
  id: string;
  commit: {
    id: string;
    message: string;
    createdAt: string;
  };
  status: string;
  trigger: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
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

function formatDeploy(deployData: DeployData) {
    const deploy = deployData.deploy;
    return [
        `ID: ${deploy.id}`,
        `Commit: ${deploy.commit.id}`,
        `Commit Message: ${deploy.commit.message}`,
        `Commit Created At: ${deploy.commit.createdAt}`,
        `Image Ref: ${deploy?.image?.ref}`,
        `Image SHA: ${deploy?.image?.sha}`,
        `Image Registry Credential: ${deploy?.image?.registryCredential}`,
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
