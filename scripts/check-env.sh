#!/usr/bin/env bash
# Pre-flight. Runs before `npm run dev`. Fails loudly with a numbered list of
# exactly what to fix, because a silent misconfiguration costs a hackathon team
# more than a noisy one.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RED=$'\033[31m'; YLW=$'\033[33m'; GRN=$'\033[32m'; DIM=$'\033[2m'; OFF=$'\033[0m'
errors=(); warnings=()

fail() { errors+=("$1"); }
warn() { warnings+=("$1"); }

# ── node ─────────────────────────────────────────────────────────────────────
if ! command -v node >/dev/null 2>&1; then
  fail "Node.js is not installed. This kit needs Node 22+ (global WebSocket)."
else
  major="$(node -p 'process.versions.node.split(".")[0]')"
  if [ "$major" -lt 22 ]; then
    fail "Node $(node -v) is too old. Channels needs Node 22+ for global WebSocket. Try: nvm use 22"
  fi
fi

# ── .env ─────────────────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  fail ".env is missing. Run: cp .env.example .env   then choose MODEL_PROVIDER and fill in its API key."
else
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    case "$line" in ""|\#*) continue ;; esac
    if [[ ! "$line" =~ ^[A-Z_][A-Z0-9_]*= ]]; then
      fail ".env contains an invalid line; use strict KEY=VALUE entries only."
      continue
    fi
    key="${line%%=*}"
    value="${line#*=}"
    case "$key" in
      PATH|BASH_ENV|ENV|SHELLOPTS|NODE_OPTIONS|LD_*|DYLD_*|NPM_CONFIG_*)
        fail ".env may not set process-control variable $key."
        continue
        ;;
    esac
    case "$value" in
      \"*\") value="${value:1:${#value}-2}" ;;
      \'*\') value="${value:1:${#value}-2}" ;;
    esac
    printf -v "$key" '%s' "$value"
    export "$key"
  done < .env
fi

configured() {
  case "${1:-}" in ""|stub-replace-me) printf missing ;; *) printf configured ;; esac
}

if [ "${1:-}" = --doctor ]; then
  openai="$(configured "${OPENAI_API_KEY:-}")"
  if [ -n "${INTELLIGENCE_API_KEY:-}" ] && [ -n "${CHANNEL_CODE:-}" ]; then
    copilotkit=configured
  else
    copilotkit=missing
  fi
  if [ -n "${INTERLOCK_SLACK_WORKSPACE_ID:-}" ] &&
     [ -n "${INTERLOCK_SLACK_CHANNEL_ID:-}" ] &&
     [ -n "${INTERLOCK_OWNER_ID:-}" ]; then
    slack=configured
  else
    slack=missing
  fi
  # Reported apart from the platform IDs on purpose. These two are what the
  # CLI attaches to the managed Channel, and without them Slack stays absent
  # in Intelligence however complete the rest of the file looks. Collapsing
  # them into one "SLACK_* configured" line reads as ready when ingress
  # cannot start at all.
  if [ -n "${INTELLIGENCE_CHANNEL_INTERLOCK_SLACK_BOT_TOKEN:-}" ] &&
     [ -n "${INTELLIGENCE_CHANNEL_INTERLOCK_SLACK_SIGNING_SECRET:-}" ]; then
    slack_credentials=configured
  else
    slack_credentials=missing
  fi
  gcp=missing
  if [ -n "${GOOGLE_CLOUD_PROJECT:-}" ] &&
     [ -f "${HOME}/.config/gcloud/application_default_credentials.json" ]; then
    gcp=configured
  fi
  printf '%-22s %s\n' "OPENAI_API_KEY" "$openai"
  printf '%-22s %s\n' "COPILOTKIT_*" "$copilotkit"
  printf '%-22s %s\n' "SLACK_* identities" "$slack"
  printf '%-22s %s\n' "SLACK attach creds" "$slack_credentials"
  case "${INTERLOCK_SLACK_APP_TOKEN:-${SLACK_APP_TOKEN:-${INTELLIGENCE_CHANNEL_INTERLOCK_SLACK_APP_TOKEN:-}}}" in
    xapp-*) slack_socket=configured ;;
    *) slack_socket=missing ;;
  esac
  printf '%-22s %s\n' "SLACK Socket Mode" "$slack_socket"
  printf '%-22s %s\n' "GCP identity" "$gcp"
  if [ "$slack_socket" = configured ]; then
    printf '\nSocket Mode token is present. Unmentioned #incidents messages use the direct listener, not the managed mention-only adapter.\n'
  elif [ "$slack_credentials" != configured ]; then
    printf '\nSlack attach credentials are absent, so the managed Channel cannot\nbind and no message can enter ingress. Confirm with: npm run channel:status\n'
  fi
  exit 0
