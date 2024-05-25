import * as cdk from 'aws-cdk-lib';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import { Kms } from './kms';

export type BedrockGuardrailProps = {
  name: string;
};

export class BedrockGuardrail extends Construct {
    public readonly key: kms.Key;
    public readonly guardrail: bedrock.CfnGuardrail;

    constructor(scope: Construct, id: string, props: BedrockGuardrailProps) {
        super(scope, id);

        this.key = new Kms(this, 'KmsKeyGuardrail', {
          alias: `guardrail/${props.name}`,
        }).key;

        this.guardrail = new bedrock.CfnGuardrail(this, 'BedrockGuardrail', {
            name: props.name,
            description: 'high ristrictions',

            blockedInputMessaging: 'Due to guardrails, the model cannot answer this question.',
            blockedOutputsMessaging: 'Due to guardrails, the model cannot answer this question.',

            contentPolicyConfig: {
                filtersConfig: this.highContentPolicyConfig(), 
            },
            kmsKeyArn: this.key.keyArn,
        });
  }

  highContentPolicyConfig() {
    const types = ['SEXUAL', 'VIOLENCE', 'HATE', 'INSULTS', 'MISCONDUCT', 'PROMPT_ATTACK'];
    return types.map(t => {
      return {
        inputStrength: 'HIGH',
        outputStrength: t === 'PROMPT_ATTACK' ? 'NONE' : 'HIGH',
        type: t,
      }
    });
  }
}