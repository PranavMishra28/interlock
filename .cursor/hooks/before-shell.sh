#!/usr/bin/env bash
set -euo pipefail
input=$(cat)
command=$(printf '%s' "$input" | jq -r '.command // ""')
decision=allow
reason=

# Defense in depth, not a sandbox: normalize absolute paths and `git -c x=y`
# wrappers so one obvious spelling change does not slip past the patterns.
normalized=$(printf '%s' "$command" |
  sed -E 's@(^|[;&|[:space:]])/[^[:space:]]*/([a-z0-9_.-]+)@\1\2@g' |
  sed -E 's@(^|[;&|[:space:]])git([[:space:]]+-c[[:space:]]+[^[:space:]]+)+@\1git@g')

if [[ "$normalized" =~ git[[:space:]]+push.*(--force|-f([[:space:]]|$)|[[:space:]]\+) ]] ||
   [[ "$normalized" =~ git[[:space:]]+reset.*--hard ]] ||
   [[ "$normalized" =~ git[[:space:]]+checkout[[:space:]]+-- ]] ||
   [[ "$normalized" =~ git[[:space:]]+clean([[:space:]]|$) ]] ||
   [[ "$normalized" =~ git[[:space:]]+add.*(-f([[:space:]]|$)|--force) ]] ||
   [[ "$normalized" =~ git[[:space:]]+branch[[:space:]]+-(d|D) ]] ||
   [[ "$normalized" =~ git[[:space:]]+tag.*(-d([[:space:]]|$)|--delete|--force|-f([[:space:]]|$)) ]] ||
   [[ "$normalized" =~ git[[:space:]]+(rebase|filter-branch|filter-repo)([[:space:]]|$) ]] ||
   [[ "$normalized" =~ git[[:space:]]+commit.*--amend ]] ||
   [[ "$normalized" =~ git[[:space:]]+config.*--global ]] ||
   [[ "$normalized" =~ git[[:space:]]+config.*(user\.name|user\.email)[[:space:]]+[^[:space:]]+ ]] ||
   [[ "$normalized" =~ gh[[:space:]]+pr[[:space:]]+merge.*--admin ]] ||
   [[ "$normalized" =~ (^|[;&|])[[:space:]]*(env|printenv|export[[:space:]]+-p|set)[[:space:]]*($|[;&|]) ]] ||
   [[ "$normalized" =~ set[[:space:]]+(-x|-o[[:space:]]+xtrace) ]]; then
  decision=deny
  reason="Repository policy forbids this destructive, identity-changing, or secret-dumping command."
elif [[ "$normalized" =~ rm[[:space:]]+(-([^[:space:]]*r[^[:space:]]*f|[^[:space:]]*f[^[:space:]]*r)|--recursive|--force) ]] ||
     [[ "$normalized" =~ npm[[:space:]]+publish ]] ||
     [[ "$normalized" =~ gcloud.*(deploy|update-traffic|add-iam-policy-binding|services[[:space:]]+enable|projects[[:space:]]+create|billing|auth[[:space:]]+login|application-default[[:space:]]+login) ]] ||
     [[ "$normalized" =~ (terraform|tofu)[[:space:]]+(apply|destroy) ]] ||
     [[ "$normalized" =~ kubectl[[:space:]]+(apply|delete) ]]; then
  decision=ask
  reason="This command can delete data, publish, authenticate, provision, change IAM/billing, or deploy. Confirm scope and budget."
fi

printf '%s\tbeforeShellExecution:%s\n' "$(date -u +%FT%TZ)" "$decision" \
  >> "$(git rev-parse --git-dir)/interlock-hook-events"
jq -n --arg permission "$decision" --arg message "$reason" '
  if $permission == "allow" then {permission: "allow"}
  else {permission: $permission, user_message: $message, agent_message: $message}
  end
'
