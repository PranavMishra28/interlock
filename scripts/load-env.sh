# Parse a dotenv file as inert KEY=VALUE data. Source this file; do not
# execute a secret-bearing `.env`.
load_interlock_env() {
  local envfile="${1:-.env}"
  [ -f "$envfile" ] || return 0
  local line key value
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    case "$line" in ""|\#*) continue ;; esac
    case "$line" in
      [A-Z_]*) ;;
      *) continue ;;
    esac
    key="${line%%=*}"
    case "$key" in
      *[!=A-Z0-9_]*) continue ;;
      PATH|BASH_ENV|ENV|SHELLOPTS|NODE_OPTIONS|LD_*|DYLD_*|NPM_CONFIG_*) continue ;;
    esac
    value="${line#*=}"
    case "$value" in
      \"*\") value="${value:1:${#value}-2}" ;;
      \'*\') value="${value:1:${#value}-2}" ;;
    esac
    printf -v "$key" '%s' "$value"
    export "$key"
  done < "$envfile"
}
