# 06 Proxmox LXC Deployment Plan

Status: 🟡 Planning

## 1. Deployment Objective

Provide a repeatable local deployment on Proxmox LXC where the full app stack is available after setup with minimal manual steps.

## 2. Assumptions

1. Debian/Ubuntu LXC template.
2. Docker + Compose available in container.
3. Local network access to the host IP.
4. No public internet exposure required.

## 3. LXC Baseline Recommendations

1. CPU: 2+ cores.
2. RAM: 4-8 GB.
3. Storage: 30+ GB (depending on ETF history and backup retention).
4. Static LAN IP recommended.

## 4. Runtime Topology in LXC

All services run inside one LXC via Docker Compose:

1. `web`
2. `api`
3. `worker`
4. `scheduler`
5. `postgres`
6. `redis`

## 5. Installation Workflow (Target)

### Step 1: System prep

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl git
```

### Step 2: Install Docker/Compose

```bash
# install docker engine + compose plugin
```

### Step 3: App checkout

```bash
git clone <repo-url> /opt/goldfinch
cd /opt/goldfinch
```

### Step 4: Configure env

```bash
cp infra/.env.example infra/.env
# edit infra/.env with local values
```

### Step 5: Start stack

```bash
docker compose -f infra/docker-compose.yml up -d --build
```

### Step 6: Verify

```bash
curl http://localhost:8000/health
curl http://localhost:3000
```

## 6. Network Hardening for Local-Only Use

1. Bind web UI only to LAN interface or trusted subnet.
2. Keep API/DB/Redis internal to compose network.
3. Restrict host firewall to trusted clients.
4. Do not open ports to WAN.

## 7. Upgrade Workflow

```bash
cd /opt/goldfinch
git pull
# optional: backup before migrations
./infra/scripts/backup.sh

docker compose -f infra/docker-compose.yml up -d --build
```

## 8. Rollback Workflow (MVP)

1. Restore last DB backup.
2. Re-deploy previous git tag/commit.
3. Start stack.
4. Run smoke tests.

## 9. Operational Runbook (Minimum)

1. Start/stop/restart commands.
2. How to inspect logs per service.
3. How to trigger manual ETF/FX updates.
4. How to run backup and restore.
5. How to rotate secrets/passwords.

## 10. Deployment Acceptance Criteria

1. New LXC can be provisioned from scratch with documentation.
2. App is reachable via LAN browser.
3. Background jobs execute without manual process babysitting.
4. Backup and restore tested on same LXC.

