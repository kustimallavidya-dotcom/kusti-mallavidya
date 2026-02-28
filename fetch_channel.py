import urllib.request
import re
import sys

url = "https://www.youtube.com/@kustimallavidya"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    # Find any UC... string that's 24 chars long
    match = re.search(r'(UC[a-zA-Z0-9_-]{22})', html)
    if match:
        channel_id = match.group(1)
        uploads_playlist_id = 'UU' + channel_id[2:]
        print(f"FOUND: {uploads_playlist_id}")
    else:
        print("Channel ID not found in HTML.")
except Exception as e:
    print(f"Error: {e}")