fi

# Keep provider/model normalization aligned with agent-core/src/model.ts.
trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}
canonical_provider() {
  local value
  value="$(trim "$1" | tr '[:upper:]' '[:lower:]')"
  case "$value" in gemini|google-gemini) value=google ;; esac
  printf '%s' "$value"
}

# ── tier 0 ───────────────────────────────────────────────────────────────────
if [ -f .env ]; then
  model="$(trim "${MODEL:-gpt-5.4-mini-2026-03-17}")"
  model_id="$model"
  model_provider=""
  case "$model" in
    *[:/]*) candidate_prefix="$(canonical_provider "${model%%[:/]*}")"
             # A bare model's ':free' or ':nitro' suffix is not a provider.
             case "$model" in
               "${model%%[:/]*}/"*) model_provider="$candidate_prefix" ;;
               *) case "$candidate_prefix" in
                    openai|openrouter|anthropic|google) model_provider="$candidate_prefix" ;;
                  esac ;;
             esac
             [ -n "$model_provider" ] && model_id="$(trim "${model#*[:/]}")" ;;
  esac
  [ -z "$model_id" ] && fail "MODEL must include a non-empty model identifier."
  provider="$(canonical_provider "${MODEL_PROVIDER:-}")"
  if [ -z "$provider" ]; then
    if [ -n "${OPENROUTER_API_KEY:-}" ]; then provider=openrouter
    else provider="${model_provider:-openai}"; fi
  fi
  key_name=""
  case "$provider" in
    openai) key_name=OPENAI_API_KEY ;;
    openrouter) key_name=OPENROUTER_API_KEY ;;
    anthropic) key_name=ANTHROPIC_API_KEY ;;
    google) key_name=GOOGLE_API_KEY ;;
    *) fail "Unsupported model provider '$provider'. Set MODEL_PROVIDER to openai, openrouter, anthropic, or google." ;;
  esac
  if [ "$provider" != openrouter ] && [ -n "$model_provider" ] && [ "$model_provider" != "$provider" ]; then
    fail "MODEL provider '$model_provider' does not match MODEL_PROVIDER '$provider'."
  fi
  if [ -n "$key_name" ]; then
    case "${!key_name:-}" in
      "") fail "$key_name is empty. Configure credentials for $provider." ;;
      stub-replace-me) fail "$key_name is still the placeholder. Configure credentials for $provider." ;;
    esac
  fi
  if [ "${1:-}" = --voice ]; then
    case "${OPENAI_API_KEY:-}" in
      ""|stub-replace-me) fail "OPENAI_API_KEY is required separately for OpenAI Realtime voice, even when chat uses $provider." ;;
    esac
  fi
  [ -z "${MODEL:-}" ] && warn "MODEL is unset; falling back to gpt-5.4-mini-2026-03-17."

  # ── tier 1: all-or-nothing. Half-configured Channels is the worst state. ──
  if [ -n "${INTELLIGENCE_API_KEY:-}" ] || [ -n "${CHANNEL_CODE:-}" ]; then
    [ -z "${INTELLIGENCE_API_KEY:-}" ] && fail "CHANNEL_CODE is set but INTELLIGENCE_API_KEY is not. Create a project-scoped key under API Keys in the Intelligence sidebar."
    [ -z "${CHANNEL_CODE:-}" ]         && fail "INTELLIGENCE_API_KEY is set but CHANNEL_CODE is not. Copy the Channel Code from Intelligence — exactly."
    # The runtime parses the project id out of the key and fails activation if
    # it cannot. Catch a wrong-format key here instead of at startup.
    if [ -n "${INTELLIGENCE_API_KEY:-}" ]; then
      case "$INTELLIGENCE_API_KEY" in
        cpk-*_*) ;;
        *) warn "INTELLIGENCE_API_KEY does not look like 'cpk-{projectId}_...'. The runtime parses the project id out of it and Channel activation will fail with ChannelConfigError. Copy it from API Keys in the Intelligence project sidebar." ;;
      esac
    fi

    if [ -n "${CHANNEL_CODE:-}" ]; then
      if ! printf '%s' "$CHANNEL_CODE" | grep -Eq '^[a-z][a-z0-9]*(-[a-z0-9]+)*$'; then
        fail "CHANNEL_CODE '$CHANNEL_CODE' is not a valid Channel Code: lowercase letters and digits separated by single hyphens, starting with a letter."
      fi
      [ ${#CHANNEL_CODE} -lt 3 ] && fail "CHANNEL_CODE '$CHANNEL_CODE' is shorter than 3 characters."
      [ "$CHANNEL_CODE" = "channels" ] && fail "CHANNEL_CODE cannot be the literal 'channels'."
    fi
    if [ -n "${INTELLIGENCE_API_URL:-}" ] && [ -z "${INTELLIGENCE_GATEWAY_WS_URL:-}" ]; then
      fail "INTELLIGENCE_API_URL is set without INTELLIGENCE_GATEWAY_WS_URL. They are separate hosts — override both or neither."
    fi
    if [ -n "${INTELLIGENCE_GATEWAY_WS_URL:-}" ] && [ -z "${INTELLIGENCE_API_URL:-}" ]; then
      fail "INTELLIGENCE_GATEWAY_WS_URL is set without INTELLIGENCE_API_URL. They are separate hosts — override both or neither."
    fi
  else
    warn "Slack is not configured — the agent will not appear there. Run: npm run channel:setup"
  fi

  # ── tier 2 ────────────────────────────────────────────────────────────────
  if [ -n "${EXA_API_KEY:-}" ]; then
    case "${EXA_SEARCH_TYPE:-fast}" in
      instant|fast|auto|deep-lite|deep|deep-reasoning) ;;
      *) fail "EXA_SEARCH_TYPE '$EXA_SEARCH_TYPE' is not a valid Exa search type (instant|fast|auto|deep-lite|deep|deep-reasoning)." ;;
    esac
    case "${EXA_SEARCH_TYPE:-fast}" in
      deep|deep-reasoning) warn "EXA_SEARCH_TYPE=$EXA_SEARCH_TYPE takes 4-40s per call. That reads as a hung bot in a chat thread — prefer instant or fast." ;;
    esac
  else
    warn "EXA_API_KEY not set — the web search tool will not be registered."
  fi

  if [ -z "${AMBIGUOUS_API_KEY:-}" ]; then
    warn "AMBIGUOUS_API_KEY not set — the agent has no workplace to act in (no mail/tasks/CRM tools)."
  fi
