import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import { Construct } from 'constructs';

export class KomorebiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- VPC (NAT Gateway なし = 無料) ---
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // --- Security Groups ---
    const ecsSg = new ec2.SecurityGroup(this, 'EcsSg', {
      vpc,
      description: 'Komorebi ECS tasks',
      allowAllOutbound: true,
    });

    const efsSg = new ec2.SecurityGroup(this, 'EfsSg', {
      vpc,
      description: 'Komorebi EFS',
      allowAllOutbound: false,
    });

    ecsSg.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(3000),
      'Allow inbound 3000 from VPC',
    );

    efsSg.addIngressRule(
      ecsSg,
      ec2.Port.tcp(2049),
      'Allow NFS from ECS tasks',
    );

    // --- EFS (SQLite データ永続化) ---
    const fileSystem = new efs.FileSystem(this, 'DataEfs', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: efsSg,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const accessPoint = fileSystem.addAccessPoint('AppData', {
      path: '/komorebi-data',
      createAcl: {
        ownerUid: '1001',
        ownerGid: '1001',
        permissions: '0755',
      },
      posixUser: {
        uid: '1001',
        gid: '1001',
      },
    });

    // --- ECR Repository ---
    const ecrRepo = new ecr.Repository(this, 'EcrRepo', {
      repositoryName: 'komorebi',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      imageScanOnPush: true,
    });

    // --- ECS Cluster ---
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      clusterName: 'komorebi',
    });

    const namespace = new servicediscovery.PrivateDnsNamespace(this, 'Namespace', {
      name: 'komorebi.local',
      vpc,
    });

    // --- Task Definition ---
    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: 256,      // 0.25 vCPU (最小)
      memoryLimitMiB: 512,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    // EFS volume
    taskDef.addVolume({
      name: 'app-data',
      efsVolumeConfiguration: {
        fileSystemId: fileSystem.fileSystemId,
        transitEncryption: 'ENABLED',
        authorizationConfig: {
          accessPointId: accessPoint.accessPointId,
          iam: 'ENABLED',
        },
      },
    });

    fileSystem.grantRootAccess(taskDef.taskRole);

    // --- App Container ---
    const container = taskDef.addContainer('app', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepo, 'latest'),
      portMappings: [
        {
          containerPort: 3000,
          name: 'app',
          appProtocol: ecs.AppProtocol.http,
        },
      ],
      environment: {
        DATABASE_PATH: '/app/data/komorebi.db',
        NODE_ENV: 'production',
        AUTH_SECRET: 'g5cnmjHmkVcAEqtizC6SSTxP7CFZ//FypVuDo66/OQs=',
        AUTH_URL: 'https://j4wtcklcg4.execute-api.ap-northeast-1.amazonaws.com',
        NEXT_PUBLIC_APP_URL: 'https://j4wtcklcg4.execute-api.ap-northeast-1.amazonaws.com',
        ANTHROPIC_MODEL: 'claude-sonnet-4-6',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
        AUTH_TWITTER_ID: 'dmpGS2t6NUNPWTFiaEJ1RGVtYUo6MTpjaQ',
        AUTH_TWITTER_SECRET: process.env.AUTH_TWITTER_SECRET ?? '',
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'komorebi',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      healthCheck: {
        command: ['CMD-SHELL', 'wget -q -O /dev/null http://localhost:3000/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 5,
        startPeriod: cdk.Duration.seconds(120),
      },
    });

    container.addMountPoints({
      sourceVolume: 'app-data',
      containerPath: '/app/data',
      readOnly: false,
    });

    // --- Fargate Service ---
    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      assignPublicIp: true,
      securityGroups: [ecsSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      cloudMapOptions: {
        cloudMapNamespace: namespace,
        name: 'app',
        containerPort: 3000,
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: cdk.Duration.seconds(10),
      },
    });

    // --- API Gateway HTTP API ---
    const vpcLink = new apigwv2.VpcLink(this, 'VpcLink', {
      vpc,
      subnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [ecsSg],
    });

    const httpApi = new apigwv2.HttpApi(this, 'HttpApi', {
      apiName: 'komorebi',
    });

    const integration = new apigwv2_integrations.HttpServiceDiscoveryIntegration(
      'EcsIntegration',
      service.cloudMapService!,
      { vpcLink },
    );

    // All routes proxy to ECS
    new apigwv2.HttpRoute(this, 'DefaultRoute', {
      httpApi,
      routeKey: apigwv2.HttpRouteKey.with('/{proxy+}', apigwv2.HttpMethod.ANY),
      integration,
    });

    // Root route
    new apigwv2.HttpRoute(this, 'RootRoute', {
      httpApi,
      routeKey: apigwv2.HttpRouteKey.with('/', apigwv2.HttpMethod.ANY),
      integration,
    });

    // --- CloudMap ポート自動修正 Lambda ---
    const cloudMapService = service.cloudMapService!;

    const portFixLambda = new lambda.Function(this, 'CloudMapPortFix', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        SERVICE_ID: cloudMapService.serviceId,
        PORT: '3000',
      },
      code: lambda.Code.fromInline(`
import boto3
import os
import json

sd = boto3.client('servicediscovery')
SERVICE_ID = os.environ['SERVICE_ID']
PORT = os.environ['PORT']

def handler(event, context):
    print(json.dumps(event, default=str))
    paginator = sd.get_paginator('list_instances')
    for page in paginator.paginate(ServiceId=SERVICE_ID):
        for inst in page['Instances']:
            attrs = inst.get('Attributes', {})
            if 'AWS_INSTANCE_PORT' not in attrs:
                instance_id = inst['Id']
                print(f"Patching instance {instance_id}: adding AWS_INSTANCE_PORT={PORT}")
                attrs['AWS_INSTANCE_PORT'] = PORT
                sd.register_instance(
                    ServiceId=SERVICE_ID,
                    InstanceId=instance_id,
                    Attributes=attrs,
                )
                print(f"Patched {instance_id}")
            else:
                print(f"Instance {inst['Id']} already has port={attrs['AWS_INSTANCE_PORT']}")
    return {'statusCode': 200}
`),
    });

    portFixLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'servicediscovery:ListInstances',
          'servicediscovery:RegisterInstance',
        ],
        resources: ['*'],
      }),
    );

    // ECS タスクが RUNNING になったら Lambda を実行
    const rule = new events.Rule(this, 'EcsTaskRunning', {
      description: 'Trigger CloudMap port fix when komorebi tasks start',
      eventPattern: {
        source: ['aws.ecs'],
        detailType: ['ECS Task State Change'],
        detail: {
          clusterArn: [{ suffix: ':cluster/komorebi' }] as any,
          lastStatus: ['RUNNING'],
        },
      },
    });

    rule.addTarget(new events_targets.LambdaFunction(portFixLambda));

    // --- Outputs ---
    new cdk.CfnOutput(this, 'AppUrl', {
      value: httpApi.apiEndpoint,
      description: 'Application URL',
    });

    new cdk.CfnOutput(this, 'EcrRepoUri', {
      value: ecrRepo.repositoryUri,
      description: 'ECR Repository URI (docker push target)',
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
    });
  }
}
