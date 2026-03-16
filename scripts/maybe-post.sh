#!/bin/bash
# Runs daily via cron. Posts at a random time, a random number of times per week.
# Config: POSTS_MIN, POSTS_MAX, WINDOW_START, WINDOW_END (hours, 0-23)

POSTS_MIN=${POSTS_MIN:-3}
POSTS_MAX=${POSTS_MAX:-5}
WINDOW_START=${WINDOW_START:-8}   # 8am
WINDOW_END=${WINDOW_END:-20}      # 8pm

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
WEEK_FILE="$REPO_DIR/.cache/week-schedule.json"

mkdir -p "$REPO_DIR/.cache"

# Get current week number (YYYY-WW)
CURRENT_WEEK=$(date +"%Y-%U")
TODAY_DOW=$(date +"%u")  # 1=Mon ... 7=Sun

# Regenerate schedule if it's a new week
SCHEDULE_WEEK=$(cat "$WEEK_FILE" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('week',''))" 2>/dev/null || echo "")

if [ "$SCHEDULE_WEEK" != "$CURRENT_WEEK" ]; then
  python3 - <<PYEOF
import json, random

posts_min = int("$POSTS_MIN")
posts_max = int("$POSTS_MAX")
window_start = int("$WINDOW_START")
window_end = int("$WINDOW_END")

count = random.randint(posts_min, posts_max)
days = sorted(random.sample(range(1, 8), count))  # pick unique days Mon-Sun

schedule = {}
for day in days:
    hour = random.randint(window_start, window_end - 1)
    minute = random.randint(0, 59)
    schedule[str(day)] = f"{hour:02d}:{minute:02d}"

data = {"week": "$CURRENT_WEEK", "schedule": schedule}
with open("$WEEK_FILE", "w") as f:
    json.dump(data, f, indent=2)

print(f"New schedule for week $CURRENT_WEEK: {schedule}")
PYEOF
fi

# Check if today is a post day and get scheduled time
SCHEDULED_TIME=$(python3 -c "
import json, sys
try:
    with open('$WEEK_FILE') as f:
        data = json.load(f)
    print(data['schedule'].get('$TODAY_DOW', ''))
except:
    print('')
" 2>/dev/null)

if [ -z "$SCHEDULED_TIME" ]; then
  echo "$(date): Not a post day this week (day $TODAY_DOW). Skipping."
  exit 0
fi

# Sleep until scheduled time
NOW_SECONDS=$(date +%s)
SCHED_HOUR=$(echo "$SCHEDULED_TIME" | cut -d: -f1)
SCHED_MIN=$(echo "$SCHEDULED_TIME" | cut -d: -f2)
TARGET_SECONDS=$(date -v${SCHED_HOUR}H -v${SCHED_MIN}M -v0S +%s 2>/dev/null || \
  date --date="today $SCHED_HOUR:$SCHED_MIN:00" +%s 2>/dev/null)

SLEEP_SECS=$((TARGET_SECONDS - NOW_SECONDS))

if [ "$SLEEP_SECS" -lt 0 ]; then
  echo "$(date): Scheduled time $SCHEDULED_TIME already passed today. Skipping."
  exit 0
fi

echo "$(date): Posting today at $SCHEDULED_TIME — sleeping ${SLEEP_SECS}s"
sleep "$SLEEP_SECS"

cd "$REPO_DIR" && node dist/index.js run
