import type { Invocation, RunRequest } from '../types.js';
import { BaseAdapter } from './base.js';

// Google retired standalone Gemini CLI access for individual (free/Pro/Ultra)
// accounts on 2026-06-18 — attempting to run any preset below now fails with
// IneligibleTierError even though `tools discover` still finds the `gemini`
// binary on disk (it was never uninstalled). This adapter is kept only for
// users with enterprise/workspace Gemini CLI access that's still entitled.
// For everyone else, AntigravityAdapter (`agy`) is the live Gemini path —
// none of the models below carry `recommended: true` so `counselors init`
// doesn't steer new users toward a preset that will fail on first run.
export class GeminiAdapter extends BaseAdapter {
  id = 'gemini';
  displayName = 'Gemini CLI';
  commands = ['gemini'];
  installUrl = 'https://github.com/google-gemini/gemini-cli';
  readOnly = { level: 'enforced' as const };
  models = [
    {
      id: 'gemini-3-pro',
      name: 'Gemini 3 Pro — latest',
      extraFlags: ['-m', 'gemini-3-pro-preview'],
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro — stable GA',
      extraFlags: ['-m', 'gemini-2.5-pro'],
    },
    {
      id: 'gemini-3-flash',
      name: 'Gemini 3 Flash — fast',
      extraFlags: ['-m', 'gemini-3-flash-preview'],
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash — fast GA',
      extraFlags: ['-m', 'gemini-2.5-flash'],
    },
  ];

  buildInvocation(req: RunRequest): Invocation {
    const args = ['-p', ''];

    if (req.extraFlags) {
      args.push(...req.extraFlags);
    }

    if (req.readOnlyPolicy !== 'none') {
      args.push(
        '--extensions',
        '',
        '--allowed-tools',
        'read_file',
        'list_directory',
        'search_file_content',
        'glob',
        'google_web_search',
        'codebase_investigator',
      );
    }

    args.push('--output-format', 'text');

    // Gemini CLI includes tool-use narration ("I will read...", "I will list...")
    // in its headless text output. Append an instruction to suppress it.
    const prompt =
      req.prompt +
      '\n\nIMPORTANT: Do not narrate your tool usage, internal planning, or chain of thought. Start your response directly with your analysis. Do not prefix your response with lines like "I will read..." or "I will list...".';

    return {
      cmd: req.binary ?? 'gemini',
      args,
      stdin: prompt,
      cwd: req.cwd,
    };
  }
}
