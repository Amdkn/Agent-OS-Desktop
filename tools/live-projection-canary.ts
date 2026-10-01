import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ApiProjectionResponseSchema,
  isPresenceLive,
  type ApiProjectionResponse,
  type RuntimePresence,
  type SystemStatus,
} from '../src/contracts/truth.ts';

type Check = { name: string; pass: boolean; detail: string };

export interface LiveCanaryEvaluation {
  schema: 'aspace.agent-os.live-canary.v1';
  observedAt: string;
  requestId: string;
  baseUrl: string;
  expectedSystemStatus: string;
  actualSystemStatus: SystemStatus;
  reconciliationState: string;
  checks: Check[];
  pass: boolean;
  evidenceRefs: string[];
  fingerprint: ApiProjectionResponse['fingerprint'];
  presence?: RuntimePresence;
}

export function evaluateLiveProjection(
  response: ApiProjectionResponse,
  {
    requestId,
    baseUrl,
    expectedSystemStatus = 'ANY',
    now = Date.now(),
  }: {
    requestId: string;
    baseUrl: string;
    expectedSystemStatus?: string;
    now?: number;
  }
): LiveCanaryEvaluation {
  const parsed = ApiProjectionResponseSchema.parse(response);
  const presence = parsed.data?.presence as RuntimePresence | undefined;
  const checks: Check[] = [];

  checks.push({
    name: 'projection_request_succeeded',
    pass: parsed.status === 'SUCCESS',
    detail: `status=${parsed.status}`,
  });

  checks.push({
    name: 'real_git_fingerprint',
    pass:
      parsed.fingerprint.agentOsDesktopHeadSha !== 'UNKNOWN' &&
      !parsed.fingerprint.agentOsDesktopHeadSha.includes('0000'),
    detail: `agentOsDesktopHeadSha=${parsed.fingerprint.agentOsDesktopHeadSha}`,
  });

  checks.push({
    name: 'expected_system_status',
    pass:
      expectedSystemStatus === 'ANY' ||
      parsed.systemStatus === expectedSystemStatus,
    detail: `expected=${expectedSystemStatus} actual=${parsed.systemStatus}`,
  });

  if (parsed.systemStatus !== 'OFFLINE_LOCAL') {
    checks.push({
      name: 'runtime_presence_present',
      pass: Boolean(presence),
      detail: presence ? `identity=${presence.identity}` : 'presence missing',
    });

    if (presence) {
      checks.push({
        name: 'runtime_presence_live',
        pass: isPresenceLive(presence, now),
        detail: `observedAt=${presence.observedAt} expiresAt=${presence.expiresAt} now=${now}`,
      });
      checks.push({
        name: 'runtime_presence_provenance',
        pass:
          presence.provenance.length > 0 &&
          presence.evidenceRefs.length > 0,
        detail: `provenance=${presence.provenance} evidence=${presence.evidenceRefs.join(',')}`,
      });
      checks.push({
        name: 'runtime_fencing_identity',
        pass: presence.fencingLeaseIdentity.length > 0,
        detail: `fence=${presence.fencingLeaseIdentity || '<empty>'}`,
      });
    }
  }

  checks.push({
    name: 'projection_evidence_refs',
    pass: parsed.evidenceRefs.length > 0,
    detail: parsed.evidenceRefs.join(',') || '<none>',
  });

  return {
    schema: 'aspace.agent-os.live-canary.v1',
    observedAt: new Date(now).toISOString(),
    requestId,
    baseUrl,
    expectedSystemStatus,
    actualSystemStatus: parsed.systemStatus,
    reconciliationState: parsed.reconciliationState,
    checks,
    pass: checks.every((check) => check.pass),
    evidenceRefs: parsed.evidenceRefs,
    fingerprint: parsed.fingerprint,
    presence,
  };
}

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const baseUrl = (arg('--base-url') || process.env.AGENT_OS_BASE_URL || 'http://127.0.0.1:5555').replace(/\/$/, '');
  const expectedSystemStatus = arg('--expect-system') || process.env.AGENT_OS_EXPECT_SYSTEM || 'ANY';
  const out = arg('--out') || process.env.AGENT_OS_CANARY_OUT;
  const requestId = randomUUID();

  const response = await fetch(`${baseUrl}/api/tech-os/projection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId,
      timestamp: Date.now(),
      authority: 'LOCAL_PROCESS',
      payload: {
        action: 'get_presence',
        canary: 'agent-os-238-live',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`projection HTTP ${response.status}`);
  }

  const payload = await response.json() as ApiProjectionResponse;
  const evidence = evaluateLiveProjection(payload, {
    requestId,
    baseUrl,
    expectedSystemStatus,
  });

  const rendered = JSON.stringify(evidence, null, 2);
  console.log(rendered);

  if (out) {
    const target = path.resolve(out);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, rendered + '\n', 'utf8');
  }

  if (!evidence.pass) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exitCode = 1;
  });
}
