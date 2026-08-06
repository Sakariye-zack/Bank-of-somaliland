$SERVER = "root@169.58.138.184"
$DEST_DIR = "/opt/bos-website"

Write-Host "Compressing source files (excluding node_modules)..."
tar --exclude="node_modules" --exclude=".git" --exclude="dist" -czf bos-website.tar.gz apps packages docker-compose.prod.yml Caddyfile package.json package-lock.json

Write-Host "Creating destination directory on server (You might be prompted for your password)..."
ssh $SERVER "mkdir -p $DEST_DIR"

Write-Host "Copying compressed file to server (You might be prompted for your password)..."
scp bos-website.tar.gz "$SERVER`:$DEST_DIR/"

Write-Host "Installing Docker (if needed) and starting containers on server (You might be prompted for your password)..."
ssh $SERVER "cd $DEST_DIR && tar -xzf bos-website.tar.gz && if ! command -v docker &> /dev/null; then curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh; fi && docker compose -f docker-compose.prod.yml build && docker compose -f docker-compose.prod.yml up -d"

Write-Host "Cleaning up local compressed file..."
Remove-Item bos-website.tar.gz

Write-Host "Deployment completed successfully! Hubi in server-ku si fiican u shaqaynayo."