fi

# ── deps ─────────────────────────────────────────────────────────────────────
[ -d node_modules ] && [ ! -d node_modules/@copilotkit/channels ] && \
  fail "Dependencies look incomplete (@copilotkit/channels is missing). Run: npm ci --no-audit --no-fund"
[ ! -d node_modules ] && fail "Dependencies are not installed. Run: npm ci --no-audit --no-fund"

# ── report ───────────────────────────────────────────────────────────────────
if [ ${#warnings[@]} -gt 0 ]; then
  printf '\n%sHeads up%s\n' "$YLW" "$OFF"
  for i in "${!warnings[@]}"; do printf '  %s·%s %s\n' "$DIM" "$OFF" "${warnings[$i]}"; done
fi

if [ ${#errors[@]} -gt 0 ]; then
  printf '\n%sPre-flight failed — %d thing(s) to fix%s\n\n' "$RED" "${#errors[@]}" "$OFF"
  for i in "${!errors[@]}"; do printf '  %s%d.%s %s\n' "$RED" "$((i+1))" "$OFF" "${errors[$i]}"; done
  printf '\n  %sOperator steps: docs/RUNBOOK.md%s\n\n' "$DIM" "$OFF"
  exit 1
fi

printf '\n%s✓%s pre-flight clean\n\n' "$GRN" "$OFF"
