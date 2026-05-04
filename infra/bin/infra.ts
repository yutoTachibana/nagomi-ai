#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { KomorebiStack } from '../lib/komorebi-stack';

const app = new cdk.App();

new KomorebiStack(app, 'KomorebiStack', {
  env: {
    account: '141166306676',
    region: 'ap-northeast-1',
  },
  description: 'こもれび - 長期伴走型メンタルケアアプリ',
});

app.synth();
