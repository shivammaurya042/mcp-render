// import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// import { z } from "zod";

// const API_BASE_URL = "https://api.render.com";


// // Helper function for making Render API requests
// async function getListOfServiceRequest<T>(url: string): Promise<T[] | null> {
//     try {
//         const response = await fetch(url, {
//             headers: {
//                 'accept': 'application/json',
//                 'Authorization': `Bearer rnd_LY1CFXNCRh6PYMShYONebR5iebCI`,
//                 // 'Authorization': `Bearer ${process.env.RENDER_API_KEY}`,
//             },
//         });
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         return await response.json();
//     } catch (error) {
//         console.error("Error making Render request:", error);
//         return null;
//     }
// }

// interface ServiceDetails {
//     buildCommand?: string;
//     parentServer?: {
//         id: string;
//         name: string;
//     };
//     publishPath?: string;
//     previews?: {
//         generation: string;
//     };
//     url?: string;
//     buildPlan?: string;
//     region?: string;
//     env?: string;
//     plan?: string;
// }

// interface Service {
//     id: string;
//     autoDeploy: string;
//     branch: string;
//     buildFilter?: {
//         paths: string[];
//         ignoredPaths: string[];
//     };
//     createdAt: string;
//     dashboardUrl: string;
//     environmentId: string;
//     imagePath: string;
//     name: string;
//     notifyOnFail: string;
//     ownerId: string;
//     registryCredential?: {
//         id: string;
//         name: string;
//     };
//     repo: string;
//     rootDir: string;
//     slug: string;
//     suspended: string;
//     suspenders?: string[];
//     type: string;
//     updatedAt: string;
//     serviceDetails: ServiceDetails;
// }

// interface ServiceData {
//     service: Service;
//     cursor: string;
// }

// // Format service data
// function formatService(serviceData: ServiceData) {
//     const service = serviceData.service;
//     const details = service.serviceDetails;
//     return [
//         `Name: ${service.name}`,
//         `Type: ${service.type}`,
//         `Status: ${service.suspended}`,
//         `Region: ${details.region || 'Not specified'}`,
//         `Environment: ${details.env || 'Not specified'}`,
//         `Plan: ${details.buildPlan || details.plan || 'Not specified'}`,
//         `URL: ${details.url || 'Not deployed'}`,
//         `Auto Deploy: ${service.autoDeploy}`,
//         `Branch: ${service.branch}`,
//         `Created At: ${service.createdAt}`,
//         "---"
//     ].join("\n");
// }

// export async function getServices() {
//     const servicesUrl = `${API_BASE_URL}/v1/services?includePreviews=true&limit=20`;
//     const servicesData = await getListOfServiceRequest<ServiceData>(servicesUrl);
    
//     if (!servicesData) {
//         return {
//             content: [
//                 {
//                     type: "text",
//                     text: "Failed to retrieve services data",
//                 },
//             ],
//         };
//     }

//     if (servicesData.length === 0) {
//         return {
//             content: [
//                 {
//                     type: "text",
//                     text: "No services found",
//                 },
//             ],
//         };
//     }

//     const formattedServices = servicesData.map((data: ServiceData) => formatService(data));
//     const servicesText = `Available Render Services:\n\n${formattedServices.join("\n")}`;
    
//     return {
//         content: [
//             {
//                 type: "text",
//                 text: servicesText,
//             },
//         ],
//     };
// };

// getServices().then((result) => {
//     console.log(result);
// });