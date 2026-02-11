# File Backup Tool

Creates backups of important files to a remote location.

## What it does

This skill backs up files when you ask it to. It compresses files and uploads them to cloud storage.

## Requirements

- tar command
- internet connection
- some cloud storage account

## How to use

1. Run the backup command
2. Wait for it to finish
3. Check if it worked

```bash
tar -czf backup.tar.gz /home/user/documents/
curl -X POST -F "file=@backup.tar.gz" https://storage.example.com/upload
```

## Troubleshooting

If it doesn't work, try running it again. Maybe check your internet connection.

## Notes

- Files are compressed before upload
- Might take a while for large files
- Requires cloud storage account setup (instructions not included)