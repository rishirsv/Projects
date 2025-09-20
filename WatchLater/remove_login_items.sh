#!/usr/bin/env bash

# For Terminal clarity
set -e

echo "Starting removal of specified login items…"

# 1. Remove via sfltool (Login Items)
for label in "Sidekick" "BattFi" "TNT - why join the navy if you can be a pirate"; do
  echo "Attempting: sudo sfltool remove --label \"$label\""
  sudo sfltool remove --label "$label" || echo "Could not remove $label via sfltool—maybe it's not a true Login Item."
done

# 2. Unload and delete LaunchAgent-style items
# Adjust paths based on where the .plist lives. Here's what your log suggests:
plist_paths=(
  "$HOME/.Trash/Sidekick.app/Contents/Library/LoginItems/Sidekick"   # example path
  "/Applications/BattFi.app/Contents/Library/LaunchAgents/com.batfi.plist"  # hypothetical
  "/Library/LaunchAgents/com.daisydiskapp.DaisyDiskStandAlone.AdminHelper.plist"  # suggested by the TNT entry
)

for plist in "${plist_paths[@]}"; do
  if [[ -f "$plist" ]]; then
    echo "Unloading: sudo launchctl unload \"$plist\""
    sudo launchctl unload "$plist" || echo "Unload failed (maybe already disabled)"
    echo "Deleting: sudo rm \"$plist\""
    sudo rm "$plist" || echo "Delete failed (check permissions?)"
  else
    echo "Not found: $plist"
  fi
done

echo "Done. You may want to restart or log out/in to confirm changes."

