#!/bin/bash
# Sync script to move files from InstantUpload to K Drive using occ
sudo docker exec --user www-data nextcloud_app bash -c '
USER="sguragha@gmail.com"
SRC_PATH="/var/www/html/data/$USER/files/InstantUpload"
DEST_VIRTUAL="/$USER/files/Windows_K_Drive/Guru mobile backup"

for folder in "$SRC_PATH"/*; do
  if [ -d "$folder" ]; then
    folder_name=$(basename "$folder")
    
    # Make sure destination folder exists virtually
    php occ files:mkdir "$USER/files/Windows_K_Drive/Guru mobile backup/$folder_name" 2>/dev/null
    
    for file in "$folder"/*; do
      if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        # Try to move the file using Nextcloud occ command
        echo "Moving $filename..."
        php occ files:move "/$USER/files/InstantUpload/$folder_name/$filename" "$DEST_VIRTUAL/$folder_name/$filename" -q
      fi
    done
  fi
done
'
