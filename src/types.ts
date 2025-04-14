// TypeScript interfaces extracted from index.ts

export interface ServiceDetails {
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

export interface Service {
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

export interface ServiceData {
    service: Service;
    cursor: string;
}

export interface DeployData {
    deploy: {
        id: string;
        commit: {
            id: string;
            message: string;
            createdAt: string;
        };
        status: string;
        trigger: string;
        finishedAt: string;
        createdAt: string;
        updatedAt: string;
    };
    cursor: string;
}

export interface DeployResponse {
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

export interface EnvVar {
    key: string;
    value: string;
}

export interface EnvResponseItem {
    envVar: EnvVar;
    cursor: string;
}

export type EnvResponse = EnvResponseItem[];
