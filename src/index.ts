#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const API_BASE_URL = "https://api.render.com";

// Create server instance
const server = new McpServer({
    name: "render",
    version: "1.0.0",
});

function getApiKey(): string {
    const apiKey = process.env.RENDER_API_KEY;
    if (!apiKey) {
      console.error("RENDER_API_KEY environment variable is not set");
      process.exit(1);
    }
    return apiKey;
  }

const RENDER_API_KEY = getApiKey();

// Helper function for making Render API requests
async function getListOfServiceRequest<T>(url: string): Promise<T[] | null> {
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
    } catch (error) {
        console.error("Error making Render request:", error);
        return null;
    }
}

interface ServiceDetails {
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

// Format service data
function formatService(serviceData: ServiceData) {
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
    const servicesData = await getListOfServiceRequest<ServiceData>(servicesUrl);
    
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

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Render MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
