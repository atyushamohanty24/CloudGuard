import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  Copy,
  Check,
  Shield,
  Key,
  Terminal,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const OnboardingScreen: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [roleFormat, setRoleFormat] = useState<'terraform' | 'cloudformation'>('terraform');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setTesting(false);
    setTestSuccess(true);
  };

  const terraformRoleSnippet = `module "cloudguard_readonly_role" {
  source = "git::https://github.com/cloudguard/cloudguard-ai.git//infra/modules/readonly-role"

  cloudguard_account_id = "123456789012" # CloudGuard AI Auditor Account
  external_id           = "cg-ext-uuid-984210" # Random high-entropy external ID
}`;

  const cfnRoleSnippet = `AWSTemplateFormatVersion: '2010-09-09'
Description: 'CloudGuard AI Read-Only Audit Cross-Account Role'
Resources:
  CloudGuardReadOnlyRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: CloudGuardAIReadOnlyRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: 'arn:aws:iam::123456789012:root'
            Action: 'sts:AssumeRole'
            Condition:
              StringEquals:
                'sts:ExternalId': 'cg-ext-uuid-984210'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/SecurityAudit'
        - 'arn:aws:iam::aws:policy/job-function/ViewOnlyAccess'`;

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl">
      {/* Title */}
      <div className="glass-panel p-6 rounded-2xl border border-border shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-ai-cyan" />
          <h2 className="text-lg font-bold text-text-primary">
            3-Step Read-Only Account Connection Guide
          </h2>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          CloudGuard AI requires zero mutating permissions. Auditing is accomplished using an AWS IAM Cross-Account Role with AWS-managed <code className="text-text-primary font-mono bg-surface-elevated px-1 py-0.5 rounded">SecurityAudit</code> and <code className="text-text-primary font-mono bg-surface-elevated px-1 py-0.5 rounded">ViewOnlyAccess</code> policies.
        </p>
      </div>

      {/* Step 1 */}
      <div className="glass-panel rounded-2xl border border-border p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-ai-violet/20 border border-ai-violet/30 flex items-center justify-center text-xs font-mono font-bold text-purple-300">
            1
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              Deploy Least-Privilege IAM Cross-Account Role
            </h3>
            <p className="text-xs text-text-secondary">
              Deploy the role in your target AWS account using either Terraform or CloudFormation.
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 font-mono text-xs">
              <button
                onClick={() => setRoleFormat('terraform')}
                className={`px-2.5 py-1 rounded-md ${
                  roleFormat === 'terraform'
                    ? 'bg-surface-elevated text-text-primary font-bold border border-border'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Terraform
              </button>
              <button
                onClick={() => setRoleFormat('cloudformation')}
                className={`px-2.5 py-1 rounded-md ${
                  roleFormat === 'cloudformation'
                    ? 'bg-surface-elevated text-text-primary font-bold border border-border'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                CloudFormation
              </button>
            </div>

            <button
              onClick={() =>
                handleCopy(
                  roleFormat === 'terraform' ? terraformRoleSnippet : cfnRoleSnippet,
                  'step-1-code'
                )
              }
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary font-mono"
            >
              {copiedKey === 'step-1-code' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Blueprint</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#080B0F] border border-border text-xs font-mono text-emerald-400/90 overflow-x-auto whitespace-pre-wrap select-all">
            {roleFormat === 'terraform' ? terraformRoleSnippet : cfnRoleSnippet}
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="glass-panel rounded-2xl border border-border p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-ai-cyan/20 border border-ai-cyan/30 flex items-center justify-center text-xs font-mono font-bold text-ai-cyan">
            2
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              Verify Cross-Account External ID Handshake
            </h3>
            <p className="text-xs text-text-secondary">
              Protects against the confused-deputy vulnerability by validating the STS External ID parameter.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border text-xs space-y-2">
          <div className="flex items-center justify-between font-mono">
            <span className="text-text-muted">Target Role ARN:</span>
            <span className="text-text-primary font-bold">
              arn:aws:iam::123456789012:role/CloudGuardAIReadOnlyRole
            </span>
          </div>
          <div className="flex items-center justify-between font-mono">
            <span className="text-text-muted">Assumed External ID:</span>
            <span className="text-purple-300 font-bold">cg-ext-uuid-984210</span>
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div className="glass-panel rounded-2xl border border-border p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-mono font-bold text-emerald-400">
            3
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              Execute STS AssumeRole & Initiate Baseline Discovery
            </h3>
            <p className="text-xs text-text-secondary">
              Test read-only API access against EC2, S3, IAM, and CloudWatch metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="ai"
            size="md"
            onClick={handleTestConnection}
            disabled={testing}
          >
            {testing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing sts:AssumeRole...
              </>
            ) : testSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
                Connection Verified!
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Verify Connection & Audit Access
              </>
            )}
          </Button>

          {testSuccess && (
            <span className="text-xs font-mono text-emerald-400">
              ✓ 184 resources detected in us-east-1, us-west-2, eu-west-1
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
